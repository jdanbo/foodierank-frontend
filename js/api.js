// Detección dinámica de entorno (Localhost vs Producción en Render)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api/v1'
  : 'https://foodierank-backend-glkt.onrender.com/api/v1';

// Helpers para gestionar tokens y sesión de usuario
const Auth = {
  getToken: () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token ? token.trim() : null;
  },

  getUser: () => {
    try {
      // Compatibilidad con claves 'user' y 'usuario'
      const raw = localStorage.getItem('usuario') 
        || localStorage.getItem('user') 
        || sessionStorage.getItem('usuario') 
        || sessionStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Error al parsear el usuario de la sesión:', e);
      return null;
    }
  },

  setSession: (token, user) => {
    if (token) {
      localStorage.setItem('token', token.trim());
    }
    if (user) {
      localStorage.setItem('usuario', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
  },

  isAdmin: () => {
    const user = Auth.getUser();
    return !!(user && user.rol === 'admin');
  }
};

// Cliente HTTP reutilizable con fetch()
async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = false) {
  const headers = {};

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (requiresAuth) {
    const token = Auth.getToken();
    if (!token) {
      throw new Error('Debes iniciar sesión para realizar esta acción.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textError = await response.text();
      console.error(`[Error no-JSON del servidor en ${endpoint}]:`, textError);

      if (response.status === 401) {
        throw new Error('Tu sesión ha expirado o el token no es válido. Vuelve a iniciar sesión.');
      }
      if (response.status === 403) {
        throw new Error('Acceso denegado: no tienes permisos para realizar esta acción.');
      }
      throw new Error(`El servidor respondió con estado ${response.status}: ${textError.slice(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data?.message || `Error en la petición (Código ${response.status})`);
    }

    return data;
  } catch (error) {
    console.error(`Error en API (${endpoint}):`, error.message);
    throw error;
  }
}

// Renderizado de la barra de navegación según sesión
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
        <button onclick="Auth.logout()" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; cursor: pointer;">Salir</button>
      </div>
    `;
  } else {
    navContainer.innerHTML = `
      <a href="login.html" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.85rem; text-decoration: none;">Ingresar</a>
      <a href="register.html" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.85rem; text-decoration: none;">Registrarse</a>
    `;
  }
}

document.addEventListener('DOMContentLoaded', renderNav);