from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from ..database import get_db, execute_query
from ..utils.auth import get_current_user

router = APIRouter(prefix="/payslips", tags=["payslips"])

@router.get("/salary/{salary_id}")
async def get_payslip_by_salary(salary_id: int, current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    # 1. Fetch salary and employee details in a single query
    query = """
        SELECT s.*, 
               CONCAT(e.first_name, ' ', e.last_name) AS employee_name, 
               e.email, e.phone, e.designation, e.user_id,
               d.name AS department_name
        FROM salaries s 
        JOIN employees e ON s.employee_id = e.id 
        LEFT JOIN departments d ON e.department_id = d.id 
        WHERE s.id = %s
    """
    salary = execute_query(conn, query, (salary_id,), fetch="one")
    if not salary:
        raise HTTPException(status_code=404, detail="Salary record not found")
        
    # Check permissions
    if current_user["role"] == "employee":
        if current_user["user_id"] != salary["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
            
    if salary["payment_status"] != "Paid":
        raise HTTPException(status_code=400, detail="Payslip cannot be retrieved. Salary has not been paid yet.")
        
    # 2. Check/create payslip record
    payslip = execute_query(conn, "SELECT id, generated_date FROM payslips WHERE salary_id = %s", (salary_id,), fetch="one")
    if not payslip:
        # Create payslip on the fly if missing
        payslip_id = execute_query(conn, "INSERT INTO payslips (salary_id, employee_id) VALUES (%s, %s)", (
            salary_id, salary["employee_id"]
        ), fetch="none")
        payslip = {"id": payslip_id, "generated_date": datetime.utcnow()}
        
    # Format results
    response_data = {
        "id": payslip["id"],
        "salary_id": salary["id"],
        "employee_id": salary["employee_id"],
        "employee_name": salary["employee_name"],
        "email": salary["email"],
        "phone": salary["phone"],
        "designation": salary["designation"],
        "department_name": salary["department_name"] or "N/A",
        "payment_month": salary["payment_month"],
        "base_salary": float(salary["base_salary"]),
        "bonuses": float(salary["bonuses"]),
        "deductions": float(salary["deductions"]),
        "net_salary": float(salary["net_salary"]),
        "payment_status": salary["payment_status"],
        "payment_date": salary["payment_date"].strftime("%Y-%m-%d") if salary.get("payment_date") else None,
        "generated_date": payslip["generated_date"].strftime("%Y-%m-%d %H:%M:%S") if isinstance(payslip["generated_date"], datetime) else str(payslip["generated_date"])
    }
    
    return response_data
