/**
 * FLL API Bridge - يربط التصميم الجديد بـ AWS Backend
 * ⛔ لا يعدل أي عنصر تصميمي
 * ✅ يضيف وظائف الاتصال بـ AWS APIs فقط
 * 
 * APIs:
 * - Auth: https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com
 * - AI Dashboard: https://51n1gng40f.execute-api.me-south-1.amazonaws.com
 */

const FLL_CONFIG = {
  API_BASE: 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com',
  AI_API_BASE: 'https://51n1gng40f.execute-api.me-south-1.amazonaws.com',
  COGNITO: {
    USER_POOL_ID: 'me-south-1_aJtmQ0QrN',
    CLIENT_ID: '6n49ej8fl92i9rtotbk5o9o0d1',
    REGION: 'me-south-1'
  },
  SUPABASE: {
    URL: 'https://djebhztfewjfyyoortvv.supabase.co',
    ANON_KEY: '' // يُضاف لاحقاً
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
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('fll_token', data.token);
      localStorage.setItem('fll_user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(userData) {
    const res = await fetch(`${FLL_CONFIG.API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  async verifyOTP(email, code) {
    const res = await fetch(`${FLL_CONFIG.API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    return res.json();
  },

  async resendOTP(email) {
    const res = await fetch(`${FLL_CONFIG.API_BASE}/auth/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async forgotPassword(email) {
    const res = await fetch(`${FLL_CONFIG.API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async resetPassword(email, code, newPassword) {
    const res = await fetch(`${FLL_CONFIG.API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password: newPassword })
    });
    return res.json();
  },

  async getMe() {
    const token = localStorage.getItem('fll_token');
    if (!token) return null;
    const res = await fetch(`${FLL_CONFIG.API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { this.logout(); return null; }
    return res.json();
  },

  logout() {
    localStorage.removeItem('fll_token');
    localStorage.removeItem('fll_user');
    window.location.href = '/';
  },

  isLoggedIn() {
    return !!localStorage.getItem('fll_token');
  },

  getToken() {
    return localStorage.getItem('fll_token');
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('fll_user')); }
    catch { return null; }
  }
};

// ========================
// API Helper with Auth
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
// Complaints API
// ========================
const FLLComplaints = {
  async getAll() { return fllAPI('/complaints'); },
  async getStats() { return fllAPI('/complaints/stats'); },
  async getById(ticketId) { return fllAPI(`/complaints/${ticketId}`); },
  async getByDept(deptId) { return fllAPI(`/complaints/dept/${deptId}`); },
  async create(data) { return fllAPI('/complaints', { method: 'POST', body: JSON.stringify(data) }); },
  async update(ticketId, data) { return fllAPI(`/complaints/${ticketId}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async assign(ticketId, data) { return fllAPI(`/complaints/${ticketId}/assign`, { method: 'POST', body: JSON.stringify(data) }); },
  async transfer(ticketId, data) { return fllAPI(`/complaints/${ticketId}/transfer`, { method: 'POST', body: JSON.stringify(data) }); },
  async escalate(ticketId, data) { return fllAPI(`/complaints/${ticketId}/escalate`, { method: 'POST', body: JSON.stringify(data) }); },
  async resolve(ticketId, data) { return fllAPI(`/complaints/${ticketId}/resolve`, { method: 'POST', body: JSON.stringify(data) }); }
};

// ========================
// Fleet API
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
  async getDriverAssignments(driverId) { return fllAPI(`/fleet/assignments/driver/${driverId}`); },
  async createAssignment(data) { return fllAPI('/fleet/assignments', { method: 'POST', body: JSON.stringify(data) }); },
  async updateAssignment(id, data) { return fllAPI(`/fleet/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async unassign(id) { return fllAPI(`/fleet/assignments/${id}/unassign`, { method: 'POST' }); }
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
// Route Guard - حماية الصفحات
// ========================
function requireAuth(allowedGroups = []) {
  if (!FLLAuth.isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }
  if (allowedGroups.length > 0) {
    const user = FLLAuth.getUser();
    if (!user || !allowedGroups.some(g => user.groups?.includes(g))) {
      window.location.href = '/unauthorized.html';
      return false;
    }
  }
  return true;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FLL_CONFIG, FLLAuth, FLLComplaints, FLLFleet, FLLFinance, FLLAI, fllAPI, requireAuth };
}

console.log('✅ FLL API Bridge loaded — connected to AWS Backend');
