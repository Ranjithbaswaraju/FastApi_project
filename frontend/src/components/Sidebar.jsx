import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  FileSpreadsheet,
  Banknote,
  PieChart,
  UserCheck,
  User,
  Key,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const adminLinks = [
    { to: "/admin-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: "/employees", label: "Employees", icon: <Users className="w-5 h-5" /> },
    { to: "/departments", label: "Departments", icon: <Briefcase className="w-5 h-5" /> },
    { to: "/attendance", label: "Attendance", icon: <CalendarCheck className="w-5 h-5" /> },
    { to: "/leaves", label: "Leave Requests", icon: <FileSpreadsheet className="w-5 h-5" /> },
    { to: "/salaries", label: "Salary Processing", icon: <Banknote className="w-5 h-5" /> },
    { to: "/reports", label: "Analytics & Reports", icon: <PieChart className="w-5 h-5" /> },
    { to: "/users", label: "User Access Control", icon: <UserCheck className="w-5 h-5" /> },
    { to: "/profile", label: "My Profile", icon: <User className="w-5 h-5" /> },
    { to: "/change-password", label: "Change Password", icon: <Key className="w-5 h-5" /> },
  ];

  const employeeLinks = [
    { to: "/employee-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: "/attendance", label: "Mark Attendance", icon: <CalendarCheck className="w-5 h-5" /> },
    { to: "/leaves", label: "Leave Applications", icon: <FileSpreadsheet className="w-5 h-5" /> },
    { to: "/salaries", label: "Salary & Payslips", icon: <Banknote className="w-5 h-5" /> },
    { to: "/profile", label: "My Profile", icon: <User className="w-5 h-5" /> },
    { to: "/change-password", label: "Change Password", icon: <Key className="w-5 h-5" /> },
  ];

  const links = user.role === 'admin' ? adminLinks : employeeLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg font-bold text-white shrink-0">
            P
          </div>
          {(!isCollapsed || isOpen) && (
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              PayPortal
            </span>
          )}
        </div>
        {/* Toggle Collapse Button for desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex items-center justify-center p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setIsOpen(false)} // Close drawer on mobile click
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`
            }
          >
            {link.icon}
            {(!isCollapsed || isOpen) && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!isCollapsed || isOpen) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block h-screen shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      >
        <aside
          className={`absolute top-0 bottom-0 left-0 w-64 transition-transform duration-350 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
