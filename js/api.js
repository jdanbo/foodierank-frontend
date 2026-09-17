// const API_BASE_URL = 'http://localhost:8000/api/v1';
const API_BASE_URL = 'https://foodierank-backend-glkt.onrender.com';

// Helpers para gestionar el token y usuario
const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  },
  isAdmin: () => {
    const user = Auth.getUser();
    return user && user.rol === 'admin';
  }
};

// Cliente HTTP reutilizable con fetch()
async function apiRequest(endpoint, method = 'GET', body = null, requireAuth = false) {
  const headers = { 'Content-Type': 'application/json' };

  if (requireAuth) {
    const token = Auth.getToken();
    if (!token) {
      window.location.href = 'login.html';
      throw new Error('No autenticado');
    }
    headers['Authorization'] = token;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error en la petición');
  }

  return data;
}

function renderNav() {
  const navContainer = document.getElementById('nav-user-actions');
  if (!navContainer) return;

  const user = Auth.getUser();

  if (user) {
    const isAdmin = user.rol === 'admin';
    navContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="color: var(--text-secondary); font-size: 0.9rem;">
          Hola, <strong style="color: var(--text-primary);">${user.nombre}</strong>
        </span>
        ${isAdmin ? '<a href="admin.html" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--accent-gold); color: var(--accent-gold); text-decoration: none;">Panel Admin</a>' : ''}
        <button onclick="Auth.logout()" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">Salir</button>
      </div>
    `;
  } else {
    navContainer.innerHTML = `
      <a href="login.html" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.85rem;">Ingresar</a>
      <a href="register.html" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.85rem;">Registrarse</a>
    `;
  }
}

document.addEventListener('DOMContentLoaded', renderNav);