document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('restaurants-grid');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');
  const statusMessage = document.getElementById('status-message');

  let currentRestaurants = [];

  function showMessage(msg, type = 'error') {
    if (!statusMessage) return;
    statusMessage.textContent = msg;
    statusMessage.className = `alert alert-${type}`;
    statusMessage.style.display = 'block';
  }

  async function loadCategories() {
    try {
      const res = await apiRequest('/categories');
      if (res.ok && res.data) {
        res.data.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat._id;
          opt.textContent = cat.nombre;
          categoryFilter.appendChild(opt);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchRestaurants(categoryId = '') {
    grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">Cargando experiencias gastronómicas...</p>';
    try {
      const url = categoryId ? `/restaurants?categoriaId=${categoryId}` : '/restaurants';
      const res = await apiRequest(url);
      if (res.ok) {
        currentRestaurants = res.data;
        applySortingAndRender();
      }
    } catch (err) {
      grid.innerHTML = '';
      showMessage(err.message || 'Error cargando restaurantes');
    }
  }

  function applySortingAndRender() {
    const sortBy = sortFilter.value;
    let sorted = [...currentRestaurants];

    if (sortBy === 'ranking-desc') {
      sorted.sort((a, b) => (b.ranking || 0) - (a.ranking || 0));
    } else if (sortBy === 'reviews-desc') {
      sorted.sort((a, b) => (b.totalResenas || 0) - (a.totalResenas || 0));
    }

    renderCards(sorted);
  }

  function renderCards(restaurants) {
    grid.innerHTML = '';
    if (!restaurants || restaurants.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No se encontraron restaurantes en esta categoría.</div>';
      return;
    }

    restaurants.forEach(rest => {
      const card = document.createElement('article');
      card.className = 'card restaurant-card';

      const img1 = rest.imagenUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600';
      const img2 = rest.imagenFachada2 || rest.imagenUrl;
      const rankingFormatted = Number(rest.ranking || 0).toFixed(1);

      card.innerHTML = `
        <div>
          <!-- Galería dual estética de fachada -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 14px; border-radius: 8px; overflow: hidden; height: 170px;">
            <img src="${img1}" alt="${rest.nombre}" style="width: 100%; height: 100%; object-fit: cover;">
            <img src="${img2}" alt="${rest.nombre}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>

          <div class="card-meta">
            <span class="badge badge-green">Aprobado</span>
            <div class="rating-pill">
              <span style="color: var(--accent-gold); font-size: 1.1rem;">★</span>
              <span>${rankingFormatted}</span>
              <small style="color: var(--text-muted);">(${rest.totalResenas || 0} reseñas)</small>
            </div>
          </div>

          <h2 style="font-size: 1.3rem; margin-bottom: 6px; color: var(--text-primary);">${rest.nombre}</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${rest.descripcion}
          </p>
          <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 4px;">📍 ${rest.ubicacion}</p>
          <p style="color: var(--text-muted); font-size: 0.78rem; margin-bottom: 20px;">🕒 ${rest.horario || 'Abierto'}</p>
        </div>

        <a href="restaurant-detail.html?id=${rest._id}" class="btn btn-primary" style="width: 100%;">
          Ver Menú Completo y Reseñas
        </a>
      `;
      grid.appendChild(card);
    });
  }

  categoryFilter.addEventListener('change', (e) => fetchRestaurants(e.target.value));
  sortFilter.addEventListener('change', applySortingAndRender);

  loadCategories();
  fetchRestaurants();
});