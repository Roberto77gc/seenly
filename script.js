document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-form');
  const titleInput = document.getElementById('title');
  const typeSelect = document.getElementById('type');
  const vistoCheckbox = document.getElementById('checkbox-visto'); // ✅ NUEVO
  const contentList = document.getElementById('content-list');
  const statsContainer = document.getElementById('stats');
  const exportBtn = document.getElementById('btn-exportar');
  const importInput = document.getElementById('input-importar');
  const toast = document.getElementById('toast');
  const filtersContainer = document.getElementById('filters');

  let items = JSON.parse(localStorage.getItem('seenly-items')) || [];
  let filtroActivo = 'todos';

  function saveItems() {
    localStorage.setItem('seenly-items', JSON.stringify(items));
  }

  function updateStats() {
    const total = items.length;
    const peliculas = items.filter(i => i.type === 'película').length;
    const series = items.filter(i => i.type === 'serie').length;
    const documentales = items.filter(i => i.type === 'documental').length;

    statsContainer.innerHTML = `
      <strong>Estadísticas:</strong><br>
      Total: ${total} · Películas: ${peliculas} · Series: ${series} · Documentales: ${documentales}
    `;
  }

  function mostrarAviso(mensaje, tipo = 'success') {
    if (!toast) return;
    toast.textContent = mensaje;
    toast.style.backgroundColor = tipo === 'success' ? '#2ecc71' : '#e74c3c';
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }

  function renderItems() {
    contentList.innerHTML = '';
    const filtrados = items.filter(item => {
      if (filtroActivo === 'todos') return true;
      if (filtroActivo === 'visto') return item.visto;
      if (filtroActivo === 'pendiente') return !item.visto;
      return item.type === filtroActivo;
    });

    if (filtrados.length === 0) {
      contentList.innerHTML = '<p>No hay contenido que coincida con el filtro.</p>';
      statsContainer.innerHTML = '';
      return;
    }

    filtrados.forEach((item, index) => {
      const card = document.createElement('div');
      card.classList.add('card');
      if (item.visto) {
        card.classList.add('visto');
      }

      const titleSpan = document.createElement('span');
      titleSpan.innerHTML = `${item.title} <em>(${item.type})</em>`;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '0.5rem';

      const vistoBtn = document.createElement('button');
      vistoBtn.setAttribute('data-index', index);
      vistoBtn.setAttribute('data-action', 'visto');
      vistoBtn.textContent = '✔';
      vistoBtn.setAttribute('aria-label', 'Marcar como visto');

      const deleteBtn = document.createElement('button');
      deleteBtn.setAttribute('data-index', index);
      deleteBtn.setAttribute('data-action', 'borrar');
      deleteBtn.innerHTML = '🗑️<span class="visually-hidden">Eliminar</span>';

      actions.appendChild(vistoBtn);
      actions.appendChild(deleteBtn);

      card.appendChild(titleSpan);
      card.appendChild(actions);
      contentList.appendChild(card);
    });

    updateStats();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const type = typeSelect.value;
    const visto = vistoCheckbox.checked; // ✅ NUEVO

    if (title === '') return;

    items.push({ title, type, visto }); // ✅ NUEVO
    saveItems();
    renderItems();
    form.reset();
    vistoCheckbox.checked = false; // ✅ NUEVO
    mostrarAviso('✅ Contenido añadido.');
  });

  contentList.addEventListener('click', (e) => {
    const index = e.target.getAttribute('data-index');
    const action = e.target.getAttribute('data-action');
    if (index === null || action === null) return;

    const realIndex = items.findIndex((_, i) => i === Number(index));
    if (realIndex === -1) return;

    if (action === 'borrar') {
      items.splice(realIndex, 1);
      mostrarAviso('🗑️ Contenido eliminado.', 'success');
    } else if (action === 'visto') {
      items[realIndex].visto = !items[realIndex].visto;
      mostrarAviso(items[realIndex].visto ? '👁️ Marcado como visto.' : '🚫 Marcado como no visto.');
    }

    saveItems();
    renderItems();
  });

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seenly-export.json';
      a.click();
      URL.revokeObjectURL(url);
      mostrarAviso('📤 Exportación completada.');
    });
  }

  if (importInput) {
    importInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedItems = JSON.parse(e.target.result);
          if (Array.isArray(importedItems)) {
            items = importedItems;
            saveItems();
            renderItems();
            mostrarAviso('✅ Contenido importado correctamente.');
          } else {
            throw new Error();
          }
        } catch {
          mostrarAviso('❌ El archivo no es válido.', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Filtros
  if (filtersContainer) {
    filtersContainer.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        filtroActivo = e.target.getAttribute('data-filter');
        renderItems();
      }
    });
  }

  setInterval(() => {
    saveItems();
    console.log('💾 Guardado automático');
  }, 15000);

  renderItems();
});

// Botón de instalación PWA
let deferredPrompt;
const installBtn = document.getElementById('btn-instalar');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('✅ Usuario instaló la app');
    } else {
      console.log('❌ Usuario canceló la instalación');
    }
    deferredPrompt = null;
    installBtn.style.display = 'none';
  }
});

