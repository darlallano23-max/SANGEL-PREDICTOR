let map;
let geojsonLayer;

document.addEventListener("DOMContentLoaded", function() {
    console.log("Iniciando Operación Rescate del Mapa...");
    
    // 1. Inicializar el mapa
    map = L.map('map').setView([15, 10], 2);

    // 2. CREAR UN PANEL EXCLUSIVO PARA NUESTROS POLÍGONOS (Evita que el mapa base los tape)
    map.createPane('capaFronteras');
    map.getPane('capaFronteras').style.zIndex = 650; // Forzado por encima de los tiles
    map.getPane('capaFronteras').style.pointerEvents = 'none'; // Permite hacer click a través de ella

    // 3. Capa base minimalista de CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTODB',
        maxZoom: 19
    }).addTo(map);

    // Forzar recalculo de espacio
    setTimeout(() => {
        map.invalidateSize();
    }, 300);

    // 4. Descargar la data macro
    fetch('data/datos_macro_riesgo.json')
        .then(res => res.json())
        .then(datosLogistica => {
            console.log("Data de riesgos lista para cruzar:", datosLogistica);
            
            // 5. Descargar las fronteras geográficas
            return fetch('data/paises_geo.json')
                .then(res => res.json())
                .then(geojsonData => {
                    
                    geojsonLayer = L.geoJson(geojsonData, {
                        pane: 'capaFronteras', // Obligamos a usar el panel superior
                        style: function(feature) {
                            const codigoGeo = (feature.id || feature.properties.id || feature.properties.iso_a2 || feature.properties.ISO_A2 || "").toUpperCase().trim();
                            const datosMatch = datosLogistica.find(p => p.pais_id.toUpperCase().trim() === codigoGeo);
                            
                            // SI NO HACE MATCH, LO PINTAMOS EN GRIS OSCURO PARA VER SI EXISTE LA FRONTERA
                            let colorFinal = '#95a5a6'; 
                            let opacidadFinal = 0.4;

                            if (datosMatch) {
                                const score = parseFloat(datosMatch.score_riesgo_logistico);
                                opacidadFinal = 0.9; // Casi opaco para que resalte sí o sí
                                
                                if (score >= 0.70) {
                                    colorFinal = '#dc3545'; // Rojo
                                } else if (score >= 0.40) {
                                    colorFinal = '#ffc107'; // Amarillo
                               .350 } else {
                                    colorFinal = '#198754'; // Verde
                                }
                            }

                            return {
                                fillColor: colorFinal,
                                weight: datosMatch ? 2.5 : 0.8,
                                opacity: 1,
                                color: datosMatch ? '#000000' : '#ffffff', // Bordes negros para tus países, blancos para el resto
                                fillOpacity: opacidadFinal
                            };
                        },
                        onEachFeature: function(feature, layer) {
                            const codigoGeo = (feature.id || feature.properties.id || feature.properties.iso_a2 || feature.properties.ISO_A2 || "").toUpperCase().trim();
                            const datosMatch = datosLogistica.find(p => p.pais_id.toUpperCase().trim() === codigoGeo);

                            // Activar eventos de interacción para que Leaflet reconozca los polígonos
                            if (layer._path) {
                                layer._path.style.pointerEvents = 'auto'; 
                            }

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
                                layer.bindPopup(contenidoPopup);

                                layer.on({
                                    mouseover: function(e) {
                                        e.target.setStyle({ fillOpacity: 1, weight: 3, color: '#0d6efd' });
                                    },
                                    mouseout: function(e) {
                                        geojsonLayer.resetStyle(e.target);
                                    }
                                });
                            }
                        }
                    }).addTo(map);
                    
                    console.log("¡Z-Index y paneles forzados arriba con éxito!");
                });
        })
        .catch(err => console.error("Error en la cadena de rendering:", err));
});
