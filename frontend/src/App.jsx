import React, { useState } from 'react';
import { DashboardIcon, UsersIcon, ReportIcon } from './components/Icons.jsx';
import DashboardView from './components/DashboardView.jsx';
import EmployeesView from './components/EmployeesView.jsx';
import ReportsView from './components/ReportsView.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, subtitle: 'Workforce KPIs, department distribution, and recent hires' },
  { id: 'employees', label: 'Employees Directory', icon: UsersIcon, subtitle: 'Register, search, filter, and manage employee profiles' },
  { id: 'reports', label: 'Departments & Reports', icon: ReportIcon, subtitle: 'Departmental headcount analytics and CSV exports' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast({ type: '', message: '' });
    }, 4500);
  };

  const handleSelectDepartment = (deptName) => {
    setSelectedDeptFilter(deptName);
    setActiveTab('employees');
  };

  const currentNav = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="layout-shell">
      {/* Left Navigation Sidebar */}
      <aside className="sidebar">
        <div className="brand-box">
          <h1 className="brand-title">Vanguard HR</h1>
          <p className="brand-sub">Employee Management System</p>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <IconComponent />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sys-indicator">
            <span className="dot-online" />
            <span>MySQL80 • Port 5003</span>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="workspace">
        <header className="topbar">
          <div>
            <h2>{currentNav.label}</h2>
            <p className="muted-text">{currentNav.subtitle}</p>
          </div>
        </header>

        {toast.message && (
          <div className={`toast-banner ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ type: '', message: '' })} className="toast-close">
              ×
            </button>
          </div>
        )}

        <main className="content-area">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={setActiveTab}
              onSelectDepartment={handleSelectDepartment}
              notify={notify}
            />
          )}
          {activeTab === 'employees' && (
            <EmployeesView
              initialDepartment={selectedDeptFilter}
              clearInitialDepartment={() => setSelectedDeptFilter('')}
              notify={notify}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsView
              onSelectDepartment={handleSelectDepartment}
              notify={notify}
            />
          )}
        </main>
      </div>
    </div>
  );
}