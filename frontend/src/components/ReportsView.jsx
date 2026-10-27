import React, { useEffect, useState } from 'react';
import { api, exportToCsv, formatCurrency } from '../api.js';
import { DownloadIcon } from './Icons.jsx';

export default function ReportsView({ onSelectDepartment, notify }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const [dashRes, empRes] = await Promise.all([
          api.getDashboard(),
          api.getEmployees()
        ]);
        setDashboardData(dashRes.data);
        setEmployees(empRes.data);
      } catch (err) {
        notify('error', err.message || 'Failed to generate HR reports.');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) {
    return <div className="state-box">Generating department and payroll reports...</div>;
  }

  if (!dashboardData) {
    return <div className="state-box">Unable to load report data.</div>;
  }

  const handleExportEmployeesCsv = () => {
    exportToCsv('employee_directory_report.csv', employees, [
      { key: 'employee_code', label: 'Employee ID' },
      { key: 'full_name', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'joining_date', label: 'Joining Date' },
      { key: 'salary', label: 'Monthly Salary (INR)' },
      { key: 'status', label: 'Status' }
    ]);
    notify('success', 'Downloaded employee_directory_report.csv');
  };

  const handleExportDepartmentsCsv = () => {
    exportToCsv('department_statistics_report.csv', dashboardData.department_breakdown, [
      { key: 'department', label: 'Department' },
      { key: 'employee_count', label: 'Total Staff' },
      { key: 'active_count', label: 'Active Staff' },
      { key: 'avg_salary', label: 'Average Salary (INR)' },
      { key: 'total_salary', label: 'Total Monthly Payroll (INR)' }
    ]);
    notify('success', 'Downloaded department_statistics_report.csv');
  };

  return (
    <div className="view-section">
      {/* CSV Export Header */}
      <div className="card quick-actions-bar">
        <div>
          <h3>Workforce Analytics & CSV Reports</h3>
          <p className="muted-text">
            Export complete employee records or department-wise payroll statistics as CSV files.
          </p>
        </div>
        <div className="action-btn-group">
          <button className="btn btn-primary" onClick={handleExportEmployeesCsv}>
            <DownloadIcon /> Export Employee Directory (CSV)
          </button>
          <button className="btn btn-secondary" onClick={handleExportDepartmentsCsv}>
            <DownloadIcon /> Export Department Stats (CSV)
          </button>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="card">
        <h3>Department-Wise Headcount & Payroll Report</h3>
        <p className="muted-text" style={{ marginBottom: '16px' }}>
          Organizational breakdown of personnel count, active workforce, average compensation, and total departmental payroll.
        </p>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Total Headcount</th>
                <th>Active Personnel</th>
                <th>Average Salary</th>
                <th>Total Monthly Payroll</th>
                <th>Directory Filter</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.department_breakdown.map((dept) => (
                <tr key={dept.department}>
                  <td>
                    <strong>{dept.department}</strong>
                  </td>
                  <td>{dept.employee_count} employees</td>
                  <td>
                    <span className="status-pill badge-emerald">
                      {dept.active_count} Active
                    </span>
                  </td>
                  <td>{formatCurrency(dept.avg_salary)}</td>
                  <td>
                    <strong>{formatCurrency(dept.total_salary)}</strong>
                  </td>
                  <td>
                    <button
                      className="btn-action btn-action-blue"
                      onClick={() => onSelectDepartment(dept.department)}
                    >
                      Filter Employees
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}