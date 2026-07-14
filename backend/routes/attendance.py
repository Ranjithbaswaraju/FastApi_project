from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, date
from typing import Optional
from ..database import get_db, execute_query
from ..models.schemas import AttendanceMark
from ..utils.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/check-in")
async def check_in(current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    # 1. Fetch employee profile
    employee = execute_query(conn, "SELECT id FROM employees WHERE user_id = %s", (current_user["user_id"],), fetch="one")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
        
    employee_id = employee["id"]
    today_str = datetime.now().strftime("%Y-%m-%d")
    now_time_str = datetime.now().strftime("%H:%M:%S")
    
    # 2. Check if already checked in today
    existing = execute_query(conn, "SELECT id FROM attendance WHERE employee_id = %s AND date = %s", (employee_id, today_str), fetch="one")
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in for today")
        
    # 3. Create check-in log
    insert_query = "INSERT INTO attendance (employee_id, date, status, check_in_time) VALUES (%s, %s, 'Present', %s)"
    log_id = execute_query(conn, insert_query, (employee_id, today_str, now_time_str), fetch="none")
    
    return {"message": "Checked in successfully", "id": log_id, "check_in_time": now_time_str}

@router.post("/check-out")
async def check_out(current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    # 1. Fetch employee profile
    employee = execute_query(conn, "SELECT id FROM employees WHERE user_id = %s", (current_user["user_id"],), fetch="one")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
        
    employee_id = employee["id"]
    today_str = datetime.now().strftime("%Y-%m-%d")
    now_time_str = datetime.now().strftime("%H:%M:%S")
    
    # 2. Find check-in log
    log = execute_query(conn, "SELECT id, check_out_time FROM attendance WHERE employee_id = %s AND date = %s", (employee_id, today_str), fetch="one")
    if not log:
        raise HTTPException(status_code=400, detail="Must check in first before checking out")
    if log.get("check_out_time"):
        raise HTTPException(status_code=400, detail="Already checked out for today")
        
    # 3. Update check-out log
    execute_query(conn, "UPDATE attendance SET check_out_time = %s WHERE id = %s", (now_time_str, log["id"]), fetch="none")
    return {"message": "Checked out successfully", "check_out_time": now_time_str}

@router.get("/today")
async def get_today_status(current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    employee = execute_query(conn, "SELECT id FROM employees WHERE user_id = %s", (current_user["user_id"],), fetch="one")
    if not employee:
        return {"checked_in": False, "checked_out": False, "record": None}
        
    today_str = datetime.now().strftime("%Y-%m-%d")
    record = execute_query(conn, "SELECT * FROM attendance WHERE employee_id = %s AND date = %s", (employee["id"], today_str), fetch="one")
    
    if not record:
        return {"checked_in": False, "checked_out": False, "record": None}
        
    # Format times & date
    if record.get("date"):
        record["date"] = record["date"].strftime("%Y-%m-%d")
    if record.get("check_in_time"):
        # timedelta check
        record["check_in_time"] = str(record["check_in_time"])
    if record.get("check_out_time"):
        record["check_out_time"] = str(record["check_out_time"])
        
    return {
        "checked_in": True,
        "checked_out": record.get("check_out_time") is not None,
        "record": record
    }

@router.get("/history")
async def get_history(month: Optional[str] = None, current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    employee = execute_query(conn, "SELECT id FROM employees WHERE user_id = %s", (current_user["user_id"],), fetch="one")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
        
    query = "SELECT * FROM attendance WHERE employee_id = %s"
    params = [employee["id"]]
    
    if month:  # Format: YYYY-MM
        query += " AND date LIKE %s"
        params.append(f"{month}%")
        
    query += " ORDER BY date DESC"
    history = execute_query(conn, query, tuple(params), fetch="all")
    
    # Format responses
    for h in history:
        if h.get("date"):
            h["date"] = h["date"].strftime("%Y-%m-%d")
        if h.get("check_in_time"):
            h["check_in_time"] = str(h["check_in_time"])
        if h.get("check_out_time"):
            h["check_out_time"] = str(h["check_out_time"])
            
    return history

@router.get("/all")
async def get_all_attendance(date_str: Optional[str] = None, month: Optional[str] = None, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    query = """
        SELECT a.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name 
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
    """
    params = []
    
    if date_str:
        query += " WHERE a.date = %s"
        params.append(date_str)
    elif month:
        query += " WHERE a.date LIKE %s"
        params.append(f"{month}%")
    else:
        # Default to today
        query += " WHERE a.date = %s"
        params.append(datetime.now().strftime("%Y-%m-%d"))
        
    query += " ORDER BY a.date DESC, e.first_name ASC"
    records = execute_query(conn, query, tuple(params), fetch="all")
    
    for r in records:
        if r.get("date"):
            r["date"] = r["date"].strftime("%Y-%m-%d")
        if r.get("check_in_time"):
            r["check_in_time"] = str(r["check_in_time"])
        if r.get("check_out_time"):
            r["check_out_time"] = str(r["check_out_time"])
            
    return records

@router.post("/mark")
async def mark_attendance(data: AttendanceMark, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    # Verify employee exists
    employee = execute_query(conn, "SELECT id FROM employees WHERE id = %s", (data.employee_id,), fetch="one")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Check null conversion
    in_time = data.check_in_time if data.check_in_time else None
    out_time = data.check_out_time if data.check_out_time else None
    
    mark_query = """
        INSERT INTO attendance (employee_id, date, status, check_in_time, check_out_time)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            status = VALUES(status), 
            check_in_time = VALUES(check_in_time), 
            check_out_time = VALUES(check_out_time)
    """
    execute_query(conn, mark_query, (data.employee_id, data.date, data.status, in_time, out_time), fetch="none")
    return {"message": "Attendance record updated successfully"}
