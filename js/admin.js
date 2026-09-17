document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.getUser();
  const token = Auth.getToken();

  // 1. Guardián de seguridad: validar que existan credenciales y sea rol admin
  if (!token || !user || user.rol !== 'admin') {
    alert('Acceso restringido: Esta sección requiere permisos de administrador.');
    window.location.href = 'restaurants.html';
    return;
  }

  const alertBox = document.getElementById('admin-alert');
  let cacheCategories = [];
  let cacheRestaurants = [];
  let cacheReviews = [];

  function showAlert(msg, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
      if (alertBox) alertBox.style.display = 'none';
    }, 4500);
  }

  // 2. Control de Pestañas (Tabs)
  window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

    if (event && event.target) {
      event.target.classList.add('active');
    }
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
      targetContent.classList.add('active');
    }

    if (tabId === 'tab-moderacion') loadPending();
    if (tabId === 'tab-restaurantes') loadRestaurants();
    if (tabId === 'tab-categorias') loadCategories();
    if (tabId === 'tab-resenas') loadReviews();
  };

  // 3. Modales
  window.closeModal = (id) => {
    const m = document.getElementById(id);
    if (m) m.classList.remove('show');
  };

  window.openCategoryModal = (cat = null) => {
    document.getElementById('edit-cat-id').value = cat ? cat._id : '';
    document.getElementById('cat-name-input').value = cat ? cat.nombre : '';
    document.getElementById('cat-desc-input').value = cat ? (cat.descripcion || '') : '';
    document.getElementById('modal-cat-title').textContent = cat ? 'Editar Categoría' : 'Nueva Categoría';
    document.getElementById('modal-category').classList.add('show');
  };

  window.openRestaurantModal = (r = null) => {
    document.getElementById('edit-rest-id').value = r ? r._id : '';
    document.getElementById('rest-name').value = r ? r.nombre : '';
    document.getElementById('rest-address').value = r ? r.ubicacion : '';
    document.getElementById('rest-schedule').value = r ? (r.horario || '') : '';
    document.getElementById('rest-img').value = r ? (r.imagenUrl || '') : '';
    document.getElementById('rest-desc').value = r ? r.descripcion : '';

    const catSelect = document.getElementById('rest-category-select');
    if (catSelect) {
      catSelect.value = r ? r.categoriaId : (cacheCategories[0]?._id || '');
    }

    document.getElementById('modal-rest-title').textContent = r ? 'Editar Restaurante' : 'Nuevo Restaurante';
    document.getElementById('modal-restaurant').classList.add('show');
  };

  // 4. PESTAÑA: MODERACIÓN DE PENDIENTES
  async function loadPending() {
    const tbodyRest = document.getElementById('tbody-pending-restaurants');
    const tbodyDish = document.getElementById('tbody-pending-dishes');
    if (tbodyRest) tbodyRest.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';
    if (tbodyDish) tbodyDish.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';

    try {
      const resR = await apiRequest('/restaurants/admin/all', 'GET', null, true);
      const pendingRest = (resR.data || []).filter(r => r.estado === 'pendiente');

      if (tbodyRest) {
        tbodyRest.innerHTML = pendingRest.length
          ? ''
          : '<tr><td colspan="4" style="color: var(--text-muted);">No hay restaurantes pendientes de aprobación.</td></tr>';

        pendingRest.forEach(r => {
          tbodyRest.innerHTML += `
            <tr>
              <td><strong>${r.nombre}</strong></td>
              <td>${r.ubicacion}</td>
              <td>${new Date(r.fechaCreacion).toLocaleDateString()}</td>
              <td>
                <div class="action-group">
                  <button class="btn btn-primary btn-sm" onclick="approveRest('${r._id}')">Aprobar</button>
                  <button class="btn btn-danger btn-sm" onclick="rejectRest('${r._id}')">Denegar</button>
                </div>
              </td>
            </tr>
          `;
        });
      }

      const resD = await apiRequest('/restaurants/admin/dishes/pending', 'GET', null, true);
      const pendingDishes = resD.data || [];

      if (tbodyDish) {
        tbodyDish.innerHTML = pendingDishes.length
          ? ''
          : '<tr><td colspan="3" style="color: var(--text-muted);">No hay platillos pendientes de aprobación.</td></tr>';

        pendingDishes.forEach(d => {
          tbodyDish.innerHTML += `
            <tr>
              <td><strong>${d.nombre}</strong></td>
              <td>Q ${Number(d.precio).toFixed(2)}</td>
              <td>
                <div class="action-group">
                  <button class="btn btn-primary btn-sm" onclick="approveDish('${d._id}')">Aprobar</button>
                  <button class="btn btn-danger btn-sm" onclick="rejectDish('${d._id}')">Denegar</button>
                </div>
              </td>
            </tr>
          `;
        });
      }
    } catch (err) {
      showAlert(err.message || 'Error al consultar pendientes');
    }
  }

  window.approveRest = async (id) => {
    try {
      await apiRequest(`/restaurants/${id}/approve`, 'PATCH', null, true);
      showAlert('Restaurante aprobado con éxito', 'success');
      loadPending();
    } catch (err) {
      showAlert(err.message || 'Error al aprobar restaurante');
    }
  };

  window.rejectRest = async (id) => {
    if (!confirm('¿Seguro que deseas denegar este restaurante?')) return;
    try {
      await apiRequest(`/restaurants/${id}/reject`, 'PATCH', null, true);
      showAlert('Restaurante denegado', 'success');
      loadPending();
    } catch (err) {
      showAlert(err.message || 'Error al denegar restaurante');
    }
  };

  window.approveDish = async (dishId) => {
    try {
      await apiRequest(`/restaurants/dishes/${dishId}/approve`, 'PATCH', null, true);
      showAlert('Platillo aprobado con éxito', 'success');
      loadPending();
    } catch (err) {
      showAlert(err.message || 'Error al aprobar platillo');
    }
  };

  window.rejectDish = async (dishId) => {
    if (!confirm('¿Seguro que deseas denegar este platillo?')) return;
    try {
      await apiRequest(`/restaurants/dishes/${dishId}/reject`, 'PATCH', null, true);
      showAlert('Platillo denegado', 'success');
      loadPending();
    } catch (err) {
      showAlert(err.message || 'Error al denegar platillo');
    }
  };

  // 5. PESTAÑA: CRUD RESTAURANTES
  async function loadRestaurants() {
    try {
      const res = await apiRequest('/restaurants/admin/all', 'GET', null, true);
      cacheRestaurants = res.data || [];
      renderRestaurantsTable(cacheRestaurants);
    } catch (err) {
      showAlert(err.message || 'Error al obtener restaurantes');
    }
  }

  function renderRestaurantsTable(list) {
    const tbody = document.getElementById('tbody-all-restaurants');
    if (!tbody) return;

    tbody.innerHTML = list.length
      ? ''
      : '<tr><td colspan="5">No se encontraron restaurantes.</td></tr>';

    list.forEach(r => {
      const catObj = cacheCategories.find(c => c._id === r.categoriaId);
      tbody.innerHTML += `
        <tr>
          <td><strong>${r.nombre}</strong></td>
          <td>${catObj ? catObj.nombre : 'General'}</td>
          <td>★ ${Number(r.ranking || 0).toFixed(1)}</td>
          <td><span class="badge ${r.estado === 'aprobado' ? 'badge-green' : 'badge-gold'}">${r.estado}</span></td>
          <td>
            <div class="action-group">
              <button class="btn btn-secondary btn-sm" onclick='openRestaurantModal(${JSON.stringify(r).replace(/'/g, "&apos;")})'>Editar</button>
              <button class="btn btn-danger btn-sm" onclick="deleteRest('${r._id}')">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  const formRestaurant = document.getElementById('form-restaurant');
  if (formRestaurant) {
    formRestaurant.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-rest-id').value;
      const payload = {
        nombre: document.getElementById('rest-name').value.trim(),
        categoriaId: document.getElementById('rest-category-select').value,
        ubicacion: document.getElementById('rest-address').value.trim(),
        horario: document.getElementById('rest-schedule').value.trim(),
        imagenUrl: document.getElementById('rest-img').value.trim(),
        descripcion: document.getElementById('rest-desc').value.trim()
      };

      try {
        if (id) {
          await apiRequest(`/restaurants/${id}`, 'PUT', payload, true);
          showAlert('Restaurante actualizado', 'success');
        } else {
          await apiRequest('/restaurants', 'POST', payload, true);
          showAlert('Restaurante registrado', 'success');
        }
        closeModal('modal-restaurant');
        loadRestaurants();
      } catch (err) {
        showAlert(err.message || 'Error al procesar restaurante');
      }
    });
  }

  window.deleteRest = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este restaurante y sus datos vinculados?')) return;
    try {
      await apiRequest(`/restaurants/${id}`, 'DELETE', null, true);
      showAlert('Restaurante eliminado', 'success');
      loadRestaurants();
    } catch (err) {
      showAlert(err.message || 'Error al eliminar restaurante');
    }
  };

  const restSearch = document.getElementById('rest-search');
  if (restSearch) {
    restSearch.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = cacheRestaurants.filter(r =>
        r.nombre.toLowerCase().includes(term) || r.ubicacion.toLowerCase().includes(term)
      );
      renderRestaurantsTable(filtered);
    });
  }

  const restCatFilter = document.getElementById('rest-cat-filter');
  if (restCatFilter) {
    restCatFilter.addEventListener('change', (e) => {
      const catId = e.target.value;
      const filtered = catId
        ? cacheRestaurants.filter(r => r.categoriaId === catId)
        : cacheRestaurants;
      renderRestaurantsTable(filtered);
    });
  }

  // 6. PESTAÑA: CRUD CATEGORÍAS
  async function loadCategories() {
    const tbody = document.getElementById('tbody-categories');
    try {
      const res = await apiRequest('/categories');
      cacheCategories = res.data || [];

      // Sincronizar selectores dependientes de categoría
      const catSelect = document.getElementById('rest-category-select');
      const catFilter = document.getElementById('rest-cat-filter');

      if (catSelect) {
        catSelect.innerHTML = '';
        cacheCategories.forEach(c => {
          catSelect.innerHTML += `<option value="${c._id}">${c.nombre}</option>`;
        });
      }

      if (catFilter) {
        catFilter.innerHTML = '<option value="">Todas las categorías</option>';
        cacheCategories.forEach(c => {
          catFilter.innerHTML += `<option value="${c._id}">${c.nombre}</option>`;
        });
      }

      if (tbody) {
        tbody.innerHTML = cacheCategories.length
          ? ''
          : '<tr><td colspan="3">No hay categorías registradas.</td></tr>';

        cacheCategories.forEach(c => {
          tbody.innerHTML += `
            <tr>
              <td><strong>${c.nombre}</strong></td>
              <td style="color: var(--text-secondary);">${c.descripcion || '-'}</td>
              <td>
                <div class="action-group">
                  <button class="btn btn-secondary btn-sm" onclick='openCategoryModal(${JSON.stringify(c).replace(/'/g, "&apos;")})'>Editar</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteCat('${c._id}')">Eliminar</button>
                </div>
              </td>
            </tr>
          `;
        });
      }
    } catch (err) {
      showAlert(err.message || 'Error al cargar categorías');
    }
  }

  const formCategory = document.getElementById('form-category');
  if (formCategory) {
    formCategory.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-cat-id').value;
      const payload = {
        nombre: document.getElementById('cat-name-input').value.trim(),
        descripcion: document.getElementById('cat-desc-input').value.trim()
      };

      try {
        if (id) {
          await apiRequest(`/categories/${id}`, 'PUT', payload, true);
          showAlert('Categoría actualizada', 'success');
        } else {
          await apiRequest('/categories', 'POST', payload, true);
          showAlert('Categoría creada exitosamente', 'success');
        }
        closeModal('modal-category');
        loadCategories();
      } catch (err) {
        showAlert(err.message || 'Error al guardar categoría');
      }
    });
  }

  window.deleteCat = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    try {
      await apiRequest(`/categories/${id}`, 'DELETE', null, true);
      showAlert('Categoría eliminada', 'success');
      loadCategories();
    } catch (err) {
      showAlert(err.message || 'Error al eliminar categoría');
    }
  };

  // 7. PESTAÑA: MODERACIÓN Y CRUD DE RESEÑAS
  async function loadReviews() {
    try {
      const res = await apiRequest('/reviews/admin/all', 'GET', null, true);
      cacheReviews = res.data || [];
      renderReviewsTable(cacheReviews);
    } catch (err) {
      showAlert(err.message || 'Error al obtener reseñas');
    }
  }

  function renderReviewsTable(list) {
    const tbody = document.getElementById('tbody-all-reviews');
    if (!tbody) return;

    tbody.innerHTML = list.length
      ? ''
      : '<tr><td colspan="5">No se encontraron reseñas.</td></tr>';

    list.forEach(rev => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${rev.restaurante?.nombre || 'Restaurante'}</strong></td>
          <td>${rev.autor?.nombre || 'Anónimo'}</td>
          <td style="color: var(--accent-gold);">★ ${rev.calificacion}</td>
          <td style="max-width: 320px; font-size: 0.85rem;">${rev.comentario}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="deleteRev('${rev._id}')">Eliminar</button>
          </td>
        </tr>
      `;
    });
  }

  window.deleteRev = async (id) => {
    if (!confirm('¿Eliminar esta reseña? El sistema recalculará el ranking del restaurante.')) return;
    try {
      await apiRequest(`/reviews/${id}`, 'DELETE', null, true);
      showAlert('Reseña eliminada y ranking recalculado', 'success');
      loadReviews();
    } catch (err) {
      showAlert(err.message || 'Error al eliminar la reseña');
    }
  };

  const reviewSearch = document.getElementById('review-search');
  const reviewStarsFilter = document.getElementById('review-stars-filter');

  const filterReviews = () => {
    const term = reviewSearch ? reviewSearch.value.toLowerCase() : '';
    const stars = reviewStarsFilter ? reviewStarsFilter.value : '';

    const filtered = cacheReviews.filter(r => {
      const matchText = (r.restaurante?.nombre || '').toLowerCase().includes(term) ||
                        (r.autor?.nombre || '').toLowerCase().includes(term) ||
                        (r.comentario || '').toLowerCase().includes(term);
      const matchStars = stars ? r.calificacion === parseInt(stars, 10) : true;
      return matchText && matchStars;
    });

    renderReviewsTable(filtered);
  };

  if (reviewSearch) reviewSearch.addEventListener('input', filterReviews);
  if (reviewStarsFilter) reviewStarsFilter.addEventListener('change', filterReviews);

  // Inicialización de datos
  loadCategories();
  loadPending();
});