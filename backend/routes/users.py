from fastapi import APIRouter, HTTPException, Depends, status
from ..database import get_db, execute_query
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/users", tags=["users"])

@router.get("")
async def get_users(admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    users = execute_query(conn, "SELECT id, email, role, created_at FROM users ORDER BY id DESC", fetch="all")
    for user in users:
        if user.get("created_at"):
            user["created_at"] = user["created_at"].strftime("%Y-%m-%d %H:%M:%S")
    return users

@router.put("/{id}/role")
async def update_user_role(id: int, role: str, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    if role not in ["admin", "employee"]:
        raise HTTPException(status_code=400, detail="Invalid role specified. Use 'admin' or 'employee'")
        
    user = execute_query(conn, "SELECT id FROM users WHERE id = %s", (id,), fetch="one")
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
        
    # Prevent self demotion
    if id == admin["user_id"] and role != "admin":
        raise HTTPException(status_code=400, detail="Admins cannot change their own role")
        
    execute_query(conn, "UPDATE users SET role = %s WHERE id = %s", (role, id), fetch="none")
    return {"message": f"User role updated to {role} successfully"}

@router.delete("/{id}")
async def delete_user_account(id: int, admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    user = execute_query(conn, "SELECT id FROM users WHERE id = %s", (id,), fetch="one")
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
        
    # Prevent self deletion
    if id == admin["user_id"]:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own account")
        
    # Delete user account. This cascades and deletes the linked employee, attendance logs, leaves, salaries, and payslips automatically!
    execute_query(conn, "DELETE FROM users WHERE id = %s", (id,), fetch="none")
    
    return {"message": "User account and all associated employee data deleted successfully"}
