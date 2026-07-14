import os

class Config:
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "MyNewPassword@123")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "payroll_db")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    
    JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_payroll_management_key_change_me_in_production")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_MINUTES = 1440  # 24 hours

settings = Config()
