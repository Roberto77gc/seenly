document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-form');
  const titleInput = document.getElementById('title');
  const typeSelect = document.getElementById('type');
  const contentList = document.getElementById('content-list');
  const statsContainer = document.getElementById('stats');
  const exportBtn = document.getElementById('btn-exportar');
  const importInput = document.getElementById('input-importar'); // NUEVO

  let items = JSON.parse(localStorage.getItem('seenly-items')) || [];

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

  function renderItems() {
    contentList.innerHTML = '';
    if (items.length === 0) {
      contentList.innerHTML = '<p>No hay contenido añadido todavía.</p>';
      statsContainer.innerHTML = '';
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'card';
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
    if (title === '') return;

    items.push({ title, type, visto: false });
    saveItems();
    renderItems();
    form.reset();
  });

  contentList.addEventListener('click', (e) => {
    const index = e.target.getAttribute('data-index');
    const action = e.target.getAttribute('data-action');

    if (action === 'borrar') {
      items.splice(index, 1);
    } else if (action === 'visto') {
      items[index].visto = !items[index].visto;
    } else {
      return;
    }

    saveItems();
    renderItems();
  });

  // Exportar JSON
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seenly-export.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ✅ Importar JSON
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
            alert('✅ Contenido importado correctamente.');
          } else {
            throw new Error();
          }
        } catch {
          alert('❌ El archivo no es válido.');
        }
      };
      reader.readAsText(file);
    });
  }

  // Guardado automático cada 15 segundos
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

