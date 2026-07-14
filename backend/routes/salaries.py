from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from typing import Optional
from ..database import get_db, execute_query
from ..models.schemas import SalaryGenerateRequest
from ..utils.auth import get_current_user, get_current_admin
from ..services.salary_service import calculate_monthly_salary

router = APIRouter(prefix="/salaries", tags=["salaries"])

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_salaries(data: SalaryGenerateRequest, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    # 1. Fetch all active employees
    employees = execute_query(conn, "SELECT id FROM employees WHERE status = 'Active'", fetch="all")
    if not employees:
        return {"message": "No active employees found to generate salaries."}
        
    generated_count = 0
    errors = []
    
    # 2. Iterate and generate salary for each employee
    for emp in employees:
        emp_id = emp["id"]
        try:
            salary_data = calculate_monthly_salary(conn, emp_id, data.payment_month)
            
            # Upsert into MySQL
            upsert_query = """
                INSERT INTO salaries (employee_id, base_salary, bonuses, deductions, net_salary, payment_month, payment_status, payment_date)
                VALUES (%s, %s, %s, %s, %s, %s, 'Pending', NULL)
                ON DUPLICATE KEY UPDATE 
                    base_salary = VALUES(base_salary),
                    bonuses = VALUES(bonuses),
                    deductions = VALUES(deductions),
                    net_salary = VALUES(net_salary)
            """
            execute_query(conn, upsert_query, (
                salary_data["employee_id"],
                salary_data["base_salary"],
                salary_data["bonuses"],
                salary_data["deductions"],
                salary_data["net_salary"],
                salary_data["payment_month"]
            ), fetch="none")
            
            generated_count += 1
        except Exception as e:
            errors.append(f"Employee ID {emp_id}: {str(e)}")
            
    return {
        "message": f"Successfully processed {generated_count} salary records.",
        "errors": errors
    }

@router.get("")
async def get_salaries(month: Optional[str] = None, current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    query = """
        SELECT s.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name 
        FROM salaries s 
        JOIN employees e ON s.employee_id = e.id
    """
    params = []
    
    # 1. Check user role and construct query
    if current_user["role"] == "employee":
        employee = execute_query(conn, "SELECT id FROM employees WHERE user_id = %s", (current_user["user_id"],), fetch="one")
        if not employee:
            return []
        query += " WHERE s.employee_id = %s"
        params.append(employee["id"])
        
    if month:
        if "WHERE" in query:
            query += " AND s.payment_month = %s"
        else:
            query += " WHERE s.payment_month = %s"
        params.append(month)
        
    query += " ORDER BY s.payment_month DESC, e.first_name ASC"
    salaries = execute_query(conn, query, tuple(params), fetch="all")
    
    # Format floats and dates
    for sal in salaries:
        sal["base_salary"] = float(sal["base_salary"])
        sal["bonuses"] = float(sal["bonuses"])
        sal["deductions"] = float(sal["deductions"])
        sal["net_salary"] = float(sal["net_salary"])
        if sal.get("payment_date"):
            sal["payment_date"] = sal["payment_date"].strftime("%Y-%m-%d")
        if sal.get("created_at"):
            sal["created_at"] = sal["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            
    return salaries

@router.get("/{id}")
async def get_salary(id: int, current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    query = """
        SELECT s.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name 
        FROM salaries s 
        JOIN employees e ON s.employee_id = e.id 
        WHERE s.id = %s
    """
    salary = execute_query(conn, query, (id,), fetch="one")
    if not salary:
        raise HTTPException(status_code=404, detail="Salary record not found")
        
    # Check permissions
    if current_user["role"] == "employee":
        employee = execute_query(conn, "SELECT id FROM employees WHERE user_id = %s", (current_user["user_id"],), fetch="one")
        if not employee or employee["id"] != salary["employee_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
            
    salary["base_salary"] = float(salary["base_salary"])
    salary["bonuses"] = float(salary["bonuses"])
    salary["deductions"] = float(salary["deductions"])
    salary["net_salary"] = float(salary["net_salary"])
    if salary.get("payment_date"):
        salary["payment_date"] = salary["payment_date"].strftime("%Y-%m-%d")
    if salary.get("created_at"):
        salary["created_at"] = salary["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        
    return salary

@router.put("/{id}/payout")
async def update_payout(id: int, payment_status: str, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    if payment_status not in ["Paid", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'Paid' or 'Pending'")
        
    salary = execute_query(conn, "SELECT * FROM salaries WHERE id = %s", (id,), fetch="one")
    if not salary:
        raise HTTPException(status_code=404, detail="Salary record not found")
        
    payment_date = datetime.now().strftime("%Y-%m-%d") if payment_status == "Paid" else None
    
    execute_query(conn, "UPDATE salaries SET payment_status = %s, payment_date = %s WHERE id = %s", (
        payment_status, payment_date, id
    ), fetch="none")
    
    # Generate associated payslip record if status becomes Paid
    if payment_status == "Paid":
        existing_payslip = execute_query(conn, "SELECT id FROM payslips WHERE salary_id = %s", (id,), fetch="one")
        if not existing_payslip:
            execute_query(conn, "INSERT INTO payslips (salary_id, employee_id) VALUES (%s, %s)", (
                id, salary["employee_id"]
            ), fetch="none")
            
    return {"message": f"Salary status updated to {payment_status}."}
