from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from ..database import get_db, execute_query
from ..models.schemas import EmployeeCreate, EmployeeUpdate
from ..utils.auth import get_current_user, get_current_admin, hash_password

router = APIRouter(prefix="/employees", tags=["employees"])

@router.get("", response_model=list)
async def get_employees(search: str = "", current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    query = """
        SELECT e.*, d.name AS department_name 
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id
    """
    params = ()
    if search:
        query += """
            WHERE e.first_name LIKE %s 
               OR e.last_name LIKE %s 
               OR e.email LIKE %s 
               OR e.designation LIKE %s
        """
        search_param = f"%{search}%"
        params = (search_param, search_param, search_param, search_param)
        
    query += " ORDER BY e.id DESC"
    employees = execute_query(conn, query, params, fetch="all")
    
    # Format datetimes
    for emp in employees:
        if emp.get("created_at"):
            emp["created_at"] = emp["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        if emp.get("join_date"):
            emp["join_date"] = emp["join_date"].strftime("%Y-%m-%d")
        if emp.get("base_salary"):
            emp["base_salary"] = float(emp["base_salary"])
            
    return employees

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_employee(emp_data: EmployeeCreate, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    # 1. Check duplicate email in employee profiles
    existing_emp = execute_query(conn, "SELECT id FROM employees WHERE email = %s", (emp_data.email,), fetch="one")
    if existing_emp:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")
        
    # 2. Check duplicate email in users collection
    existing_user = execute_query(conn, "SELECT id FROM users WHERE email = %s", (emp_data.email,), fetch="one")
    
    user_id = None
    if not existing_user:
        # Create a new user account with default password Welcome@123
        hashed_pwd = hash_password("Welcome@123")
        insert_user_query = "INSERT INTO users (email, password_hash, role) VALUES (%s, %s, 'employee')"
        user_id = execute_query(conn, insert_user_query, (emp_data.email, hashed_pwd), fetch="none")
    else:
        user_id = existing_user["id"]
        # If user existed but role was not employee, upgrade/set it
        execute_query(conn, "UPDATE users SET role = 'employee' WHERE id = %s", (user_id,), fetch="none")

    # 3. Create the employee record
    insert_emp_query = """
        INSERT INTO employees (user_id, first_name, last_name, email, phone, department_id, designation, join_date, base_salary, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    # Handle optional department_id converting from None to NULL
    dept_id = emp_data.department_id if emp_data.department_id else None
    
    employee_id = execute_query(conn, insert_emp_query, (
        user_id,
        emp_data.first_name,
        emp_data.last_name,
        emp_data.email,
        emp_data.phone or "",
        dept_id,
        emp_data.designation or "",
        emp_data.join_date,
        emp_data.base_salary,
        emp_data.status
    ), fetch="none")
    
    return {
        "message": "Employee profile and user account created successfully",
        "employee_id": employee_id,
        "default_password": "Welcome@123"
    }

@router.get("/{id}")
async def get_employee(id: int, current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    query = """
        SELECT e.*, d.name AS department_name 
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id 
        WHERE e.id = %s
    """
    employee = execute_query(conn, query, (id,), fetch="one")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if employee.get("created_at"):
        employee["created_at"] = employee["created_at"].strftime("%Y-%m-%d %H:%M:%S")
    if employee.get("join_date"):
        employee["join_date"] = employee["join_date"].strftime("%Y-%m-%d")
    if employee.get("base_salary"):
        employee["base_salary"] = float(employee["base_salary"])
        
    return employee

@router.put("/{id}")
async def update_employee(id: int, emp_data: EmployeeUpdate, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    # Verify existence
    employee = execute_query(conn, "SELECT id, user_id FROM employees WHERE id = %s", (id,), fetch="one")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    update_query = """
        UPDATE employees 
        SET first_name = %s, last_name = %s, phone = %s, department_id = %s, designation = %s, base_salary = %s, status = %s 
        WHERE id = %s
    """
    dept_id = emp_data.department_id if emp_data.department_id else None
    
    execute_query(conn, update_query, (
        emp_data.first_name,
        emp_data.last_name,
        emp_data.phone or "",
        dept_id,
        emp_data.designation or "",
        emp_data.base_salary,
        emp_data.status,
        id
    ), fetch="none")
    
    return {"message": "Employee profile updated successfully"}

@router.delete("/{id}")
async def delete_employee(id: int, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    employee = execute_query(conn, "SELECT id, user_id FROM employees WHERE id = %s", (id,), fetch="one")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
        
    # 1. Delete associated user account (due to foreign key constraint with cascade, deleting the user will automatically cascade delete the employee profile and all linked records: attendance, leaves, salaries, payslips!)
    user_id = employee.get("user_id")
    if user_id:
        execute_query(conn, "DELETE FROM users WHERE id = %s", (user_id,), fetch="none")
    else:
        # If somehow there is no linked user, delete the employee directly
        execute_query(conn, "DELETE FROM employees WHERE id = %s", (id,), fetch="none")
        
    return {"message": "Employee profile and all associated data deleted successfully"}
