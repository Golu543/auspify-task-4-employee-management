const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auspify_employee_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Input Validation Helper
function validateEmployeePayload(data) {
  const errors = [];
  const {
    employee_code,
    full_name,
    email,
    phone,
    department,
    designation,
    joining_date,
    salary,
    status
  } = data;

  if (!employee_code || String(employee_code).trim().length < 3) {
    errors.push('Employee ID is required (minimum 3 characters).');
  }
  if (!full_name || String(full_name).trim().length < 2) {
    errors.push('Full Name is required.');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(String(email).trim())) {
    errors.push('A valid Email Address is required.');
  }
  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phone || !phoneRegex.test(String(phone).trim())) {
    errors.push('Phone number must contain 10 to 15 digits.');
  }
  if (!department || String(department).trim().length < 2) {
    errors.push('Department is required.');
  }
  if (!designation || String(designation).trim().length < 2) {
    errors.push('Designation is required.');
  }
  if (!joining_date || isNaN(new Date(joining_date).getTime())) {
    errors.push('A valid Joining Date is required.');
  }
  const salNum = Number(salary);
  if (isNaN(salNum) || salNum < 0) {
    errors.push('Salary must be a non-negative number.');
  }
  if (status && !['Active', 'On Leave', 'Resigned'].includes(status)) {
    errors.push('Status must be Active, On Leave, or Resigned.');
  }

  return errors;
}

// 1. Health Check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'Employee API and MySQL connected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed.' });
  }
});

// 2. Dashboard Summary KPIs & Recent Hires
app.get('/api/dashboard', async (req, res) => {
  try {
    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) AS total_employees,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_employees,
        COUNT(CASE WHEN status = 'On Leave' THEN 1 END) AS on_leave_employees,
        COUNT(CASE WHEN status = 'Resigned' THEN 1 END) AS resigned_employees,
        COUNT(DISTINCT department) AS total_departments,
        COALESCE(SUM(CASE WHEN status != 'Resigned' THEN salary ELSE 0 END), 0) AS active_payroll
      FROM employees
    `);

    const [departments] = await pool.query(`
      SELECT 
        department,
        COUNT(*) AS employee_count,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_count,
        ROUND(AVG(salary), 2) AS avg_salary,
        SUM(salary) AS total_salary
      FROM employees
      GROUP BY department
      ORDER BY employee_count DESC
    `);

    const [recentHires] = await pool.query(`
      SELECT id, employee_code, full_name, department, designation, joining_date, status
      FROM employees
      ORDER BY joining_date DESC, id DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        ...summary[0],
        department_breakdown: departments,
        recent_hires: recentHires
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard metrics.' });
  }
});

// 3. Get All Employees (Search + Department Filter + Status Filter)
app.get('/api/employees', async (req, res) => {
  try {
    const { search = '', department = '', status = '' } = req.query;
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search.trim()) {
      query += ' AND (full_name LIKE ? OR employee_code LIKE ? OR email LIKE ? OR department LIKE ? OR designation LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (department.trim()) {
      query += ' AND department = ?';
      params.push(department.trim());
    }

    if (status.trim()) {
      query += ' AND status = ?';
      params.push(status.trim());
    }

    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);
    const [deptRows] = await pool.query('SELECT DISTINCT department FROM employees ORDER BY department ASC');

    res.json({
      success: true,
      count: rows.length,
      data: rows,
      departments: deptRows.map((d) => d.department)
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve employees.' });
  }
});

// 4. Get Single Employee by ID
app.get('/api/employees/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employee record.' });
  }
});

// 5. Register New Employee
app.post('/api/employees', async (req, res) => {
  try {
    const errors = validateEmployeePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const {
      employee_code,
      full_name,
      email,
      phone,
      department,
      designation,
      joining_date,
      salary,
      status = 'Active'
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO employees (employee_code, full_name, email, phone, department, designation, joining_date, salary, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_code.trim().toUpperCase(),
        full_name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        department.trim(),
        designation.trim(),
        joining_date,
        Number(salary),
        status
      ]
    );

    const [created] = await pool.query('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Employee registered successfully.',
      data: created[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'An employee with this Employee ID or Email already exists.'
      });
    }
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to register employee.' });
  }
});

// 6. Update Employee Record
app.put('/api/employees/:id', async (req, res) => {
  try {
    const empId = req.params.id;
    const [existing] = await pool.query('SELECT * FROM employees WHERE id = ?', [empId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found.' });
    }

    const errors = validateEmployeePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const {
      employee_code,
      full_name,
      email,
      phone,
      department,
      designation,
      joining_date,
      salary,
      status
    } = req.body;

    await pool.query(
      `UPDATE employees
       SET employee_code = ?, full_name = ?, email = ?, phone = ?, department = ?, designation = ?, joining_date = ?, salary = ?, status = ?
       WHERE id = ?`,
      [
        employee_code.trim().toUpperCase(),
        full_name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        department.trim(),
        designation.trim(),
        joining_date,
        Number(salary),
        status || 'Active',
        empId
      ]
    );

    const [updated] = await pool.query('SELECT * FROM employees WHERE id = ?', [empId]);
    res.json({
      success: true,
      message: 'Employee record updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Another employee already uses this Employee ID or Email.'
      });
    }
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee record.' });
  }
});

// 7. Delete Employee Record
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found.' });
    }
    res.json({ success: true, message: 'Employee record deleted successfully.' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee record.' });
  }
});

app.listen(PORT, () => {
  console.log(`Employee API running on http://localhost:${PORT}`);
});