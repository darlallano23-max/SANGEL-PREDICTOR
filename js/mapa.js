// Inicializar el mapa centrado en coordenadas generales
const map = L.map('map').setView([20, 0], 2);

// Cargar capa de mapa base de código abierto (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

console.log("Módulo del mapa cargado correctamente.");
