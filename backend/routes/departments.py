from fastapi import APIRouter, HTTPException, Depends, status
from ..database import get_db, execute_query
from ..models.schemas import DepartmentCreate
from ..utils.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/departments", tags=["departments"])

@router.get("", response_model=list)
async def get_departments(current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    departments = execute_query(conn, "SELECT * FROM departments ORDER BY name ASC", fetch="all")
    for dept in departments:
        if dept.get("created_at"):
            dept["created_at"] = dept["created_at"].strftime("%Y-%m-%d %H:%M:%S")
    return departments

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_department(dept_data: DepartmentCreate, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    # Check duplicate name
    existing = execute_query(conn, "SELECT id FROM departments WHERE name = %s", (dept_data.name,), fetch="one")
    if existing:
        raise HTTPException(status_code=400, detail="Department name already exists")
        
    insert_query = "INSERT INTO departments (name, description) VALUES (%s, %s)"
    dept_id = execute_query(conn, insert_query, (dept_data.name, dept_data.description), fetch="none")
    return {"message": "Department created successfully", "id": dept_id}

@router.get("/{id}")
async def get_department(id: int, current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    dept = execute_query(conn, "SELECT * FROM departments WHERE id = %s", (id,), fetch="one")
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    if dept.get("created_at"):
        dept["created_at"] = dept["created_at"].strftime("%Y-%m-%d %H:%M:%S")
    return dept

@router.put("/{id}")
async def update_department(id: int, dept_data: DepartmentCreate, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    # Verify existence
    dept = execute_query(conn, "SELECT id FROM departments WHERE id = %s", (id,), fetch="one")
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Check duplicate name elsewhere
    existing = execute_query(conn, "SELECT id FROM departments WHERE name = %s AND id != %s", (dept_data.name, id), fetch="one")
    if existing:
        raise HTTPException(status_code=400, detail="Another department with this name already exists")
        
    update_query = "UPDATE departments SET name = %s, description = %s WHERE id = %s"
    execute_query(conn, update_query, (dept_data.name, dept_data.description, id), fetch="none")
    return {"message": "Department updated successfully"}

@router.delete("/{id}")
async def delete_department(id: int, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    # Check if department is being used by employees
    employee_count_res = execute_query(conn, "SELECT COUNT(*) AS count FROM employees WHERE department_id = %s", (id,), fetch="one")
    if employee_count_res and employee_count_res["count"] > 0:
        raise HTTPException(status_code=400, detail="Cannot delete department. Active employees are assigned to it.")
        
    result = execute_query(conn, "DELETE FROM departments WHERE id = %s", (id,), fetch="none")
    # If lastrowid returned is None or deletion query ran, we can verify deletion by querying again or just checking connection results.
    # Note that delete statements return rowcount or lastrowid. If we want to check if it existed, we check first.
    dept = execute_query(conn, "SELECT id FROM departments WHERE id = %s", (id,), fetch="one")
    
    return {"message": "Department deleted successfully"}
