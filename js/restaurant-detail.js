// Variable accesible en todo el contexto
window.currentRestaurantId = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Obtener ID de la URL o respaldo de sesión
  const urlParams = new URLSearchParams(window.location.search);
  let idFromUrl = urlParams.get('id');

  if (idFromUrl && idFromUrl !== 'undefined' && idFromUrl !== 'null') {
    window.currentRestaurantId = idFromUrl;
    sessionStorage.setItem('lastRestaurantId', idFromUrl);
  } else {
    window.currentRestaurantId = sessionStorage.getItem('lastRestaurantId');
  }

  const alertBox = document.getElementById('detail-alert');
  const infoContainer = document.getElementById('restaurant-info');
  const dishesContainer = document.getElementById('dishes-container');
  const reviewsContainer = document.getElementById('reviews-list');
  const reviewFormSection = document.getElementById('review-form-section');
  const loginPrompt = document.getElementById('login-prompt');
  const reviewForm = document.getElementById('add-review-form');
  const hiddenIdInput = document.getElementById('hidden-restaurant-id');

  // Inyectar en el campo oculto
  if (hiddenIdInput && window.currentRestaurantId) {
    hiddenIdInput.value = window.currentRestaurantId;
  }

  // Si tras la búsqueda no hay ID válido, regresar al catálogo
  if (!window.currentRestaurantId) {
    alert('No se seleccionó ningún restaurante válido.');
    window.location.href = 'restaurants.html';
    return;
  }

  function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
      if (alertBox) alertBox.style.display = 'none';
    }, 4500);
  }

  // 2. Cargar datos del Restaurante
  async function loadRestaurant() {
    try {
      const res = await apiRequest(`/restaurants/${window.currentRestaurantId}`);
      if (res.ok && res.data) {
        renderRestaurant(res.data);
      }
    } catch (err) {
      showAlert(err.message || 'Error al cargar los datos del restaurante');
    }
  }

  function renderRestaurant(r) {
    const f1 = r.imagenUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
    const f2 = r.imagenFachada2 || f1;

    infoContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <img src="${f1}" alt="${r.nombre}" class="detail-img">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <img src="${f1}" alt="Fachada 1" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px;">
          <img src="${f2}" alt="Fachada 2" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px;">
        </div>
      </div>
      <div>
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
          <span class="badge badge-green">Aprobado</span>
          <span class="badge badge-gold">★ ${Number(r.ranking || 0).toFixed(1)} Ponderado</span>
          <span style="color: var(--text-muted); font-size: 0.85rem;">(${r.totalResenas || 0} reseñas)</span>
        </div>
        <h1 style="font-size: 2.3rem; margin-bottom: 15px; color: var(--text-primary);">${r.nombre}</h1>
        <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.7; margin-bottom: 20px;">${r.descripcion}</p>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 6px;">📍 <strong>Ubicación:</strong> ${r.ubicacion}</p>
        <p style="color: var(--text-muted); font-size: 0.95rem;">🕒 <strong>Horario:</strong> ${r.horario || 'Lunes a Domingo'}</p>
      </div>
    `;

    // Renderizar platos
    dishesContainer.innerHTML = '';
    if (!r.platos || r.platos.length === 0) {
      dishesContainer.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No hay platillos registrados aún en este restaurante.</p>';
    } else {
      r.platos.forEach(dish => {
        const dishCard = document.createElement('div');
        dishCard.className = 'card';
        dishCard.style.padding = '14px';
        dishCard.innerHTML = `
          <div style="background-color: #FFFFFF; border-radius: 8px; padding: 8px; margin-bottom: 12px; display: flex; justify-content: center; align-items: center; height: 160px;">
            <img src="${dish.imagenUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}" 
                 alt="${dish.nombre}" 
                 style="max-height: 100%; max-width: 100%; object-fit: contain;">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <h3 style="font-size: 1.05rem; color: var(--text-primary);">${dish.nombre}</h3>
            <span style="color: var(--accent-gold); font-weight: 700; font-size: 1.1rem;">Q ${Number(dish.precio).toFixed(2)}</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">${dish.descripcion}</p>
        `;
        dishesContainer.appendChild(dishCard);
      });
    }
  }

  // 3. Cargar Reseñas
  async function loadReviews() {
    try {
      const res = await apiRequest(`/reviews/restaurant/${window.currentRestaurantId}`);
      if (res.ok) {
        renderReviews(res.data || []);
      }
    } catch (err) {
      console.error('Error al cargar reseñas:', err.message);
    }
  }

  function renderReviews(reviews) {
    reviewsContainer.innerHTML = '';
    if (!reviews || reviews.length === 0) {
      reviewsContainer.innerHTML = '<p style="color: var(--text-secondary); padding: 15px 0;">Sé el primero en calificar este restaurante.</p>';
      return;
    }

    const currentUser = Auth.getUser();

    reviews.forEach(rev => {
      const div = document.createElement('div');
      div.className = 'review-item';

      const stars = '★'.repeat(rev.calificacion) + '☆'.repeat(5 - rev.calificacion);
      const isAuthor = currentUser && (currentUser.id === rev.autor?._id || currentUser._id === rev.autor?._id);

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background-color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #FFF;">
              ${rev.autor?.nombre ? rev.autor.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <strong style="color: var(--text-primary); font-size: 0.95rem;">${rev.autor?.nombre || 'Usuario'}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(rev.fechaCreacion).toLocaleDateString()}</div>
            </div>
          </div>
          <span style="color: var(--accent-gold); font-size: 1.1rem;">${stars}</span>
        </div>
        <p style="color: var(--text-primary); font-size: 0.95rem; margin-bottom: 12px; line-height: 1.5;">${rev.comentario}</p>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="vote-btn" onclick="handleVote('${rev._id}', 'like')" ${isAuthor ? 'disabled title="No puedes votar tus propias opiniones"' : ''}>
            👍 ${rev.likesCount || 0}
          </button>
          <button class="vote-btn" onclick="handleVote('${rev._id}', 'dislike')" ${isAuthor ? 'disabled title="No puedes votar tus propias opiniones"' : ''}>
            👎 ${rev.dislikesCount || 0}
          </button>
          ${isAuthor ? '<span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 8px;">(Tu reseña)</span>' : ''}
        </div>
      `;
      reviewsContainer.appendChild(div);
    });
  }

  // 4. Manejador de Votos
  window.handleVote = async (reviewId, tipo) => {
    if (!Auth.getToken()) {
      window.location.href = 'login.html';
      return;
    }
    try {
      await apiRequest(`/reviews/${reviewId}/vote`, 'POST', { tipo }, true);
      await loadReviews();
      await loadRestaurant();
    } catch (err) {
      showAlert(err.message || 'Error al procesar tu voto');
    }
  };

  // 5. Envío de Reseña Blindado
  const token = Auth.getToken();

  if (token) {
    if (reviewFormSection) reviewFormSection.style.display = 'block';
    if (loginPrompt) loginPrompt.style.display = 'none';

    if (reviewForm) {
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Validar si hay sesión activa antes de enviar
        const token = Auth.getToken();
        if (!token) {
          showAlert('Debes iniciar sesión para publicar una reseña.', 'error');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1500);
          return;
        }

        const btn = document.getElementById('btn-submit-review');
        const calificacion = document.getElementById('calificacion').value;
        const comentario = document.getElementById('comentario').value.trim();
        const targetId = window.currentRestaurantId || document.getElementById('hidden-restaurant-id')?.value;

        if (!targetId) {
          showAlert('Error: No se encontró el ID del restaurante.', 'error');
          return;
        }

        const payload = {
          restauranteId: targetId,
          calificacion: parseInt(calificacion, 10),
          comentario: comentario
        };

        try {
          btn.disabled = true;
          btn.textContent = 'Publicando...';

          // El 4to argumento 'true' asegura que se adjunte el header Authorization: Bearer <token>
          await apiRequest('/reviews', 'POST', payload, true);

          showAlert('¡Reseña registrada con éxito!', 'success');
          reviewForm.reset();

          await loadRestaurant();
          await loadReviews();
        } catch (err) {
          showAlert(err.message || 'Error al enviar la reseña', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Publicar Reseña';
        }
      });
    }
  } else {
    if (reviewFormSection) reviewFormSection.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = 'block';
  }

  // Ejecución inicial
  loadRestaurant();
  loadReviews();
});