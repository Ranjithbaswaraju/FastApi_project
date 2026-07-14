from datetime import datetime, date, timedelta
import calendar
import logging
from ..database import execute_query

logger = logging.getLogger(__name__)

def get_working_days_in_month(year: int, month: int) -> int:
    # Calculate total working days in a month (excluding weekends: Saturday & Sunday)
    num_days = calendar.monthrange(year, month)[1]
    working_days = 0
    for day in range(1, num_days + 1):
        d = date(year, month, day)
        if d.weekday() < 5:  # Monday to Friday (0 to 4)
            working_days += 1
    return working_days if working_days > 0 else 22

def calculate_monthly_salary(conn, employee_id: int, payment_month: str) -> dict:
    # payment_month format: "YYYY-MM"
    try:
        year, month = map(int, payment_month.split("-"))
    except ValueError:
        raise ValueError("Invalid payment_month format. Use YYYY-MM")

    # 1. Fetch employee details
    emp_query = "SELECT id, first_name, last_name, base_salary FROM employees WHERE id = %s"
    employee = execute_query(conn, emp_query, (employee_id,), fetch="one")
    if not employee:
        raise ValueError("Employee not found")

    base_salary = float(employee["base_salary"])
    total_working_days = get_working_days_in_month(year, month)
    daily_rate = base_salary / total_working_days if total_working_days > 0 else 0.0

    # 2. Count attendance logs for the target month
    start_date = f"{payment_month}-01"
    last_day = calendar.monthrange(year, month)[1]
    end_date = f"{payment_month}-{last_day:02d}"

    att_query = """
        SELECT status, date FROM attendance 
        WHERE employee_id = %s AND date >= %s AND date <= %s
    """
    attendance_records = execute_query(conn, att_query, (employee_id, start_date, end_date), fetch="all")

    # Count Present, Absent, On Leave
    present_days = 0
    absent_days = 0
    leave_days = 0

    for record in attendance_records:
        status = record["status"]
        if status == "Present":
            present_days += 1
        elif status == "Absent":
            absent_days += 1
        elif status == "On Leave":
            leave_days += 1

    # 3. Retrieve approved leave requests for this month
    leave_query = """
        SELECT start_date, end_date, leave_type FROM leave_requests 
        WHERE employee_id = %s AND status = 'Approved'
        AND ((start_date >= %s AND start_date <= %s) 
             OR (end_date >= %s AND end_date <= %s) 
             OR (start_date <= %s AND end_date >= %s))
    """
    approved_leaves = execute_query(conn, leave_query, (
        employee_id, 
        start_date, end_date, 
        start_date, end_date, 
        start_date, end_date
    ), fetch="all")
    
    # Calculate approved leave dates within this month
    approved_leave_dates = set()
    for l in approved_leaves:
        # Convert start/end to datetime date objects (mysql-connector returns date objects directly for DATE columns)
        l_start = l["start_date"]
        l_end = l["end_date"]
        
        if isinstance(l_start, str):
            l_start = datetime.strptime(l_start, "%Y-%m-%d").date()
        if isinstance(l_end, str):
            l_end = datetime.strptime(l_end, "%Y-%m-%d").date()
            
        target_start = max(l_start, date(year, month, 1))
        target_end = min(l_end, date(year, month, last_day))
        
        curr = target_start
        while curr <= target_end:
            approved_leave_dates.add(curr.strftime("%Y-%m-%d"))
            curr += timedelta(days=1)
            
    # Count how many of the "On Leave" attendance entries match an approved leave request
    unapproved_leave_days = 0
    for record in attendance_records:
        if record["status"] == "On Leave":
            rec_date = record["date"]
            if isinstance(rec_date, (date, datetime)):
                rec_date_str = rec_date.strftime("%Y-%m-%d")
            else:
                rec_date_str = str(rec_date)
                
            # If not in approved leaves list, it's unapproved
            if rec_date_str not in approved_leave_dates:
                unapproved_leave_days += 1

    # Deductions: Absent days + Unapproved leave days
    unpaid_days = absent_days + unapproved_leave_days
    deductions = unpaid_days * daily_rate
    
    net_salary = max(base_salary - deductions, 0.0)

    return {
        "employee_id": employee["id"],
        "employee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
        "base_salary": base_salary,
        "bonuses": 0.0,
        "deductions": round(deductions, 2),
        "net_salary": round(net_salary, 2),
        "payment_month": payment_month,
        "payment_status": "Pending",
        "payment_date": None
    }
