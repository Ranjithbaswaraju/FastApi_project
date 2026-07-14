import mysql.connector
from datetime import datetime, date, timedelta
import bcrypt
import sys
import os

# Adjust path to import config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.config import settings

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def init_db():
    print(f"Initializing MySQL database at: {settings.MYSQL_HOST}:{settings.MYSQL_PORT}...")
    
    # 1. Connect without database initially to create the database if it doesn't exist
    conn = mysql.connector.connect(
        host=settings.MYSQL_HOST,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        port=settings.MYSQL_PORT
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {settings.MYSQL_DATABASE}")
    cursor.execute(f"USE {settings.MYSQL_DATABASE}")
    conn.commit()
    
    # 2. Read and run schema.sql DDL statements
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    print(f"Executing schema from {schema_path}...")
    
    with open(schema_path, 'r') as f:
        schema_sql = f.read()
        
    # Clean comments first so we don't skip statements that start with comments
    clean_lines = []
    for line in schema_sql.split('\n'):
        if not line.strip().startswith('--'):
            clean_lines.append(line)
    schema_sql_clean = '\n'.join(clean_lines)
    
    statements = schema_sql_clean.split(';')
    for stmt in statements:
        stmt_cleaned = stmt.strip()
        if stmt_cleaned:
            cursor.execute(stmt_cleaned)
            
    conn.commit()
    print("Database tables initialized successfully.")
    
    # 3. Clear existing seed data (truncating in reverse dependency order)
    print("Clearing existing data...")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    cursor.execute("TRUNCATE TABLE payslips")
    cursor.execute("TRUNCATE TABLE salaries")
    cursor.execute("TRUNCATE TABLE leave_requests")
    cursor.execute("TRUNCATE TABLE attendance")
    cursor.execute("TRUNCATE TABLE employees")
    cursor.execute("TRUNCATE TABLE users")
    cursor.execute("TRUNCATE TABLE departments")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    conn.commit()
    
    # 4. Seed Departments
    print("Seeding departments...")
    depts = [
        ("Engineering", "Software development and engineering"),
        ("Human Resources", "HR management and operations"),
        ("Finance", "Accounting and financial planning"),
        ("Marketing", "Product promotion and marketing")
    ]
    cursor.executemany(
        "INSERT INTO departments (name, description) VALUES (%s, %s)",
        depts
    )
    conn.commit()
    
    # Get department IDs
    cursor.execute("SELECT id, name FROM departments")
    dept_map = {name: dept_id for (dept_id, name) in cursor.fetchall()}
    
    # 5. Seed Admin User
    print("Seeding admin account...")
    admin_pwd_hash = hash_password("Admin@123")
    cursor.execute(
        "INSERT INTO users (email, password_hash, role) VALUES (%s, %s, 'admin')",
        ("admin@payroll.com", admin_pwd_hash)
    )
    conn.commit()
    
    # 6. Seed Employees
    print("Seeding employees and user credentials...")
    employee_data = [
        {
            "email": "ranjith@payroll.com",
            "password": "Employee@123",
            "first_name": "Ranjith",
            "last_name": "Kumar",
            "phone": "+91 9876543210",
            "department_id": dept_map["Engineering"],
            "designation": "Software Engineer",
            "join_date": "2025-01-10",
            "base_salary": 75000.0,
            "status": "Active"
        },
        {
            "email": "priya@payroll.com",
            "password": "Employee@123",
            "first_name": "Priya",
            "last_name": "Sharma",
            "phone": "+91 9123456789",
            "department_id": dept_map["Human Resources"],
            "designation": "HR Specialist",
            "join_date": "2025-03-15",
            "base_salary": 50000.0,
            "status": "Active"
        },
        {
            "email": "amit@payroll.com",
            "password": "Employee@123",
            "first_name": "Amit",
            "last_name": "Patel",
            "phone": "+91 8888888888",
            "department_id": dept_map["Finance"],
            "designation": "Financial Analyst",
            "join_date": "2025-06-01",
            "base_salary": 65000.0,
            "status": "Active"
        }
    ]
    
    employee_ids = []
    for emp in employee_data:
        # Create user account
        user_hash = hash_password(emp["password"])
        cursor.execute(
            "INSERT INTO users (email, password_hash, role) VALUES (%s, %s, 'employee')",
            (emp["email"], user_hash)
        )
        user_id = cursor.lastrowid
        
        # Create employee profile
        cursor.execute("""
            INSERT INTO employees (user_id, first_name, last_name, email, phone, department_id, designation, join_date, base_salary, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, emp["first_name"], emp["last_name"], emp["email"], emp["phone"],
            emp["department_id"], emp["designation"], emp["join_date"], emp["base_salary"], emp["status"]
        ))
        emp_id = cursor.lastrowid
        employee_ids.append((emp_id, emp["first_name"]))
        
    conn.commit()
    
    # 7. Seed Attendance logs for the past 15 days
    print("Seeding attendance records...")
    today = date.today()
    curr = today - timedelta(days=15)
    attendance_records = []
    
    while curr < today:
        if curr.weekday() < 5:  # Mon-Fri
            date_str = curr.strftime("%Y-%m-%d")
            
            for emp_id, name in employee_ids:
                status = "Present"
                check_in = "09:05:00"
                check_out = "18:00:00"
                
                # Introduce leave/absent days for seeding
                if name == "Priya" and curr.day == 8:
                    status = "On Leave"
                    check_in = None
                    check_out = None
                elif name == "Amit" and curr.day == 12:
                    status = "Absent"
                    check_in = None
                    check_out = None
                    
                attendance_records.append((
                    emp_id, date_str, status, check_in, check_out
                ))
        curr += timedelta(days=1)
        
    if attendance_records:
        cursor.executemany("""
            INSERT INTO attendance (employee_id, date, status, check_in_time, check_out_time)
            VALUES (%s, %s, %s, %s, %s)
        """, attendance_records)
        conn.commit()
        
    # 8. Seed corresponding leave request for Priya's "On Leave" day
    print("Seeding leave request...")
    priya_emp_id = [eid for eid, name in employee_ids if name == "Priya"][0]
    
    # Find Priya's leave day date from attendance records
    leave_day = None
    for r in attendance_records:
        if r[0] == priya_emp_id and r[2] == "On Leave":
            leave_day = r[1]
            break
            
    if leave_day:
        cursor.execute("""
            INSERT INTO leave_requests (employee_id, start_date, end_date, leave_type, reason, status, approved_by)
            VALUES (%s, %s, %s, 'Sick', 'Fever, doctor recommended rest', 'Approved', 1)
        """, (priya_emp_id, leave_day, leave_day))
        conn.commit()
        
    print("MySQL database initialization and seeding completed successfully!")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    init_db()
