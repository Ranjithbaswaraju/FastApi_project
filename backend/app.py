from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from .config import settings
from .database import get_db_connection
from .routes import auth, employees, departments, attendance, leaves, salaries, payslips, reports, users

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Payroll Management System API",
    description="Backend REST API for Payroll Management System using FastAPI and MySQL",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to database on startup
@app.on_event("startup")
async def startup_db_client():
    try:
        # Verify pool connection
        conn = get_db_connection()
        conn.close()
        logger.info("Successfully verified MySQL connection pool.")
    except Exception as e:
        logger.error(f"Failed to connect to MySQL database on startup: {e}")


# Include Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(leaves.router, prefix="/api")
app.include_router(salaries.router, prefix="/api")
app.include_router(payslips.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Payroll Management System API!",
        "status": "Online",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
