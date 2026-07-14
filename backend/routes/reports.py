from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from ..database import get_db, execute_query
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/summary")
async def get_summary_stats(admin: dict = Depends(get_current_admin), conn = Depends(get_db)):
    # 1. Overall employee counts
    emp_stats = execute_query(conn, """
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active
        FROM employees
    """, fetch="one")
    
    total_employees = emp_stats["total"] if emp_stats else 0
    active_employees = int(emp_stats["active"]) if emp_stats and emp_stats["active"] else 0
    
    # 2. Departments count
    dept_stats = execute_query(conn, "SELECT COUNT(*) AS total FROM departments", fetch="one")
    total_departments = dept_stats["total"] if dept_stats else 0
    
    # 3. Pending leaves
    pending_leaves_stats = execute_query(conn, "SELECT COUNT(*) AS total FROM leave_requests WHERE status = 'Pending'", fetch="one")
    pending_leaves = pending_leaves_stats["total"] if pending_leaves_stats else 0
    
    # 4. Current month total payroll (Paid + Pending)
    current_month_str = datetime.now().strftime("%Y-%m")
    payroll_stats = execute_query(conn, """
        SELECT SUM(net_salary) AS total_net,
               SUM(CASE WHEN payment_status = 'Paid' THEN net_salary ELSE 0 END) AS total_paid,
               SUM(CASE WHEN payment_status = 'Pending' THEN net_salary ELSE 0 END) AS total_pending
        FROM salaries
        WHERE payment_month = %s
    """, (current_month_str,), fetch="one")
    
    total_net = float(payroll_stats["total_net"]) if payroll_stats and payroll_stats["total_net"] else 0.0
    total_paid = float(payroll_stats["total_paid"]) if payroll_stats and payroll_stats["total_paid"] else 0.0
    total_pending = float(payroll_stats["total_pending"]) if payroll_stats and payroll_stats["total_pending"] else 0.0
    
    # 5. Department-wise employee counts
    dept_distribution = execute_query(conn, """
        SELECT d.id AS department_id, d.name, COUNT(e.id) AS count
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id
        GROUP BY d.id, d.name
        ORDER BY count DESC
    """, fetch="all")
    
    # 6. Last 6 months payroll trends
    trends_res = execute_query(conn, """
        SELECT payment_month AS month,
               SUM(net_salary) AS payroll,
               SUM(CASE WHEN payment_status = 'Paid' THEN net_salary ELSE 0 END) AS paid
        FROM salaries
        GROUP BY payment_month
        ORDER BY payment_month ASC
        LIMIT 6
    """, fetch="all")
    
    trends = []
    for tr in trends_res:
        trends.append({
            "month": tr["month"],
            "payroll": float(tr["payroll"]) if tr["payroll"] else 0.0,
            "paid": float(tr["paid"]) if tr["paid"] else 0.0
        })
        
    # 7. Leaves summary stats
    leaves_stats = execute_query(conn, """
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
               SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved,
               SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected
        FROM leave_requests
    """, fetch="one")
    
    leaves_total = leaves_stats["total"] if leaves_stats else 0
    leaves_pending = int(leaves_stats["pending"]) if leaves_stats and leaves_stats["pending"] else 0
    leaves_approved = int(leaves_stats["approved"]) if leaves_stats and leaves_stats["approved"] else 0
    leaves_rejected = int(leaves_stats["rejected"]) if leaves_stats and leaves_stats["rejected"] else 0
    
    return {
        "counters": {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "total_departments": total_departments,
            "pending_leaves": pending_leaves,
            "current_month_payroll": round(total_net, 2),
            "current_month_paid": round(total_paid, 2),
            "current_month_pending": round(total_pending, 2),
        },
        "department_distribution": dept_distribution,
        "payroll_trends": trends,
        "leaves_summary": {
            "total": leaves_total,
            "pending": leaves_pending,
            "approved": leaves_approved,
            "rejected": leaves_rejected
        }
    }
