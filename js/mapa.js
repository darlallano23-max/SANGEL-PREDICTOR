let map;
let geojsonLayer;

document.addEventListener("DOMContentLoaded", function() {
    console.log("Iniciando renderizado del mapa corregido...");
    
    // 1. Inicializar el mapa
    map = L.map('map').setView([15, 10], 2);

    // 2. Capa base de CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTODB',
        maxZoom: 19
    }).addTo(map);

    // Forzar recalculo de espacio visual
    setTimeout(() => {
        map.invalidateSize();
    }, 300);

    // 3. Descargar la data macro
    fetch('data/datos_macro_riesgo.json')
        .then(res => res.json())
        .then(datosLogistica => {
            console.log("Data de riesgos lista para cruzar:", datosLogistica);
            
            // 4. Descargar las fronteras geográficas
            return fetch('data/paises_geo.json')
                .then(res => res.json())
                .then(geojsonData => {
                    
                    geojsonLayer = L.geoJson(geojsonData, {
                        style: function(feature) {
                            // Extraer código del país limpiando espacios y pasándolo a mayúsculas
                            const props = feature.properties || {};
                            const codigoGeo = (feature.id || props.id || props.iso_a2 || props.ISO_A2 || props.name || "").toUpperCase().trim();
                            
                            // Buscar coincidencia con la data local
                            const datosMatch = datosLogistica.find(p => p.pais_id.toUpperCase().trim() === codigoGeo || p.nombre.toUpperCase().trim() === codigoGeo);
                            
                            // Por defecto, pintar el resto del mundo en gris para ver que sí funcione
                            let colorFinal = '#bdc3c7'; 
                            let opacidadFinal = 0.4;

                            if (datosMatch) {
                                const score = parseFloat(datosMatch.score_riesgo_logistico);
                                opacidadFinal = 0.85; // Resaltar tus países monitoreados
                                
                                if (score >= 0.70) {
                                    colorFinal = '#dc3545'; // Rojo - Riesgo Crítico
                                } else if (score >= 0.40) {
                                    colorFinal = '#ffc107'; // Amarillo - Riesgo Medio
                                } else {
                                    colorFinal = '#198754'; // Verde - Riesgo Bajo
                                }
                            }

                            return {
                                fillColor: colorFinal,
                                weight: datosMatch ? 2.0 : 0.7,
                                opacity: 1,
                                color: datosMatch ? '#212529' : '#ffffff', // Bordes oscuros para tus países
                                fillOpacity: opacidadFinal
                            };
                        },
                        onEachFeature: function(feature, featureLayer) {
                            const props = feature.properties || {};
                            const codigoGeo = (feature.id || props.id || props.iso_a2 || props.ISO_A2 || props.name || "").toUpperCase().trim();
                            const datosMatch = datosLogistica.find(p => 
                                (p.pais_id && p.pais_id.toUpperCase().trim() === codigoGeo) || 
                                (p.nombre && p.nombre.toUpperCase().trim() === codigoGeo);
                            if (datosMatch) {
                                const contenidoPopup = `
                                    <div style="font-family: Arial, sans-serif; padding: 5px; min-width: 190px;">
                                        <h6 style="margin: 0 0 8px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 4px; color: #212529;">
                                            <strong>${datosMatch.nombre} (${datosMatch.pais_id})</strong>
                                        </h6>
                                        <table style="width: 100%; font-size: 12px; color: #495057;">
                                            <tr><td>📈 <b>Inflación:</b></td><td style="text-align: right;">${datosMatch.tasa_inflacion}%</td></tr>
                                            <tr><td>💱 <b>Volatilidad:</b></td><td style="text-align: right;">${datosMatch.volatilidad_divisa}/10</td></tr>
                                            <tr><td>⚠️ <b>Riesgo País:</b></td><td style="text-align: right;">${datosMatch.riesgo_pais} pts</td></tr>
                                            <tr><td>⚓ <b>Puerto:</b></td><td style="text-align: right;">${datosMatch.indice_congestion_portuaria}/5</td></tr>
                                            <tr style="border-top: 1px solid #dee2e6;"><td style="padding-top: 5px;"><b>Score:</b></td>
                                            <td style="text-align: right; padding-top: 5px;"><span class="badge bg-${datosMatch.score_riesgo_logistico >= 0.7 ? 'danger' : datosMatch.score_riesgo_logistico >= 0.4 ? 'warning' : 'success'}">${datosMatch.score_riesgo_logistico}</span></td></tr>
                                        </table>
                                    </div>
                                `;
                                featureLayer.bindPopup(contenidoPopup);

                                featureLayer.on({
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
                    
                    console.log("¡Geovisor cargado y procesado sin errores sintácticos!");
                });
        })
        .catch(err => console.error("Error cargando los archivos de configuración del mapa:", err));
});
