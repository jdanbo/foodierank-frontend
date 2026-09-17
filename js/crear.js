document.addEventListener('DOMContentLoaded', () => {
  // Si no hay sesión iniciada, no se puede acceder a esta pantalla
  if (!Auth.getToken()) {
    window.location.href = 'login.html';
    return;
  }

  const alertBox = document.getElementById('page-alert');

  const choiceSection = document.getElementById('choice-section');
  const restaurantSection = document.getElementById('restaurant-form-section');
  const dishSection = document.getElementById('dish-form-section');
  const noRestaurantSection = document.getElementById('no-restaurant-section');

  function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hideAllSections() {
    choiceSection.style.display = 'none';
    restaurantSection.style.display = 'none';
    dishSection.style.display = 'none';
    noRestaurantSection.style.display = 'none';
  }

  function showChoice() {
    hideAllSections();
    choiceSection.style.display = 'block';
    alertBox.style.display = 'none';
  }

  // Botones "← Volver" de cada formulario
  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', showChoice);
  });

  // --- OPCIÓN: Registrar Restaurante ---
  document.getElementById('btn-choice-restaurant').addEventListener('click', async () => {
    hideAllSections();
    restaurantSection.style.display = 'block';
    await loadCategoriesIntoSelect();
  });

  async function loadCategoriesIntoSelect() {
    const select = document.getElementById('r-categoria');
    try {
      const res = await apiRequest('/categories');
      if (res.ok && res.data) {
        // Evitar duplicar opciones si el usuario entra varias veces
        select.querySelectorAll('option[data-cat]').forEach(o => o.remove());
        res.data.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat._id;
          opt.textContent = cat.nombre;
          opt.setAttribute('data-cat', '1');
          select.appendChild(opt);
        });
      }
    } catch (err) {
      showAlert('No se pudieron cargar las categorías. Intenta de nuevo.');
    }
  }

  const restaurantForm = document.getElementById('restaurant-form');
  restaurantForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-restaurant');

    const payload = {
      nombre: document.getElementById('r-nombre').value.trim(),
      descripcion: document.getElementById('r-descripcion').value.trim(),
      categoriaId: document.getElementById('r-categoria').value,
      ubicacion: document.getElementById('r-ubicacion').value.trim(),
      horario: document.getElementById('r-horario').value.trim(),
      imagenUrl: document.getElementById('r-imagen').value.trim(),
      platoNombre: document.getElementById('rp-nombre').value.trim(),
      platoDescripcion: document.getElementById('rp-descripcion').value.trim(),
      platoPrecio: document.getElementById('rp-precio').value,
      platoImagenUrl: document.getElementById('rp-imagen').value.trim()
    };

    try {
      btn.disabled = true;
      btn.textContent = 'Enviando...';

      const res = await apiRequest('/restaurants/with-dish', 'POST', payload, true);

      showAlert(res.message || '¡Restaurante y plato registrados!', 'success');
      restaurantForm.reset();

      setTimeout(() => {
        window.location.href = 'restaurants.html';
      }, 1800);
    } catch (err) {
      showAlert(err.message || 'Error al registrar el restaurante');
      btn.disabled = false;
      btn.textContent = 'Enviar para Aprobación';
    }
  });

  // --- OPCIÓN: Registrar Plato ---
  document.getElementById('btn-choice-dish').addEventListener('click', async () => {
    await loadMyRestaurantsForDish();
  });

  document.getElementById('btn-go-create-restaurant').addEventListener('click', async () => {
    hideAllSections();
    restaurantSection.style.display = 'block';
    await loadCategoriesIntoSelect();
  });

  async function loadMyRestaurantsForDish() {
    try {
      const res = await apiRequest('/restaurants/mine', 'GET', null, true);
      const misRestaurantes = (res.ok && res.data) ? res.data : [];

      if (misRestaurantes.length === 0) {
        hideAllSections();
        noRestaurantSection.style.display = 'block';
        return;
      }

      const select = document.getElementById('d-restaurante');
      select.innerHTML = '';
      misRestaurantes.forEach(rest => {
        const opt = document.createElement('option');
        opt.value = rest._id;
        opt.textContent = `${rest.nombre} (${rest.estado})`;
        select.appendChild(opt);
      });

      hideAllSections();
      dishSection.style.display = 'block';
    } catch (err) {
      showAlert(err.message || 'Error al consultar tus restaurantes');
    }
  }

  const dishForm = document.getElementById('dish-form');
  dishForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-dish');
    const restauranteId = document.getElementById('d-restaurante').value;

    const payload = {
      nombre: document.getElementById('d-nombre').value.trim(),
      descripcion: document.getElementById('d-descripcion').value.trim(),
      precio: document.getElementById('d-precio').value,
      imagenUrl: document.getElementById('d-imagen').value.trim()
    };

    try {
      btn.disabled = true;
      btn.textContent = 'Enviando...';

      const res = await apiRequest(`/restaurants/${restauranteId}/dishes`, 'POST', payload, true);

      showAlert(res.message || '¡Plato registrado!', 'success');
      dishForm.reset();

      setTimeout(() => {
        window.location.href = 'restaurants.html';
      }, 1800);
    } catch (err) {
      showAlert(err.message || 'Error al registrar el plato');
      btn.disabled = false;
      btn.textContent = 'Enviar para Aprobación';
    }
  });
});