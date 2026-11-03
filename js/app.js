
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(registro => {
            console.log('¡Éxito! Service Worker registrado correctamente.', registro);
        })
        .catch(error => {
            console.warn('Error al registrar el Service Worker:', error);
        });
} else {
    console.error('Este navegador no soporta Service Workers.');
}

console.log('App Shell de DevConnect inicializado correctamente.');

const devItems = [
  {
    title: "Progressive Web Apps",
    description: "Construye experiencias web rápidas y confiables utilizando Service Workers y caché local.",
    badge: "PWA"
  },
  {
    title: "App Shell Architecture",
    description: "Separa la interfaz estática básica del contenido dinámico para acelerar drásticamente los tiempos de carga.",
    badge: "Arquitectura"
  },
  {
    title: "Client-Side Rendering",
    description: "Alimenta dinámicamente tu interfaz consumiendo datos y generando componentes interactivos en el navegador.",
    badge: "JavaScript"
  }
];

function renderDynamicCards() {
  const container = document.getElementById('dynamic-cards-container');
  if (!container) return;

  container.innerHTML = '';

  devItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card'; 
    
    card.innerHTML = `
      <span class="card-badge">${item.badge}</span>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    `;
    
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderDynamicCards();
});

const btnSync = document.getElementById('btn-sync');
if (btnSync) {
    btnSync.addEventListener('click', () => {
        alert('Pronto aquí implementaremos la sincronización con Background Sync.');
    });
}