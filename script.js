// script.js actualizado completo para Seenly con login/registro y sincronización por usuario

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkujb9MVSBd12bH9McPyMqiZV9OyyeVzk",
  authDomain: "seenly-70397.firebaseapp.com",
  projectId: "seenly-70397",
  storageBucket: "seenly-70397.appspot.com",
  messagingSenderId: "38767262174",
  appId: "1:38767262174:web:73ba88675669bb418f054f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userId = null;
let items = [];
let filtroActivo = 'todos';

const itemsRef = () => doc(db, "seenly", userId);

async function cargarItemsRemotos() {
  if (!userId) return;
  try {
    const docSnap = await getDoc(itemsRef());
    items = docSnap.exists() ? docSnap.data().items || [] : [];
  } catch (err) {
    console.error("Error cargando desde Firestore", err);
  }
}

async function guardarItemsRemotos() {
  if (!userId) return;
  try {
    await setDoc(itemsRef(), { items });
    console.log("📡 Datos sincronizados con Firestore");
  } catch (err) {
    console.error("Error guardando en Firestore", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-form');
  const titleInput = document.getElementById('title');
  const typeSelect = document.getElementById('type');
  const vistoCheckbox = document.getElementById('checkbox-visto');
  const contentList = document.getElementById('content-list');
  const statsContainer = document.getElementById('stats');
  const exportBtn = document.getElementById('btn-exportar');
  const importInput = document.getElementById('input-importar');
  const toast = document.getElementById('toast');
  const filtersContainer = document.getElementById('filters');
  const mainApp = document.getElementById('main-app');

  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const authContainer = document.getElementById('auth-container');
  const btnTabLogin = document.getElementById('btn-tab-login');
  const btnTabRegister = document.getElementById('btn-tab-register');
  const userInfo = document.getElementById('user-info');

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
    setTimeout(() => toast.style.display = 'none', 3000);
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
      if (item.visto) card.classList.add('visto');

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const type = typeSelect.value;
    const visto = vistoCheckbox.checked;
    if (!title) return;

    items.push({ title, type, visto });
    await guardarItemsRemotos();
    renderItems();
    form.reset();
    vistoCheckbox.checked = false;
    mostrarAviso('✅ Contenido añadido.');
  });

  contentList.addEventListener('click', async (e) => {
    const index = e.target.getAttribute('data-index');
    const action = e.target.getAttribute('data-action');
    if (index === null || action === null) return;

    const realIndex = Number(index);
    if (action === 'borrar') {
      items.splice(realIndex, 1);
      mostrarAviso('🗑️ Contenido eliminado.');
    } else if (action === 'visto') {
      items[realIndex].visto = !items[realIndex].visto;
      mostrarAviso(items[realIndex].visto ? '👁️ Marcado como visto.' : '🚫 Marcado como no visto.');
    }

    await guardarItemsRemotos();
    renderItems();
  });

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

  importInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedItems = JSON.parse(e.target.result);
        if (Array.isArray(importedItems)) {
          items = importedItems;
          await guardarItemsRemotos();
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

  filtersContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      filtroActivo = e.target.getAttribute('data-filter');
      renderItems();
    }
  });

  btnTabLogin.addEventListener('click', () => {
  btnTabLogin.classList.add('active');
  btnTabRegister.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});

btnTabRegister.addEventListener('click', () => {
  btnTabRegister.classList.add('active');
  btnTabLogin.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});


  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      mostrarAviso('❌ Error al iniciar sesión', 'error');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch {
      mostrarAviso('❌ Error al crear la cuenta', 'error');
    }
  });

  onAuthStateChanged(auth, async user => {
    if (user) {
      userId = user.uid;
      authContainer.style.display = 'none';
      mainApp.style.display = 'block';
      if (userInfo) userInfo.textContent = `Sesión iniciada como: ${user.email}`;
      await cargarItemsRemotos();
      renderItems();
    } else {
      userId = null;
      items = [];
      mainApp.style.display = 'none';
      authContainer.style.display = 'block';
      if (userInfo) userInfo.textContent = '';
    }
  });

  setInterval(() => {
    if (userId) guardarItemsRemotos();
  }, 15000);
});

// Instalación PWA
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
    console.log(outcome === 'accepted' ? '✅ Instalación aceptada' : '❌ Instalación cancelada');
    deferredPrompt = null;
    installBtn.style.display = 'none';
  }
});



