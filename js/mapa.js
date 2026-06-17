let map;
let geojsonLayer;

document.addEventListener("DOMContentLoaded", function() {
    // 1. Inicializar el mapa base
    map = L.map('map').setView([15, 10], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTODB',
        maxZoom: 19
    }).addTo(map);

    // 2. Intentar cargar las capas de manera segura usando un bucle de verificación
    let intentos = 0;
    const verificarData = setInterval(() => {
        intentos++;
        if (typeof datosPaises !== 'undefined' && datosPaises.length > 0) {
            console.log("¡Data macro detectada con éxito! Procediendo a pintar...");
            cargarCapasGeograficas();
            clearInterval(verificarData);
        } else if (intentos > 10) {
            console.warn("La data tardó demasiado. Forzando carga manual.");
            // Si por algún motivo app.js no la guardó global, la descargamos directamente aquí
            fetch('data/datos_macro_riesgo.json')
                .then(res => res.json())
                .then(data => {
                    datosPaises = data;
                    cargarCapasGeograficas();
                });
            clearInterval(verificarData);
        }
    }, 500);
});

function obtenerColorRiesgo(score) {
    if (score === undefined || score === null) return 'transparent';
    if (score >= 0.70) return '#dc3545'; // Rojo Crítico
    if (score >= 0.40) return '#ffc107'; // Amarillo Medio
    return '#198754';                    // Verde Bajo
}

function cargarCapasGeograficas() {
    fetch('data/paises_geo.json')
        .then(response => response.json())
        .then(geojsonData => {
            
            geojsonLayer = L.geoJson(geojsonData, {
                style: function(feature) {
                    // BUSCADOR INTELIGENTE: Busca el código del país en cualquier formato posible del GeoJSON
                    const codigoGeo = (feature.id || feature.properties.id || feature.properties.iso_a2 || "").toUpperCase();
                    const datosMatch = datosPaises.find(p => p.pais_id.toUpperCase() === codigoGeo);
                    
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
                    const datosMatch = datosPaises.find(p => p.pais_id.toUpperCase() === codigoGeo);

                    if (datosMatch) {
                        const contenidoPopup = `
                            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 5px;">
                                <h6 style="margin: 0 0 8px 0; border-bottom: 2px solid #dee2e6; pb: 4px; color: #333;">
                                    <strong>${datosMatch.nombre} (${datosMatch.pais_id})</strong>
                                </h6>
                                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                                    <tr><td>📈 <b>Inflación:</b></td><td style="text-align: right;">${datosMatch.tasa_inflacion}%</td></tr>
                                    <tr><td>💱 <b>Volatilidad Divisa:</b></td><td style="text-align: right;">${datosMatch.volatilidad_divisa}/10</td></tr>
                                    <tr><td>⚠️ <b>Riesgo País:</b></td><td style="text-align: right;">${datosMatch.riesgo_pais} pts</td></tr>
                                    <tr><td>⚓ <b>Congestión Puerto:</b></td><td style="text-align: right;">${datosMatch.indice_congestion_portuaria}/5</td></tr>
                                    <tr><td>📢 <b>Huelgas:</b></td><td style="text-align: right;">${datosMatch.indice_huelgas_protestas}</td></tr>
                                    <tr style="border-top: 1px solid #dee2e6;"><td style="padding-top: 4px;"><b>Score Riesgo:</b></td>
                                    <td style="text-align: right; padding-top: 4px;"><span class="badge bg-${datosMatch.score_riesgo_logistico >= 0.7 ? 'danger' : datosMatch.score_riesgo_logistico >= 0.4 ? 'warning' : 'success'}">${datosMatch.score_riesgo_logistico}</span></td></tr>
                                    <tr><td style="color: #198754;">💵 <b>Desviación Costo:</b></td><td style="text-align: right; color: #198754; font-weight: bold;">+${datosMatch.desviacion_costo_estimado}%</td></tr>
                                </table>
                            </div>
                        `;
                        layer.bindPopup(contenidoPopup);

                        layer.on({
                            mouseover: function(e) {
                                e.target.setStyle({ fillOpacity: 0.95, weight: 2.5, color: '#0d6efd' });
                            },
                            mouseout: function(e) {
                                geojsonLayer.resetStyle(e.target);
                            }
                        });
                    }
                }
            }).addTo(map);
            console.log("¡Mapa coloreado exitosamente!");
        })
        .catch(error => console.error("Error crítico cargando el mapa de fronteras:", error));
}
