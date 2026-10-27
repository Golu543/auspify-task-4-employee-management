import React, { useEffect, useState } from 'react';
import { api, formatCurrency, formatDate, getStatusBadge } from '../api.js';

export default function DashboardView({ onNavigate, onSelectDepartment, notify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard();
      setData(res.data);
    } catch (err) {
      notify('error', err.message || 'Failed to load HR dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="state-box">Loading organization metrics...</div>;
  }

  if (!data) {
    return (
      <div className="state-box">
        <p>Could not connect to Employee API on port 5003.</p>
        <button className="btn btn-primary" onClick={loadDashboard}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="view-section">
      {/* Top Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Workforce</span>
          <strong className="metric-value">{data.total_employees}</strong>
          <span className="metric-sub">{data.resigned_employees} historical resignations</span>
        </div>

        <div className="metric-card metric-emerald">
          <span className="metric-label">Active Employees</span>
          <strong className="metric-value">{data.active_employees}</strong>
          <span className="metric-sub">{data.on_leave_employees} currently on leave</span>
        </div>

        <div className="metric-card metric-blue">
          <span className="metric-label">Active Departments</span>
          <strong className="metric-value">{data.total_departments}</strong>
          <span className="metric-sub">Organizational units</span>
        </div>

        <div className="metric-card metric-indigo">
          <span className="metric-label">Monthly Active Payroll</span>
          <strong className="metric-value">{formatCurrency(data.active_payroll)}</strong>
          <span className="metric-sub">Excluding resigned personnel</span>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="card quick-actions-bar">
        <div>
          <h3>Human Resource Operations</h3>
          <p className="muted-text">Onboard new employees, filter by department, or export HR reports.</p>
        </div>
        <div className="action-btn-group">
          <button className="btn btn-primary" onClick={() => onNavigate('employees')}>
            Manage Employee Directory
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('reports')}>
            Department & Payroll Reports
          </button>
        </div>
      </div>

      <div className="dashboard-two-col">
        {/* Left: Department Distribution */}
        <div className="card">
          <div className="card-header-row">
            <div>
              <h3>Department Overview</h3>
              <p className="muted-text">Click any department to filter the employee directory.</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('reports')}>
              Full Analytics
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total Staff</th>
                  <th>Active</th>
                  <th>Avg Salary</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.department_breakdown.map((dept) => (
                  <tr key={dept.department}>
                    <td>
                      <strong>{dept.department}</strong>
                    </td>
                    <td>{dept.employee_count}</td>
                    <td>{dept.active_count}</td>
                    <td>{formatCurrency(dept.avg_salary)}</td>
                    <td>
                      <button
                        className="btn-action btn-action-blue"
                        onClick={() => onSelectDepartment(dept.department)}
                      >
                        View Staff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Hires */}
        <div className="card">
          <div className="card-header-row">
            <div>
              <h3>Recently Joined Personnel</h3>
              <p className="muted-text">Latest 5 employees sorted by joining date.</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('employees')}>
              All Employees
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Name & Designation</th>
                  <th>Department</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_hires.map((emp) => (
                  <tr key={emp.id}>
                    <td className="mono">{emp.employee_code}</td>
                    <td>
                      <strong>{emp.full_name}</strong>
                      <div className="sub-meta">{emp.designation}</div>
                    </td>
                    <td>{emp.department}</td>
                    <td>{formatDate(emp.joining_date)}</td>
                    <td>
                      <span className={`status-pill ${getStatusBadge(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}