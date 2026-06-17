let map;
let geojsonLayer;

document.addEventListener("DOMContentLoaded", function() {
    console.log("Inicializando geovisor con forzado de color SVG...");
    
    // 1. Crear el mapa apuntando al contenedor HTML
    map = L.map('map').setView([15, 10], 2);

    // 2. Capa base minimalista de CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTODB',
        maxZoom: 19
    }).addTo(map);

    // Forzar a Leaflet a recalcular su tamaño por si acaso
    setTimeout(() => {
        map.invalidateSize();
    }, 300);

    // 3. Cargar datos_macro_riesgo.json primero
    fetch('data/datos_macro_riesgo.json')
        .then(res => {
            if (!res.ok) throw new Error("No se pudo leer datos_macro_riesgo.json");
            return res.json();
        })
        .then(datosLogistica => {
            console.log("Data logística cargada para mapeo:", datosLogistica);
            
            // 4. Cargar el mapa geográfico (paises_geo.json)
            return fetch('data/paises_geo.json')
                .then(res => {
                    if (!res.ok) throw new Error("No se pudo leer paises_geo.json");
                    return res.json();
                })
                .then(geojsonData => {
                    
                    // 5. Inyectar y pintar las fronteras cruzando la data
                    geojsonLayer = L.geoJson(geojsonData, {
                        style: function(feature) {
                            // Buscador flexible de códigos de país
                            const codigoGeo = (feature.id || feature.properties.id || feature.properties.iso_a2 || feature.properties.ISO_A2 || "").toUpperCase();
                            const datosMatch = datosLogistica.find(p => p.pais_id.toUpperCase() === codigoGeo.trim());
                            
                            let colorFinal = '#e9ecef'; // Gris claro por defecto
                            let opacidadFinal = 0.2;

                            if (datosMatch) {
                                const score = parseFloat(datosMatch.score_riesgo_logistico);
                                opacidadFinal = 0.85; 
                                
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
                                weight: datosMatch ? 2.0 : 0.6,
                                opacity: 1,
                                color: datosMatch ? '#111111' : '#ced4da', 
                                fillOpacity: opacidadFinal
                            };
                        },
                        onEachFeature: function(feature, layer) {
                            const codigoGeo = (feature.id || feature.properties.id || feature.properties.iso_a2 || feature.properties.ISO_A2 || "").toUpperCase();
                            const datosMatch = datosLogistica.find(p => p.pais_id.toUpperCase() === codigoGeo.trim());

                            if (datosMatch) {
                                // DETONADOR DE COLOR SEGURO: Forzar color directamente en el SVG nativo
                                layer.on('add', function() {
                                    if (layer._path) {
                                        const score = parseFloat(datosMatch.score_riesgo_logistico);
                                        let c = score >= 0.70 ? '#dc3545' : score >= 0.40 ? '#ffc107' : '#198754';
                                        layer._path.setAttribute('fill', c);
                                        layer._path.setAttribute('fill-opacity', '0.85');
                                    }
                                });

                                // Ventana informativa (Popup)
                                const contenidoPopup = `
                                    <div style="font-family: Arial, sans-serif; padding: 5px; min-width: 190px;">
                                        <h6 style="margin: 0 0 8px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 4px; color: #212529;">
                                            <strong>${datosMatch.nombre} (${datosMatch.pais_id})</strong>
                                        </h6>
                                        <table style="width: 100%; font-size: 12px; color: #495057;">
                                            <tr><td style="padding: 2px 0;">📈 <b>Inflación:</b></td><td style="text-align: right;">${datosMatch.tasa_inflacion}%</td></tr>
                                            <tr><td style="padding: 2px 0;">💱 <b>Volatilidad:</b></td><td style="text-align: right;">${datosMatch.volatilidad_divisa}/10</td></tr>
                                            <tr><td style="padding: 2px 0;">⚠️ <b>Riesgo País:</b></td><td style="text-align: right;">${datosMatch.riesgo_pais} pts</td></tr>
                                            <tr><td style="padding: 2px 0;">⚓ <b>Congestión Puerto:</b></td><td style="text-align: right;">${datosMatch.indice_congestion_portuaria}/5</td></tr>
                                            <tr style="border-top: 1px solid #dee2e6;">
                                                <td style="padding-top: 6px;"><b>Score Riesgo:</b></td>
                                                <td style="text-align: right; padding-top: 6px;">
                                                    <span class="badge bg-${datosMatch.score_riesgo_logistico >= 0.7 ? 'danger' : datosMatch.score_riesgo_logistico >= 0.4 ? 'warning' : 'success'}">
                                                        ${datosMatch.score_riesgo_logistico}
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                `;
                                layer.bindPopup(contenidoPopup);

                                // Interactividad Hover
                                layer.on({
                                    mouseover: function(e) {
                                        e.target.setStyle({ fillOpacity: 0.95, weight: 2.5, color: '#0d6efd' });
                                    },
                                    mouseout: function(e) {
                                        geojsonLayer.resetStyle(e.target);
                                        // Re-forzar el color al quitar el mouse encima
                                        if (e.target._path) {
                                            const score = parseFloat(datosMatch.score_riesgo_logistico);
                                            let c = score >= 0.70 ? '#dc3545' : score >= 0.40 ? '#ffc107' : '#198754';
                                            e.target._path.setAttribute('fill', c);
                                        }
                                    }
                                });
                            }
                        }
                    }).addTo(map);
                    
                    console.log("¡El mapamundi se ha pintado con los KPI de riesgo correctamente!");
                });
        })
        .catch(err => console.error("Error en la matriz de renderizado de mapas:", err));
});
