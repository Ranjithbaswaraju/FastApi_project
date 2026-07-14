from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from ..database import get_db, execute_query
from ..models.schemas import UserCreate, UserLogin, PasswordChange
from ..utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, conn = Depends(get_db)):
    # 1. Check if user already exists
    existing = execute_query(conn, "SELECT id FROM users WHERE email = %s", (user_data.email,), fetch="one")
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash password and insert user
    hashed_pwd = hash_password(user_data.password)
    insert_user_query = "INSERT INTO users (email, password_hash, role) VALUES (%s, %s, %s)"
    user_id = execute_query(conn, insert_user_query, (user_data.email, hashed_pwd, user_data.role), fetch="none")
    
    # 3. If employee, handle linking or profile creation
    if user_data.role == "employee":
        existing_emp = execute_query(conn, "SELECT id FROM employees WHERE email = %s", (user_data.email,), fetch="one")
        if existing_emp:
            # Link existing employee profile
            execute_query(conn, "UPDATE employees SET user_id = %s WHERE email = %s", (user_id, user_data.email), fetch="none")
        else:
            # Create basic employee profile
            first_name = user_data.email.split("@")[0].capitalize()
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            insert_emp_query = """
                INSERT INTO employees (user_id, first_name, last_name, email, phone, designation, join_date, base_salary, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute_query(conn, insert_emp_query, (
                user_id, first_name, "Employee", user_data.email, "", "Staff", today_str, 30000.0, "Active"
            ), fetch="none")
            
    return {"message": "User registered successfully", "user_id": user_id}

@router.post("/login")
async def login(credentials: UserLogin, conn = Depends(get_db)):
    user = execute_query(conn, "SELECT id, email, password_hash, role FROM users WHERE email = %s", (credentials.email,), fetch="one")
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Generate JWT
    token_payload = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"]
    }
    token = create_access_token(token_payload)
    
    # Fetch associated employee info if employee
    employee_id = None
    employee_name = "Admin User"
    if user["role"] == "employee":
        employee = execute_query(conn, "SELECT id, first_name, last_name FROM employees WHERE user_id = %s", (user["id"],), fetch="one")
        if employee:
            employee_id = employee["id"]
            employee_name = f"{employee.get('first_name', '')} {employee.get('last_name', '')}"
            
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "employee_id": employee_id,
            "name": employee_name
        }
    }

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    user = execute_query(conn, "SELECT id, email, role, created_at FROM users WHERE id = %s", (current_user["user_id"],), fetch="one")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Standard formats
    user["created_at"] = user["created_at"].strftime("%Y-%m-%d %H:%M:%S")
    response_data = {
        "user": user
    }
    
    if user["role"] == "employee":
        emp_query = """
            SELECT e.*, d.name AS department_name 
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            WHERE e.user_id = %s
        """
        employee = execute_query(conn, emp_query, (user["id"],), fetch="one")
        if employee:
            # Format datetime
            employee["created_at"] = employee["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            # Convert decimal base_salary to float
            if employee.get("base_salary"):
                employee["base_salary"] = float(employee["base_salary"])
            # Format join_date if DATE object
            if employee.get("join_date"):
                employee["join_date"] = employee["join_date"].strftime("%Y-%m-%d")
            response_data["employee"] = employee
            
    return response_data

@router.post("/change-password")
async def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    user = execute_query(conn, "SELECT password_hash FROM users WHERE id = %s", (current_user["user_id"],), fetch="one")
    if not user or not verify_password(data.old_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    hashed_new_pwd = hash_password(data.new_password)
    execute_query(conn, "UPDATE users SET password_hash = %s WHERE id = %s", (hashed_new_pwd, current_user["user_id"]), fetch="none")
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
async def forgot_password(email_data: dict, conn = Depends(get_db)):
    email = email_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    user = execute_query(conn, "SELECT id FROM users WHERE email = %s", (email,), fetch="one")
    if not user:
        raise HTTPException(status_code=404, detail="User email not found")
        
    return {"message": "Password reset link sent to your registered email address"}
