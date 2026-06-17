let map;

document.addEventListener("DOMContentLoaded", function() {
    map = L.map('map').setView([15, 10], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    // Alerta de diagnóstico para revisar las entrañas del GeoJSON
    fetch('data/paises_geo.json')
        .then(res => res.json())
        .then(geojsonData => {
            console.log("=== DIAGNÓSTICO DE TU MAPA ===");
            if (geojsonData.features && geojsonData.features.length > 0) {
                const primerPais = geojsonData.features[0];
                console.log("Estructura completa del primer país del mapa:", primerPais);
                console.log("Llaves disponibles dentro de 'properties':", Object.keys(primerPais.properties));
            } else {
                console.log("El archivo está vacío o no tiene el formato correcto.");
            }
        })
        .catch(err => console.error("Error al leer el archivo:", err));
});
