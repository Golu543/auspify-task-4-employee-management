CREATE DATABASE IF NOT EXISTS auspify_employee_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE auspify_employee_db;

DROP TABLE IF EXISTS employees;

-- Employees Table
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(140) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    department VARCHAR(80) NOT NULL,
    designation VARCHAR(90) NOT NULL,
    joining_date DATE NOT NULL,
    salary DECIMAL(10, 2) NOT NULL CHECK (salary >= 0),
    status ENUM('Active', 'On Leave', 'Resigned') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_name ON employees(full_name);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);

-- Seed Data: 6 Professional Employee Records
INSERT INTO employees (employee_code, full_name, email, phone, department, designation, joining_date, salary, status) VALUES
('EMP2026001', 'Aarav Sharma', 'aarav.sharma@auspify.com', '9876543210', 'Computer Science', 'Senior Software Engineer', '2024-01-15', 95000.00, 'Active'),
('EMP2026002', 'Priya Verma', 'priya.verma@auspify.com', '9876543211', 'Information Technology', 'Systems Administrator', '2023-11-20', 82000.00, 'Active'),
('EMP2026003', 'Rohan Mehta', 'rohan.mehta@auspify.com', '9876543212', 'Human Resources', 'HR Manager', '2022-06-10', 78000.00, 'Active'),
('EMP2026004', 'Ananya Nair', 'ananya.nair@auspify.com', '9876543213', 'Finance', 'Financial Analyst', '2023-03-01', 88000.00, 'On Leave'),
('EMP2026005', 'Kabir Joshi', 'kabir.joshi@auspify.com', '9876543214', 'Quality Assurance', 'QA Lead', '2021-09-12', 91000.00, 'Active'),
('EMP2026006', 'Sneha Kapoor', 'sneha.kapoor@auspify.com', '9876543215', 'Marketing', 'Digital Marketing Specialist', '2024-05-10', 65000.00, 'Resigned');