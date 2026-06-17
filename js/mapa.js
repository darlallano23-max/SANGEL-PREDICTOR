let map;
let geojsonLayer;
let datosPaisesLocales = [];

document.addEventListener("DOMContentLoaded", function() {
    // 1. Inicializar el mapa centrado de inmediato
    map = L.map('map').setView([15, 10], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTODB',
        maxZoom: 19
    }).addTo(map);

    // 2. Descargar la data macro con ruta relativa forzada para GitHub
    fetch('./data/datos_macro_riesgo.json')
        .then(res => {
            if (!res.ok) throw new Error("No se pudo obtener el archivo de datos macro.");
            return res.json();
        })
        .then(data => {
            datosPaisesLocales = data;
            console.log("Data de riesgos cargada en el mapa:", datosPaisesLocales);
            comenzarPintadoMapamundi();
        })
        .catch(err => console.error("Error crítico leyendo datos_macro_riesgo.json:", err));
});

function obtenerColorRiesgo(score) {
    if (score === undefined || score === null) return 'transparent';
    if (score >= 0.70) return '#dc3545'; // Rojo Crítico (Ej. Argentina)
    if (score >= 0.40) return '#ffc107'; // Amarillo Medio (Ej. Ecuador)
    return '#198754';                    // Verde Bajo (Ej. Singapur)
}

function comenzarPintadoMapamundi() {
    // Forzar la ruta exacta en minúsculas tal y como aparece en tu VS Code
    fetch('./data/paises_geo.json')
        .then(response => {
            if (!response.ok) throw new Error("No se pudo obtener el GeoJSON geográfico.");
            return response.json();
        })
        .then(geojsonData => {
            
            geojsonLayer = L.geoJson(geojsonData, {
                style: function(feature) {
                    // Extraer el identificador del país de forma flexible
                    const codigoGeo = (feature.id || feature.properties.id || feature.properties.iso_a2 || "").toUpperCase();
                    const datosMatch = datosPaisesLocales.find(p => p.pais_id.toUpperCase() === codigoGeo);
                    
                    return {
                        fillColor: datosMatch ? obtenerColorRiesgo(datosMatch.score_riesgo_logistico) : '#e9ecef',
                        weight: datosMatch ? 1.8 : 0.5,
                        opacity: 1,
                        color: datosMatch ? '#212529' : '#ced4da',
                        fillOpacity: datosMatch ? 0.75 : 0.15
                    };
                },
                onEachFeature: function(feature, layer) {
                    const codigoGeo = (feature.id || feature.properties.id || feature.properties.iso_a2 || "").toUpperCase();
                    const datosMatch = datosPaisesLocales.find(p => p.pais_id.toUpperCase() === codigoGeo);

                    if (datosMatch) {
                        const contenidoPopup = `
                            <div style="font-family: Arial, sans-serif; padding: 5px; min-width: 180px;">
                                <h6 style="margin: 0 0 8px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 4px; color: #212529;">
                                    <strong>${datosMatch.nombre} (${datosMatch.pais_id})</strong>
                                </h6>
                                <table style="width: 100%; font-size: 12px; color: #495057;">
                                    <tr><td>📈 <b>Inflación:</b></td><td style="text-align: right;">${datosMatch.tasa_inflacion}%</td></tr>
                                    <tr><td>💱 <b>Volatilidad:</b></td><td style="text-align: right;">${datosMatch.volatilidad_divisa}/10</td></tr>
                                    <tr><td>⚠️ <b>Riesgo País:</b></td><td style="text-align: right;">${datosMatch.riesgo_pais} pts</td></tr>
                                    <tr><td>⚓ <b>Congestión Puerto:</b></td><td style="text-align: right;">${datosMatch.indice_congestion_portuaria}/5</td></tr>
                                    <tr style="border-top: 1px solid #eee;"><td style="padding-top:4px;"><b>Score Riesgo:</b></td>
                                    <td style="text-align: right; padding-top:4px;"><span class="badge bg-${datosMatch.score_riesgo_logistico >= 0.7 ? 'danger' : datosMatch.score_riesgo_logistico >= 0.4 ? 'warning' : 'success'}">${datosMatch.score_riesgo_logistico}</span></td></tr>
                                </table>
                            </div>
                        `;
                        layer.bindPopup(contenidoPopup);

                        layer.on({
                            mouseover: function(e) {
                                e.target.setStyle({ fillOpacity: 0.95, weight: 2, color: '#0d6efd' });
                            },
                            mouseout: function(e) {
                                geojsonLayer.resetStyle(e.target);
                            }
                        });
                    }
                }
            }).addTo(map);
            
            console.log("¡Geovisor renderizado y coloreado de manera exitosa!");
        })
        .catch(error => console.error("Error cargando paises_geo.json:", error));
}
