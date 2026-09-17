document.addEventListener('DOMContentLoaded', () => {
  // Si ya hay sesión activa, redirigir directo al listado de restaurantes
  if (Auth.getToken()) {
    window.location.href = 'restaurants.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const alertBox = document.getElementById('auth-alert');

  // Helper para pintar alertas visuales simples (una sola línea)
  function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
  }

  // Helper para pintar el aviso de notificaciones (puede tener varias líneas)
  function showNotificationsBanner(notificaciones) {
    if (!alertBox || !notificaciones || notificaciones.length === 0) return false;

    const hayRechazos = notificaciones.some(n => n.estado === 'rechazado');

    const lineas = notificaciones.map(n => {
      const icono = n.estado === 'aprobado' ? '✅' : '❌';
      if (n.tipo === 'restaurante') {
        return `${icono} Tu restaurante "${n.nombre}" fue ${n.estado}.`;
      }
      return `${icono} Tu plato "${n.nombre}"${n.restaurante ? ` (en ${n.restaurante})` : ''} fue ${n.estado}.`;
    });

    alertBox.innerHTML = lineas.join('<br>');
    alertBox.className = `alert alert-${hayRechazos ? 'error' : 'success'}`;
    alertBox.style.display = 'block';
    return true;
  }

  // Consulta si el usuario tiene solicitudes (restaurante/plato) recién decididas
  async function checkPendingNotifications() {
    try {
      const res = await apiRequest('/restaurants/notifications/mine', 'GET', null, true);
      if (res.ok && res.data && res.data.length > 0) {
        return showNotificationsBanner(res.data);
      }
    } catch (err) {
      console.error('No se pudieron consultar notificaciones:', err.message);
    }
    return false;
  }

  // 1. Manejador de Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit');
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        btn.disabled = true;
        btn.textContent = 'Verificando...';

        const response = await apiRequest('/auth/login', 'POST', { email, password });

        if (response.ok && response.token) {
          // Guardar token JWT y datos de usuario en localStorage
          Auth.setSession(response.token, response.user);

          // Ver si hay avisos de restaurantes/platos recién aprobados o rechazados
          const tieneNotificaciones = await checkPendingNotifications();

          if (!tieneNotificaciones) {
            showAlert('Ingreso exitoso. Redirigiendo...', 'success');
          }

          setTimeout(() => {
            // Si es administrador, redirigir al panel; si no, al catálogo
            window.location.href = response.user.rol === 'admin' ? 'admin.html' : 'restaurants.html';
          }, tieneNotificaciones ? 4000 : 1000);
        }
      } catch (error) {
        showAlert(error.message || 'Error al iniciar sesión');
        btn.disabled = false;
        btn.textContent = 'Ingresar';
      }
    });
  }

  // 2. Manejador de Registro
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit');
      const nombre = document.getElementById('nombre').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        btn.disabled = true;
        btn.textContent = 'Registrando...';

        // El registro público siempre crea usuarios con rol 'usuario'.
        // No se envía ningún campo "rol" desde el cliente.
        const response = await apiRequest('/auth/register', 'POST', {
          nombre,
          email,
          password
        });

        if (response.ok) {
          showAlert('¡Cuenta creada con éxito! Redirigiendo al login...', 'success');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1500);
        }
      } catch (error) {
        showAlert(error.message || 'Error al procesar registro');
        btn.disabled = false;
        btn.textContent = 'Crear Cuenta';
      }
    });
  }
});