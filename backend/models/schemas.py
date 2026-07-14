from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date

# User Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "employee"  # "admin" or "employee"

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    created_at: datetime

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

# Department Schemas
class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

# Employee Schemas
class EmployeeCreate(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    join_date: str  # YYYY-MM-DD
    base_salary: float = Field(..., ge=0.0)
    status: str = "Active"  # "Active" or "Inactive"

class EmployeeUpdate(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    base_salary: float = Field(..., ge=0.0)
    status: str = "Active"

class EmployeeResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    designation: Optional[str] = None
    join_date: str
    base_salary: float
    status: str
    created_at: datetime

# Attendance Schemas
class AttendanceMark(BaseModel):
    employee_id: int
    date: str  # YYYY-MM-DD
    status: str  # "Present", "Absent", "On Leave"
    check_in_time: Optional[str] = None  # HH:MM:SS
    check_out_time: Optional[str] = None  # HH:MM:SS

class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    date: str
    status: str
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None

# Leave Schemas
class LeaveCreate(BaseModel):
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD
    leave_type: str  # "Casual", "Sick", "Annual", "Maternity", etc.
    reason: str

class LeaveUpdate(BaseModel):
    status: str  # "Approved" or "Rejected"

class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    start_date: str
    end_date: str
    leave_type: str
    status: str  # "Pending", "Approved", "Rejected"
    reason: str
    approved_by: Optional[int] = None
    created_at: datetime

# Salary Schemas
class SalaryGenerateRequest(BaseModel):
    payment_month: str  # YYYY-MM

class SalaryResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    base_salary: float
    bonuses: float
    deductions: float
    net_salary: float
    payment_month: str
    payment_status: str  # "Pending", "Paid"
    payment_date: Optional[str] = None
    created_at: datetime

# Payslip Schemas
class PayslipResponse(BaseModel):
    id: int
    salary_id: int
    employee_id: int
    employee_name: str
    department_name: Optional[str] = None
    designation: Optional[str] = None
    base_salary: float
    bonuses: float
    deductions: float
    net_salary: float
    payment_month: str
    payment_status: str
    payment_date: Optional[str] = None
    generated_date: datetime
