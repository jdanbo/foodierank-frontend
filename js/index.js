document.addEventListener('DOMContentLoaded', async () => {
  const topContainer = document.getElementById('top-restaurants-container');
  const reviewsContainer = document.getElementById('recent-reviews-container');
  const statRest = document.getElementById('stat-count-restaurants');
  const statReviews = document.getElementById('stat-count-reviews');

  // Botón "Registrar mi Restaurante": interceptamos el clic para decidir el
  // destino en el momento exacto (más confiable que reescribir el href al cargar).
  // Sin sesión -> login.html. Con sesión -> crear.html (registrar restaurante/plato).
  const ctaRestaurante = document.getElementById('cta-registrar-restaurante');
  if (ctaRestaurante) {
    ctaRestaurante.addEventListener('click', (e) => {
      e.preventDefault();
      if (Auth.getToken()) {
        window.location.href = 'crear.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  }

  try {
    // 1. Obtener restaurantes aprobados
    const resRest = await apiRequest('/restaurants');
    if (resRest.ok && resRest.data) {
      const restaurants = resRest.data;

      // Actualizar contador
      if (statRest) statRest.textContent = restaurants.length;

      // Ordenar por ranking descendente y tomar los mejores 3
      const topThree = [...restaurants]
        .sort((a, b) => (b.ranking || 0) - (a.ranking || 0))
        .slice(0, 3);

      renderTopRestaurants(topThree);

      // 2. Traer reseñas representativas de los restaurantes líderes
      loadLandingReviews(topThree);
    }
  } catch (err) {
    console.error('Error cargando datos para la landing:', err.message);
  }

  function renderTopRestaurants(list) {
    if (!topContainer) return;
    topContainer.innerHTML = '';

    list.forEach(r => {
      const card = document.createElement('article');
      card.className = 'card';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';

      const img1 = r.imagenUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600';
      const img2 = r.imagenFachada2 || img1;

      card.innerHTML = `
        <div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px; border-radius: 8px; overflow: hidden; height: 160px;">
            <img src="${img1}" alt="${r.nombre}" style="width: 100%; height: 100%; object-fit: cover;">
            <img src="${img2}" alt="${r.nombre}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="badge badge-gold">★ ${Number(r.ranking || 0).toFixed(1)} Ranking</span>
            <small style="color: var(--text-muted); font-size: 0.8rem;">${r.totalResenas || 0} reseñas</small>
          </div>
          <h3 style="font-size: 1.25rem; margin-bottom: 6px; color: var(--text-primary);">${r.nombre}</h3>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${r.descripcion}
          </p>
        </div>
        <a href="restaurant-detail.html?id=${r._id}" class="btn btn-secondary" style="width: 100%; border-color: rgba(193,39,45,0.4); text-align: center;">
          Explorar Menú y Reseñas
        </a>
      `;
      topContainer.appendChild(card);
    });
  }

  async function loadLandingReviews(restaurants) {
    if (!reviewsContainer) return;
    reviewsContainer.innerHTML = '';
    let totalCollected = 0;
    const sampleReviews = [];

    // Recolectar las mejores opiniones de los primeros restaurantes
    for (const rest of restaurants) {
      try {
        const res = await apiRequest(`/reviews/restaurant/${rest._id}`);
        if (res.ok && res.data && res.data.length > 0) {
          totalCollected += res.data.length;
          // Tomar hasta 2 reseñas por restaurante
          res.data.slice(0, 2).forEach(rev => {
            sampleReviews.push({ ...rev, restNombre: rest.nombre });
          });
        }
      } catch (e) {
        // Ignorar fallos individuales de fetch
      }
    }

    if (statReviews && totalCollected > 0) {
      statReviews.textContent = `${totalCollected}+`;
    }

    sampleReviews.slice(0, 4).forEach(rev => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '18px';

      const stars = '★'.repeat(rev.calificacion) + '☆'.repeat(5 - rev.calificacion);

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <strong style="color: var(--text-primary); font-size: 0.95rem;">${rev.autor?.nombre || 'Foodie'}</strong>
          <span style="color: var(--accent-gold); font-size: 0.9rem;">${stars}</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.88rem; font-style: italic; margin-bottom: 14px; line-height: 1.5;">
          "${rev.comentario}"
        </p>
        <div style="font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 8px;">
          En: <strong style="color: var(--text-primary);">${rev.restNombre}</strong>
        </div>
      `;
      reviewsContainer.appendChild(card);
    });
  }
});