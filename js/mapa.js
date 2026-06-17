// Declarar la variable del mapa globalmente para que app.js pueda redimensionarla
let map;
let geojsonLayer;

document.addEventListener("DOMContentLoaded", function() {
    // 1. Inicializar el mapa centrado en coordenadas neutrales y con un zoom global
    map = L.map('map').setView([15, 10], 2);

    // 2. Cargar una capa base de mapa elegante y minimalista (CartoDB Positron)
    // Usamos esta en lugar de OpenStreetMap estándar para que los colores de riesgo resalten más
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTODB',
        maxZoom: 19
    }).addTo(map);

    // 3. Esperar un momento a que la data macro se cargue e iniciar el cruce de mapas
    setTimeout(() => {
        cargarCapasGeograficas();
    }, 1000);
});

// Función para determinar el color de un país según su Score de Riesgo Logístico
function obtenerColorRiesgo(score) {
    if (score === undefined) return 'transparent'; // Países que no están en nuestro dataset
    if (score >= 0.70) return '#dc3545'; // Rojo - Riesgo Crítico (Ej. Argentina)
    if (score >= 0.40) return '#ffc107'; // Amarillo - Riesgo Medio (Ej. Ecuador, China)
    return '#198754';                    // Verde - Riesgo Bajo (Ej. Singapur, EE.UU.)
}

// Función principal para cargar el GeoJSON y cruzarlo con nuestra data sintética
function cargarCapasGeograficas() {
    // Comprobar si la data de app.js ya está disponible
    if (typeof datosPaises === 'undefined' || datosPaises.length === 0) {
        console.warn("La data macro no ha cargado aún. Reintentando...");
        return;
    }

    // Leer el archivo de fronteras del mundo
    fetch('data/paises_geo.json')
        .then(response => response.json())
        .then(geojsonData => {
            
            // Añadir la capa GeoJSON al mapa con estilos dinámicos
            geojsonLayer = L.geoJson(geojsonData, {
                style: function(feature) {
                    // Buscar si el código del país en las fronteras (id de 2 letras) coincide con nuestro JSON
                    const codigoPaisGeo = feature.id; // Ej: "EC", "CN"
                    const datosMatch = datosPaises.find(p => p.pais_id === codigoPaisGeo);
                    
                    return {
                        fillColor: datosMatch ? obtenerColorRiesgo(datosMatch.score_riesgo_logistico) : '#e9ecef',
                        weight: datosMatch ? 1.5 : 0.5,
                        opacity: 1,
                        color: datosMatch ? '#495057' : '#ced4da',
                        fillOpacity: datosMatch ? 0.7 : 0.2
                    };
                },
                onEachFeature: function(feature, layer) {
                    const codigoPaisGeo = feature.id;
                    const datosMatch = datosPaises.find(p => p.pais_id === codigoPaisGeo);

                    // Si el país está en nuestro set de 17 países, le creamos un Pop-up interactivo
                    if (datosMatch) {
                        const contenidoPopup = `
                            <div class="popup-custom">
                                <h5 class="m-0 border-bottom pb-2 text-dark"><strong>${datosMatch.nombre} (${datosMatch.pais_id})</strong></h5>
                                <ul class="list-unstyled my-2" style="font-size: 12px; min-width: 180px;">
                                    <li><i class="bi bi-graph-up text-danger"></i> <b>Inflación:</b> ${datosMatch.tasa_inflacion}%</li>
                                    <li><i class="bi bi-currency-exchange text-primary"></i> <b>Volatilidad Divisa:</b> ${datosMatch.volatilidad_divisa}/10</li>
                                    <li><i class="bi bi-shield-alert text-warning"></i> <b>Riesgo País:</b> ${datosMatch.riesgo_pais} pts</li>
                                    <li><i class="bi bi-cone-striped text-secondary"></i> <b>Congestión Puerto:</b> Escala ${datosMatch.indice_congestion_portuaria}/5</li>
                                    <li><i class="bi bi-exclamation-octagon-fill text-dark"></i> <b>Huelgas:</b> ${datosMatch.indice_huelgas_protestas}</li>
                                    <hr class="my-1">
                                    <li class="fs-6"><b>Score de Riesgo:</b> <span class="badge bg-${datosMatch.score_riesgo_logistico >= 0.7 ? 'danger' : datosMatch.score_riesgo_logistico >= 0.4 ? 'warning' : 'success'}">${datosMatch.score_riesgo_logistico}</span></li>
                                    <li><i class="bi bi-cash-stack text-success"></i> <b>Desviación Costo:</b> +${datosMatch.desviacion_costo_estimado}%</li>
                                </ul>
                            </div>
                        `;
                        layer.bindPopup(contenidoPopup);

                        // Efectos visuales interactivos al pasar el ratón (Hover)
                        layer.on({
                            mouseover: function(e) {
                                const layerActiva = e.target;
                                layerActiva.setStyle({
                                    fillOpacity: 0.9,
                                    weight: 2.5,
                                    color: '#000'
                                });
                                layerActiva.bringToFront();
                            },
                            mouseout: function(e) {
                                geojsonLayer.resetStyle(e.target);
                            }
                        });
                    }
                }
            }).addTo(map);

            console.log("Capa de mapas de calor inyectada correctamente.");
        })
        .catch(error => console.error("Error cargando el mapa de fronteras GeoJSON:", error));
}
