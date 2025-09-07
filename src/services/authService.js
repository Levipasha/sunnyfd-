// Use explicit env if provided; otherwise default to deployed backend URL in production
// and localhost mapping in development.
const resolveApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) return envUrl;
  try {
    const { origin } = window.location;
    // If running locally on CRA dev server, map to backend on :5000
    if (origin.includes(':3000')) return origin.replace(':3000', ':5000');
    // In hosted environments (e.g., Vercel/Netlify), use the deployed backend URL
    return 'https://sunny-bd.onrender.com';
  } catch {
    return 'https://sunny-bd.onrender.com';
  }
};

const API_BASE_URL = resolveApiBaseUrl();

async function safeJson(res) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  const text = await res.text();
  throw new Error(text || `HTTP ${res.status}`);
}

const AuthService = {
  async seedDefault(name = 'Vamshi', password = 'Vamshi.c2002', passkey = '2003') {
    const res = await fetch(`${API_BASE_URL}/auth/seed-default`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, passkey })
    });
    if (!res.ok) throw new Error(await res.text());
    return safeJson(res);
  },

  async login(name, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async verifyPasskey(name, passkey) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-passkey`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, passkey })
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Invalid passkey');
    return data;
  },

  async resetPassword(name, newPassword, passkey) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, newPassword, passkey })
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Reset failed');
    return data;
  },

  async verifyMaster(masterKey) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-master`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterKey })
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Invalid master key');
    return data;
  },

  async resetPasskey(name, newPasskey, masterKey) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-passkey`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, newPasskey, masterKey })
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Passkey reset failed');
    return data;
  }
};

export default AuthService;


