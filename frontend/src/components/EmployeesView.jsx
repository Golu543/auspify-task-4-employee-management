import React, { useEffect, useState } from 'react';
import { api, formatCurrency, formatDate, getStatusBadge, toInputDate } from '../api.js';
import { PlusIcon, SearchIcon } from './Icons.jsx';

const DEFAULT_DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Human Resources',
  'Finance',
  'Quality Assurance',
  'Marketing',
  'Operations'
];

const INITIAL_FORM = {
  employee_code: '',
  full_name: '',
  email: '',
  phone: '',
  department: 'Computer Science',
  designation: '',
  joining_date: new Date().toISOString().split('T')[0],
  salary: '',
  status: 'Active'
};

export default function EmployeesView({ initialDepartment = '', clearInitialDepartment, notify }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState(initialDepartment);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [viewingEmployee, setViewingEmployee] = useState(null);

  useEffect(() => {
    if (initialDepartment) {
      setDepartmentFilter(initialDepartment);
      if (clearInitialDepartment) clearInitialDepartment();
    }
  }, [initialDepartment]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployees(search, departmentFilter, statusFilter);
      setEmployees(res.data);
      if (res.departments && res.departments.length > 0) {
        setDepartments(Array.from(new Set([...DEFAULT_DEPARTMENTS, ...res.departments])));
      }
    } catch (err) {
      notify('error', err.message || 'Failed to load employee records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [search, departmentFilter, statusFilter]);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      joining_date: toInputDate(emp.joining_date),
      salary: emp.salary,
      status: emp.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        salary: Number(formData.salary)
      };

      if (editingEmployee) {
        const res = await api.updateEmployee(editingEmployee.id, payload);
        notify('success', res.message);
      } else {
        const res = await api.createEmployee(payload);
        notify('success', res.message);
      }
      setIsModalOpen(false);
      loadEmployees();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Delete employee record for "${emp.full_name}" (${emp.employee_code})?`)) {
      return;
    }
    try {
      const res = await api.deleteEmployee(emp.id);
      notify('success', res.message);
      if (viewingEmployee?.id === emp.id) setViewingEmployee(null);
      loadEmployees();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="view-section">
      <div className="card">
        <div className="toolbar-row">
          <div className="search-filter-group">
            <div className="input-with-icon">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by name, ID, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search employees"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by employment status"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Resigned">Resigned</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={openAddModal}>
            <PlusIcon /> Register Employee
          </button>
        </div>

        {loading ? (
          <div className="empty-box">Loading employee directory...</div>
        ) : employees.length === 0 ? (
          <div className="empty-box">No employee records match your current search or filters.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name & Contact</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Joining Date</th>
                  <th>Monthly Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="mono">{emp.employee_code}</td>
                    <td>
                      <strong>{emp.full_name}</strong>
                      <div className="sub-meta">
                        {emp.email} • {emp.phone}
                      </div>
                    </td>
                    <td>{emp.department}</td>
                    <td>{emp.designation}</td>
                    <td>{formatDate(emp.joining_date)}</td>
                    <td>
                      <strong>{formatCurrency(emp.salary)}</strong>
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusBadge(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-action"
                          onClick={() => setViewingEmployee(emp)}
                        >
                          View
                        </button>
                        <button
                          className="btn-action btn-action-blue"
                          onClick={() => openEditModal(emp)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-action btn-action-danger"
                          onClick={() => handleDelete(emp)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmployee ? 'Update Employee Profile' : 'Register New Employee'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="employee_code">Employee ID *</label>
                  <input
                    id="employee_code"
                    type="text"
                    placeholder="e.g., EMP2026007"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="status">Employment Status *</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="full_name">Full Name *</label>
                <input
                  id="full_name"
                  type="text"
                  placeholder="e.g., Vikramaditya Rao"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="email">Official Email *</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@auspify.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="phone">Phone Number (10–15 digits) *</label>
                  <input
                    id="phone"
                    type="tel"
                    pattern="[0-9]{10,15}"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="department">Department (Select or Type New) *</label>
                  <input
                    id="department"
                    list="dept-options"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  />
                  <datalist id="dept-options">
                    {departments.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                <div className="form-field">
                  <label htmlFor="designation">Designation / Role *</label>
                  <input
                    id="designation"
                    type="text"
                    placeholder="e.g., Full-Stack Developer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="joining_date">Joining Date *</label>
                  <input
                    id="joining_date"
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="salary">Monthly Salary (₹) *</label>
                  <input
                    id="salary"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="75000"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'Save Changes' : 'Complete Registration'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Profile View Modal */}
      {viewingEmployee && (
        <div className="modal-backdrop" onClick={() => setViewingEmployee(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Employee Profile Specification</h3>
              <button className="close-btn" onClick={() => setViewingEmployee(null)}>
                ×
              </button>
            </div>
            <div className="detail-list">
              <div className="detail-item">
                <span>Employee ID</span>
                <strong className="mono">{viewingEmployee.employee_code}</strong>
              </div>
              <div className="detail-item">
                <span>Full Name</span>
                <strong>{viewingEmployee.full_name}</strong>
              </div>
              <div className="detail-item">
                <span>Email Address</span>
                <strong>{viewingEmployee.email}</strong>
              </div>
              <div className="detail-item">
                <span>Phone Number</span>
                <strong>{viewingEmployee.phone}</strong>
              </div>
              <div className="detail-item">
                <span>Department</span>
                <strong>{viewingEmployee.department}</strong>
              </div>
              <div className="detail-item">
                <span>Designation</span>
                <strong>{viewingEmployee.designation}</strong>
              </div>
              <div className="detail-item">
                <span>Joining Date</span>
                <strong>{formatDate(viewingEmployee.joining_date)}</strong>
              </div>
              <div className="detail-item">
                <span>Monthly Salary</span>
                <strong>{formatCurrency(viewingEmployee.salary)}</strong>
              </div>
              <div className="detail-item">
                <span>Employment Status</span>
                <strong>{viewingEmployee.status}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  const target = viewingEmployee;
                  setViewingEmployee(null);
                  openEditModal(target);
                }}
              >
                Edit Profile
              </button>
              <button className="btn btn-secondary" onClick={() => setViewingEmployee(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}