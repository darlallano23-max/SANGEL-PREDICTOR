let map;
let geojsonLayer;
let mapaInicializado = false; // Bandera para evitar duplicados

// Esta función creará el mapa físico cuando la pestaña sea visible
function inicializarGeovisor() {
    if (mapaInicializado) return; // Si ya se creó, no hacer nada

    console.log("Inicializando contenedor físico del geovisor...");
    
    // 1. Crear el mapa base (usando tu variable global 'map')
    map = L.map('map').setView([15, 10], 2);

    // 2. Capa base de CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTODB',
        maxZoom: 19
    }).addTo(map);

    mapaInicializado = true;

    // 3. Cargar los datos predictivos integrados de SANGEL PREDICTOR
    cargarYAcoplarDatos();
}

function cargarYAcoplarDatos() {
    console.log("Cargando base de datos espacial e incertidumbres desde la carpeta data...");
    
    // TRUCO ROMPE-CACHÉ: Agregamos un timestamp dinámico para obligar al navegador a leer el JSON más reciente
    fetch('data/paises_geovisor.json?v=' + new Date().getTime())
        .then(res => res.json())
        .then(geojsonData => {
            
            geojsonLayer = L.geoJson(geojsonData, {
                // Estilo dinámico usando los colores calculados en el backend de Python
                style: function(feature) {
                    const props = feature.properties || {};
                    
                    // Si el país tiene color asignado por Python lo usa; si no, aplica gris por defecto
                    let colorFinal = props.color_hex || '#bdc3c7'; 
                    let opacidadFinal = props.color_hex ? 0.75 : 0.4;

                    return {
                        fillColor: colorFinal,
                        weight: props.color_hex ? 1.5 : 0.7,
                        opacity: 1,
                        color: props.color_hex ? '#212529' : '#ffffff',
                        fillOpacity: opacidadFinal
                    };
                },
                
                // Configuración de Popups interactivos y eventos visuales
                onEachFeature: function(feature, featureLayer) {
                    const props = feature.properties || {};

                    if (props.name) {
                        // Construimos la tabla informativa interactiva dentro del Popup
                        const contenidoPopup = `
                            <div style="font-family: Arial, sans-serif; padding: 5px; min-width: 200px;">
                                <h6 style="margin: 0 0 8px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 4px; color: #212529;">
                                    <strong>${props.name} (${feature.id || 'N/A'})</strong>
                                </h6>
                                <table style="width: 100%; font-size: 12px; color: #495057; border-collapse: collapse;">
                                    <tr><td style="padding: 3px 0;">⚓ <b>Riesgo Logístico:</b></td><td style="text-align: right;">${(props.riesgo_logistico * 100).toFixed(0)}%</td></tr>
                                    <tr><td style="padding: 3px 0;">📈 <b>Riesgo Macroeconómico:</b></td><td style="text-align: right;">${(props.riesgo_macro * 100).toFixed(0)}%</td></tr>
                                    <tr style="border-top: 1px solid #dee2e6;">
                                        <td style="padding-top: 6px;"><b>Incertidumbre Global:</b></td>
                                        <td style="text-align: right; padding-top: 6px;">
                                            <span style="color: ${props.color_hex}; font-weight: bold;">${props.alerta || 'N/A'} (${props.incertidumbre_global || 0})</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        `;
                        featureLayer.bindPopup(contenidoPopup);
                        // Efectos visuales de Hover (pasar el mouse por encima)
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
            
            console.log("🚀 ¡Geovisor mapeado y renderizado con las capas predictivas del simulador con éxito!");
        })
        .catch(err => console.error("❌ Error al inyectar capas geográficas en el mapa:", err));
    if (typeof calcularYRepintarMapa === 'function') {
    calcularYRepintarMapa();
    }
}
