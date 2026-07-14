import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layout & Security
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import UserManagement from './pages/UserManagement';
import ReportsDashboard from './pages/ReportsDashboard';

// Employee Pages
import EmployeeDashboard from './pages/EmployeeDashboard';

// Shared Pages
import AttendanceManagement from './pages/AttendanceManagement';
import LeaveManagement from './pages/LeaveManagement';
import SalaryManagement from './pages/SalaryManagement';
import Payslip from './pages/Payslip';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

// Main Layout Wrapper
const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Get current page title dynamically from route
  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'Dashboard Hub';
    if (path.includes('employees')) return 'Employee Directory';
    if (path.includes('departments')) return 'Department Administration';
    if (path.includes('attendance')) return 'Attendance Logs';
    if (path.includes('leaves')) return 'Leave Requests & Approvals';
    if (path.includes('salaries')) return 'Salary Statements';
    if (path.includes('payslip')) return 'Salary Payslip statement';
    if (path.includes('reports')) return 'Expenditure Reports';
    if (path.includes('users')) return 'Access Control Management';
    if (path.includes('profile')) return 'My Profile';
    if (path.includes('change-password')) return 'Security Settings';
    return 'Payroll Portal';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isOpen={isMobileOpen}
        setIsOpen={setIsMobileOpen}
      />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar onMenuClick={() => setIsMobileOpen(true)} title={getPageTitle()} />

        {/* Dynamic page container (responsive container supports up to 4K resolutions) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="responsive-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Root Router Redirector
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard'} replace />;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Dashboard/Admin Routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<RootRedirect />} />
          
          {/* Admin Exclusive */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute allowedRoles={['admin']}><EmployeeManagement /></ProtectedRoute>} />
          <Route path="/departments" element={<ProtectedRoute allowedRoles={['admin']}><DepartmentManagement /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><ReportsDashboard /></ProtectedRoute>} />

          {/* Employee Exclusive */}
          <Route path="/employee-dashboard" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>} />

          {/* Shared Routes */}
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/leaves" element={<LeaveManagement />} />
          <Route path="/salaries" element={<SalaryManagement />} />
          <Route path="/payslip/:id" element={<Payslip />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
