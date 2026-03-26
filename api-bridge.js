/**
 * FLL API Bridge v3.0 — يربط التصميم بـ AWS Backend
 * ✅ جميع الـ APIs متاحة
 * 
 * APIs:
 * - Auth: /auth/* (login, register, verify, forgot, reset)
 * - Platform: /api/* (drivers, orders, staff, complaints, fleet, etc.)
 * - AI Dashboard: https://51n1gng40f.execute-api.me-south-1.amazonaws.com
 * - Finance: /finance/* (generate-stc-excel)
 */

const FLL_CONFIG = {
  API_BASE: 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com',
  AI_API_BASE: 'https://51n1gng40f.execute-api.me-south-1.amazonaws.com',
  COGNITO: {
    USER_POOL_ID: 'me-south-1_aJtmQ0QrN',
    CLIENT_ID: '6n49ej8fl92l9rtotbk5o9o0d1',
    REGION: 'me-south-1'
  }
};

// ========================
// Auth API Client
// ========================
const FLLAuth = {
  async login(identifier, password) {
    const res = await fetch(`${FLL_CONFIG.API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('fll_token', data.token);
      localStorage.setItem('fll_user', JSON.stringify(data));
    }
    return data;
  },
  async register(userData) {
    return (await fetch(`${FLL_CONFIG.API_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })).json();
  },
  async verifyOTP(email, code) {
    return (await fetch(`${FLL_CONFIG.API_BASE}/auth/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    })).json();
  },
  async forgotPassword(email) {
    return (await fetch(`${FLL_CONFIG.API_BASE}/auth/forgot`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, identifier: email })
    })).json();
  },
  async resetPassword(email, code, password) {
    return (await fetch(`${FLL_CONFIG.API_BASE}/auth/reset`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, identifier: email, code, password })
    })).json();
  },
  logout() {
    localStorage.removeItem('fll_token');
    localStorage.removeItem('fll_user');
    window.location.href = '/';
  },
  isLoggedIn() { return !!localStorage.getItem('fll_token'); },
  getToken() { return localStorage.getItem('fll_token'); },
  getUser() { try { return JSON.parse(localStorage.getItem('fll_user')); } catch { return null; } }
};

// ========================
// Platform API Client (CRUD for all DynamoDB tables)
// ========================
async function fllAPI(endpoint, options = {}) {
  const token = FLLAuth.getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  };
  const base = options.aiApi ? FLL_CONFIG.AI_API_BASE : FLL_CONFIG.API_BASE;
  const res = await fetch(`${base}${endpoint}`, config);
  if (res.status === 401) { FLLAuth.logout(); return null; }
  return res.json();
}

// ========================
// Resource APIs (all map to /api/{resource})
// ========================
function createResourceAPI(name) {
  return {
    getAll(params = {}) { 
      const qs = new URLSearchParams(params).toString();
      return fllAPI(`/api/${name}${qs ? '?' + qs : ''}`); 
    },
    getById(id) { return fllAPI(`/api/${name}/${id}`); },
    create(data) { return fllAPI(`/api/${name}`, { method: 'POST', body: JSON.stringify(data) }); },
    update(id, data) { return fllAPI(`/api/${name}/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    delete(id) { return fllAPI(`/api/${name}/${id}`, { method: 'DELETE' }); }
  };
}

const FLLDrivers = createResourceAPI('drivers');
const FLLOrders = createResourceAPI('orders');
const FLLStaffUsers = createResourceAPI('staff-users');
const FLLComplaints = createResourceAPI('complaints');
const FLLVehicles = createResourceAPI('vehicles');
const FLLNotifications = createResourceAPI('notifications');
const FLLTasks = createResourceAPI('tasks');
const FLLApprovals = createResourceAPI('approvals');
const FLLDepartments = createResourceAPI('departments');
const FLLPayoutRuns = createResourceAPI('payout-runs');
const FLLPayoutLines = createResourceAPI('payout-lines');
const FLLAuditLog = createResourceAPI('audit-log');
const FLLUserProfiles = createResourceAPI('user-profiles');
const FLLSystemSettings = createResourceAPI('system-settings');
const FLLVehicleAssignments = createResourceAPI('vehicle-assignments');
const FLLRoles = createResourceAPI('roles');
const FLLPermissions = createResourceAPI('permissions');
const FLLInvoices = createResourceAPI('invoices');
const FLLShipments = createResourceAPI('shipments');
const FLLAttendance = createResourceAPI('attendance');

// ========================
// Stats API
// ========================
const FLLStats = {
  async getDashboard() { return fllAPI('/api/stats'); }
};

// ========================
// Complaints API (extended)
// ========================
const FLLComplaintsExt = {
  ...FLLComplaints,
  async getStats() { return fllAPI('/complaints/stats'); },
  async getByDept(deptId) { return fllAPI(`/complaints/dept/${deptId}`); },
  async assign(ticketId, data) { return fllAPI(`/complaints/${ticketId}/assign`, { method: 'POST', body: JSON.stringify(data) }); },
  async transfer(ticketId, data) { return fllAPI(`/complaints/${ticketId}/transfer`, { method: 'POST', body: JSON.stringify(data) }); },
  async escalate(ticketId, data) { return fllAPI(`/complaints/${ticketId}/escalate`, { method: 'POST', body: JSON.stringify(data) }); },
  async resolve(ticketId, data) { return fllAPI(`/complaints/${ticketId}/resolve`, { method: 'POST', body: JSON.stringify(data) }); }
};

// ========================
// Fleet API (extended)
// ========================
const FLLFleet = {
  async getVehicles() { return fllAPI('/fleet/vehicles'); },
  async getAvailable() { return fllAPI('/fleet/vehicles/available'); },
  async getVehicle(id) { return fllAPI(`/fleet/vehicles/${id}`); },
  async createVehicle(data) { return fllAPI('/fleet/vehicles', { method: 'POST', body: JSON.stringify(data) }); },
  async updateVehicle(id, data) { return fllAPI(`/fleet/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteVehicle(id) { return fllAPI(`/fleet/vehicles/${id}`, { method: 'DELETE' }); },
  async addMaintenance(id, data) { return fllAPI(`/fleet/vehicles/${id}/maintenance`, { method: 'POST', body: JSON.stringify(data) }); },
  async getStats() { return fllAPI('/fleet/stats'); },
  async getAssignments() { return fllAPI('/fleet/assignments'); },
  async createAssignment(data) { return fllAPI('/fleet/assignments', { method: 'POST', body: JSON.stringify(data) }); }
};

// ========================
// Finance API
// ========================
const FLLFinance = {
  async generateSTCExcel(data) { return fllAPI('/finance/generate-stc-excel', { method: 'POST', body: JSON.stringify(data) }); }
};

// ========================
// AI Dashboard API
// ========================
const FLLAI = {
  async getRuns() { return fllAPI('/runs', { aiApi: true }); },
  async getRun(id) { return fllAPI(`/runs/${id}`, { aiApi: true }); },
  async getReport(id) { return fllAPI(`/reports/${id}`, { aiApi: true }); }
};

// ========================
// Route Guard
// ========================
function requireAuth(allowedGroups = []) {
  if (!FLLAuth.isLoggedIn()) { window.location.href = '/login'; return false; }
  if (allowedGroups.length > 0) {
    const user = FLLAuth.getUser();
    if (!user || !allowedGroups.some(g => user.groups?.includes(g))) {
      window.location.href = '/unauthorized'; return false;
    }
  }
  return true;
}

// Export globally
window.FLL = {
  CONFIG: FLL_CONFIG, Auth: FLLAuth, Stats: FLLStats,
  Drivers: FLLDrivers, Orders: FLLOrders, StaffUsers: FLLStaffUsers,
  Complaints: FLLComplaintsExt, Fleet: FLLFleet, Finance: FLLFinance,
  Vehicles: FLLVehicles, Notifications: FLLNotifications, Tasks: FLLTasks,
  Approvals: FLLApprovals, Departments: FLLDepartments,
  PayoutRuns: FLLPayoutRuns, PayoutLines: FLLPayoutLines,
  AuditLog: FLLAuditLog, UserProfiles: FLLUserProfiles,
  SystemSettings: FLLSystemSettings, VehicleAssignments: FLLVehicleAssignments,
  Roles: FLLRoles, Permissions: FLLPermissions, AI: FLLAI,
  Invoices: FLLInvoices, Shipments: FLLShipments, Attendance: FLLAttendance,
  api: fllAPI, requireAuth
};

console.log('✅ FLL API Bridge v3.0 loaded — ' + Object.keys(window.FLL).length + ' modules');
