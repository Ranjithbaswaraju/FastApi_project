from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, date, timedelta
from typing import Optional
from ..database import get_db, execute_query
from ..models.schemas import LeaveCreate, LeaveUpdate
from ..utils.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/leaves", tags=["leaves"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def apply_leave(data: LeaveCreate, current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    # 1. Fetch employee profile
    employee = execute_query(conn, "SELECT id FROM employees WHERE user_id = %s", (current_user["user_id"],), fetch="one")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
        
    # Validate dates
    try:
        start = datetime.strptime(data.start_date, "%Y-%m-%d").date()
        end = datetime.strptime(data.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    if start > end:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date")
        
    insert_query = """
        INSERT INTO leave_requests (employee_id, start_date, end_date, leave_type, reason, status)
        VALUES (%s, %s, %s, %s, %s, 'Pending')
    """
    req_id = execute_query(conn, insert_query, (
        employee["id"], data.start_date, data.end_date, data.leave_type, data.reason
    ), fetch="none")
    
    return {"message": "Leave request submitted successfully", "id": req_id}

@router.get("")
async def get_leaves(status_filter: Optional[str] = None, current_user: dict = Depends(get_current_user), conn = Depends(get_db)):
    query = """
        SELECT l.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name 
        FROM leave_requests l 
        JOIN employees e ON l.employee_id = e.id
    """
    params = []
    
    # 1. Check user role and construct query
    if current_user["role"] == "employee":
        employee = execute_query(conn, "SELECT id FROM employees WHERE user_id = %s", (current_user["user_id"],), fetch="one")
        if not employee:
            return []
        query += " WHERE l.employee_id = %s"
        params.append(employee["id"])
        
    if status_filter:
        if "WHERE" in query:
            query += " AND l.status = %s"
        else:
            query += " WHERE l.status = %s"
        params.append(status_filter)
        
    query += " ORDER BY l.id DESC"
    requests = execute_query(conn, query, tuple(params), fetch="all")
    
    # Format response date/datetime objects
    for req in requests:
        if req.get("start_date"):
            req["start_date"] = req["start_date"].strftime("%Y-%m-%d")
        if req.get("end_date"):
            req["end_date"] = req["end_date"].strftime("%Y-%m-%d")
        if req.get("created_at"):
            req["created_at"] = req["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            
    return requests

@router.put("/{id}")
async def approve_reject_leave(id: int, data: LeaveUpdate, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    req = execute_query(conn, "SELECT * FROM leave_requests WHERE id = %s", (id,), fetch="one")
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if req["status"] != "Pending":
        raise HTTPException(status_code=400, detail=f"Leave request is already {req['status']}")
        
    # Update status
    execute_query(conn, "UPDATE leave_requests SET status = %s, approved_by = %s WHERE id = %s", (
        data.status, admin["user_id"], id
    ), fetch="none")
    
    # Proactive sync: If approved, log "On Leave" attendance entries for the employee
    if data.status == "Approved":
        emp_id = req["employee_id"]
        try:
            start_date_obj = req["start_date"]
            end_date_obj = req["end_date"]
            
            # Ensure they are date objects
            if isinstance(start_date_obj, str):
                start_date_obj = datetime.strptime(start_date_obj, "%Y-%m-%d").date()
            if isinstance(end_date_obj, str):
                end_date_obj = datetime.strptime(end_date_obj, "%Y-%m-%d").date()
                
            curr = start_date_obj
            while curr <= end_date_obj:
                # Only log for weekdays (Monday to Friday = 0 to 4)
                if curr.weekday() < 5:
                    date_str = curr.strftime("%Y-%m-%d")
                    # Upsert attendance as On Leave
                    upsert_attendance_query = """
                        INSERT INTO attendance (employee_id, date, status, check_in_time, check_out_time)
                        VALUES (%s, %s, 'On Leave', NULL, NULL)
                        ON DUPLICATE KEY UPDATE status = VALUES(status), check_in_time = NULL, check_out_time = NULL
                    """
                    execute_query(conn, upsert_attendance_query, (emp_id, date_str), fetch="none")
                curr += timedelta(days=1)
        except Exception as e:
            # log warning but keep route transaction successful
            print(f"Error syncing attendance for approved leave: {e}")
            
    return {"message": f"Leave request {data.status.lower()} successfully"}
