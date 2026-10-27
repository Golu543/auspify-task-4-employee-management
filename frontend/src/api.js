const API_BASE = 'http://localhost:5003/api';

async function request(endpoint, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'API request failed.');
  }
  return data;
}

export const api = {
  getDashboard: () => request('/dashboard'),

  getEmployees: (search = '', department = '', status = '') => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (department.trim()) params.append('department', department.trim());
    if (status.trim()) params.append('status', status.trim());
    return request(`/employees?${params.toString()}`);
  },

  createEmployee: (payload) =>
    request('/employees', { method: 'POST', body: JSON.stringify(payload) }),

  updateEmployee: (id, payload) =>
    request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteEmployee: (id) =>
    request(`/employees/${id}`, { method: 'DELETE' })
};

export function exportToCsv(filename, rows, headers) {
  if (!rows || rows.length === 0) return;

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return /[,"\n]/.test(str) ? `"${str}"` : str;
  };

  const csvContent = [
    headers.map((h) => escapeCell(h.label)).join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h.key])).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

export function toInputDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toISOString().split('T')[0];
}

export function getStatusBadge(status) {
  if (status === 'Active') return 'badge-emerald';
  if (status === 'On Leave') return 'badge-amber';
  return 'badge-crimson';
}