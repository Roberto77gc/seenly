document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-form');
  const titleInput = document.getElementById('title');
  const typeSelect = document.getElementById('type');
  const contentList = document.getElementById('content-list');

  let items = JSON.parse(localStorage.getItem('seenly-items')) || [];

  function saveItems() {
    localStorage.setItem('seenly-items', JSON.stringify(items));
  }

  function renderItems() {
    contentList.innerHTML = '';
    if (items.length === 0) {
      contentList.innerHTML = '<p>No hay contenido añadido todavía.</p>';
      return;
    }
    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <span>${item.title} <em>(${item.type})</em></span>
        <button data-index="${index}">🗑️</button>
      `;
      contentList.appendChild(card);
    });
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
