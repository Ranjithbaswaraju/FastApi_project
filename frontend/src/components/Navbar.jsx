import React from 'react';
import { Menu, User, Bell } from 'lucide-react';

const Navbar = ({ onMenuClick, title = "Payroll Management System" }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 shadow-sm">
      {/* Mobile Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight hidden sm:block">
          {title}
        </h1>
        <h1 className="text-base font-bold text-gray-900 tracking-tight sm:hidden">
          PayPortal
        </h1>
      </div>

      {/* User Info & Notifications */}
      <div className="flex items-center gap-4">
        {/* Simple Notification Dot Icon */}
        <button className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-950 leading-tight">
              {user.name || "Default User"}
            </p>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              {user.role}
            </span>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-600 font-bold uppercase select-none text-sm">
            {user.name ? user.name.slice(0, 2) : "US"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
