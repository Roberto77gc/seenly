document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-form');
  const titleInput = document.getElementById('title');
  const typeSelect = document.getElementById('type');
  const contentList = document.getElementById('content-list');
  const statsContainer = document.getElementById('stats'); // Nuevo para estadísticas

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
      statsContainer.innerHTML = ''; // Limpia estadísticas si no hay nada
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'card';

      const deleteBtn = document.createElement('button');
      deleteBtn.setAttribute('data-index', index);
      deleteBtn.innerHTML = '🗑️<span class="visually-hidden">Eliminar</span>';

      const titleSpan = document.createElement('span');
      titleSpan.innerHTML = `${item.title} <em>(${item.type})</em>`;

      card.appendChild(titleSpan);
      card.appendChild(deleteBtn);
      contentList.appendChild(card);
    });

    updateStats(); // Llama a las estadísticas al renderizar
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const type = typeSelect.value;
    if (title === '') return;

    items.push({ title, type });
    saveItems();
    renderItems();
    form.reset();
  });

  contentList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const index = e.target.getAttribute('data-index');
      items.splice(index, 1);
      saveItems();
      renderItems();
    }
  });

  renderItems();
});

// Gestión del botón de instalación PWA
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

