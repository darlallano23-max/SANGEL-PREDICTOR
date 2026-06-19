let datosPaises = [];

document.addEventListener("DOMContentLoaded", function() {
    console.log("Sistema de navegación cargado correctamente.");
    
    // Carga inicial de la data macro
    fetch('data/datos_macro_riesgo.json')
        .then(response => response.json())
        .then(data => {
            datosPaises = data;
            console.log("Data macro lista para usar:", datosPaises);
            // Renderizar los países inmediatamente en el módulo macro al cargar la app
            renderizarVistaMacro();
        })
        .catch(error => console.error("Error al precargar los datos macro:", error));
});

// =================================================================
// FUNCIÓN PRINCIPAL: CAMBIAR DE PESTAÑA (SPA)
// =================================================================
window.cambiarModulo = function(moduloId) {
    // 1. Ocultar todos los módulos
    document.querySelectorAll('.modulo-seccion').forEach(seccion => {
        seccion.classList.add('d-none');
    });
    
    // 2. Mostrar solo el módulo que el usuario clickeó
    const moduloObjetivo = document.getElementById(moduloId);
    if (moduloObjetivo) {
        moduloObjetivo.classList.remove('d-none');
    }
    
    // 3. Quitar el estado activo de todos los botones
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 4. Activar el botón correspondiente
    const mapeoBotones = {
        'modulo-macro': 'btn-macro',
        'modulo-calculadora': 'btn-calc',
        'modulo-simulador': 'btn-sim',
        'modulo-mapa': 'btn-mapa',
        'modulo-riesgos': 'btn-riesgos',
        'modulo-reporte': 'btn-rep'
    };

    const idBotonActivo = mapeoBotones[moduloId];
    if (idBotonActivo) {
        const btnActivo = document.getElementById(idBotonActivo);
        if (btnActivo) {
            btnActivo.classList.add('active');
        }
    }
    
    // 5. Títulos de la barra superior
    const titulos = {
        'modulo-macro': 'Módulo Macroeconómico',
        'modulo-calculadora': 'Calculadora Comex (Excel)',
        'modulo-simulador': 'Simulador "What-If"',
        'modulo-mapa': 'Mapa de Calor Global',
        'modulo-riesgos': 'Riesgos Críticos',
        'modulo-reporte': 'Reporting & Export'
    };
    
    if (titulos[moduloId]) {
        const tituloNavbar = document.getElementById('titulo-modulo');
        if (tituloNavbar) {
            tituloNavbar.innerText = titulos[moduloId];
        }
    }
    
    // 6. CONTROL DEL MAPA
    if (moduloId === 'modulo-mapa') {
        setTimeout(() => {
            if (typeof inicializarGeovisor === 'function') {
                inicializarGeovisor();
            }
            if (typeof map !== 'undefined' && map !== null) {
                map.invalidateSize();
                console.log("Dimensiones del geovisor adaptadas.");
            }
        }, 200);
    }

    // 7. CONTROL DE RIESGOS CRÍTICOS
    if (moduloId === 'modulo-riesgos') {
        renderizarRiesgosCriticos();
    }

    // 8. CONTROL DE REPORTES
    if (moduloId === 'modulo-reporte') {
        actualizarPanelReportes();
    }
};

// =================================================================
// NUEVA FUNCIÓN: RENDERIZAR PANEL MACROECONÓMICO EN 3 COLUMNAS
// =================================================================
function renderizarVistaMacro() {
    const contenedor = document.getElementById('contenedor-paises-macro');
    if (!contenedor) return;

    if (!datosPaises || datosPaises.length === 0) {
        contenedor.innerHTML = `<p class="text-muted text-center col-12 my-4">Cargando base de datos macroeconómicos...</p>`;
        return;
    }

    contenedor.innerHTML = ''; // Limpiar contenedor

    datosPaises.forEach(p => {
        // Formatear los datos reales basados en la estructura de tu JSON
        const inflacion = p.tasa_inflacion !== undefined ? p.tasa_inflacion.toFixed(1) + '%' : 'N/A';
        const volatilidad = p.volatilidad_divisa !== undefined ? p.volatilidad_divisa.toFixed(1) + '%' : 'N/A';
        const riesgoLogistico = p.score_riesgo_logistico !== undefined ? (p.score_riesgo_logistico * 100).toFixed(0) + '%' : 'N/A';
        const riesgoPais = p.riesgo_pais !== undefined ? p.riesgo_pais + ' pts' : 'N/A';
        const arancel = p.arancel_promedio !== undefined ? p.arancel_promedio.toFixed(1) + '%' : 'N/A';

        const tarjetaHtml = `
            <div class="col-xl-4 col-md-6 col-12 mb-4">
                <div class="card h-100 shadow-sm border-0 bg-white">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                            <div>
                                <h6 class="fw-bold m-0 text-dark">${p.nombre || 'Desconocido'}</h6>
                                <span class="badge bg-secondary-subtle text-secondary fw-semibold uppercase" style="font-size: 0.7rem;">
                                    ID: ${p.pais_id || 'N/A'}
                                </span>
                            </div>
                            <i class="bi bi-globe2 text-primary fs-5"></i>
                        </div>
                        
                        <div class="row g-2 small text-secondary">
                            <div class="col-6 mb-2">
                                <span class="d-block text-muted style="font-size: 0.75rem;">📈 Riesgo País:</span>
                                <strong class="text-dark">${riesgoPais}</strong>
                            </div>
                            <div class="col-6 mb-2">
                                <span class="d-block text-muted style="font-size: 0.75rem;">⚓ Riesgo Logístico:</span>
                                <strong class="text-dark">${riesgoLogistico}</strong>
                            </div>
                            <div class="col-6 mb-2">
                                <span class="d-block text-muted style="font-size: 0.75rem;">🎈 Inflación Anual:</span>
                                <strong class="text-dark">${inflacion}</strong>
                            </div>
                            <div class="col-6 mb-2">
                                <span class="d-block text-muted style="font-size: 0.75rem;">💱 Volatilidad Divisa:</span>
                                <strong class="text-dark">${volatilidad}</strong>
                            </div>
                            <div class="col-12 border-top pt-2">
                                <div class="d-flex justify-content-between">
                                    <span>📋 Arancel Promedio:</span>
                                    <strong class="text-primary">${arancel}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        contenedor.insertAdjacentHTML('beforeend', tarjetaHtml);
    });
}

// =================================================================
// FUNCIÓN: RENDERIZAR ALERTAS DE RIESGO
// =================================================================
function renderizarRiesgosCriticos() {
    const contenedor = document.getElementById('contenedor-alertas-criticas');
    const kpiContador = document.getElementById('kpi-contador-riesgos');
    
    if (!contenedor) return;

    if (!datosPaises || datosPaises.length === 0) {
        contenedor.innerHTML = `<p class="text-muted small text-center my-4">No hay datos macroeconómicos disponibles para analizar riesgos.</p>`;
        return;
    }

    const paisesEnRiesgo = datosPaises.filter(p => {
        const rLogistico = p.score_riesgo_logistico || 0;
        const rMacro = p.riesgo_pais ? p.riesgo_pais / 100 : 0; 
        return rLogistico > 0.40 || rMacro > 0.25;
    });
    
    if (kpiContador) {
        kpiContador.innerText = paisesEnRiesgo.length;
    }

    if (paisesEnRiesgo.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-shield-check text-success fs-1"></i>
                <p class="text-muted mt-2 mb-0">¡Excelente! No se detectan disrupciones críticas en los mercados activos.</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = '';

    paisesEnRiesgo.forEach(p => {
        const rLogistico = p.score_riesgo_logistico || 0;
        const rMacro = p.riesgo_pais ? p.riesgo_pais / 100 : 0;
        
        const maxRiesgo = Math.max(rLogistico, rMacro);
        const colorAlerta = maxRiesgo > 0.50 ? 'danger' : 'warning';
        
        const tarjetaHtml = `
            <div class="p-3 bg-light rounded border-start border-${colorAlerta} border-4 shadow-sm mb-2">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="m-0 fw-bold text-dark">${p.nombre || 'País Desconocido'}</h6>
                        <small class="text-muted text-uppercase fw-semibold" style="font-size: 0.7rem;">Código Región: ${p.pais_id || 'N/A'}</small>
                    </div>
                    <span class="badge bg-${colorAlerta === 'danger' ? 'danger' : 'warning text-dark'} fw-bold">
                        ${colorAlerta === 'danger' ? 'ALERTA SEVERA' : 'RIESGO MODERADO'}
                    </span>
                </div>
                
                <div class="row g-2 mt-1">
                    <div class="col-sm-6">
                        <div class="d-flex justify-content-between mb-1 small text-secondary">
                            <span>⚓ Riesgo Logístico:</span>
                            <span class="fw-bold">${(rLogistico * 100).toFixed(0)}%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-secondary" role="progressbar" style="width: ${rLogistico * 100}%"></div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="d-flex justify-content-between mb-1 small text-secondary">
                            <span>📈 Riesgo País (Macro):</span>
                            <span class="fw-bold">${(rMacro * 100).toFixed(0)}%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-dark" role="progressbar" style="width: ${rMacro * 100}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        contenedor.insertAdjacentHTML('beforeend', tarjetaHtml);
    });
}

// =================================================================
// SECCIÓN REPORTES: AUDITORÍA Y EXPORTACIÓN AVANZADA
// =================================================================
function actualizarPanelReportes() {
    const auditRegistros = document.getElementById('audit-registros');
    if (auditRegistros && typeof datosPaises !== 'undefined') {
        auditRegistros.innerText = `${datosPaises.length} mercados cargados`;
    }
}

function generarReporte() {
    const formato = document.getElementById('reporte-formato').value;
    const filtro = document.getElementById('reporte-filtro').value;

    if (typeof datosPaises === 'undefined' || datosPaises.length === 0) {
        alert("❌ Error: No hay datos disponibles para exportar en este momento.");
        return;
    }

    let datosAExportar = datosPaises;
    if (filtro === 'criticos') {
        datosAExportar = datosPaises.filter(p => {
            const rLogistico = p.score_riesgo_logistico || 0;
            const rMacro = p.riesgo_pais ? p.riesgo_pais / 100 : 0;
            return rLogistico > 0.40 || rMacro > 0.25;
        });
    }

    if (datosAExportar.length === 0) {
        alert("⚠️ No se encontraron registros que coincidan con el filtro seleccionado.");
        return;
    }

    if (formato === 'csv') {
        let contenidoCsv = "\uFEFF";
        contenidoCsv += "Código,Nombre,Riesgo Logístico,Riesgo Macro,Tasa Inflación\n";

        datosAExportar.forEach(p => {
            const rLogistico = p.score_riesgo_logistico || 0;
            const rMacro = p.riesgo_pais ? p.riesgo_pais / 100 : 0;
            const inflacion = p.tasa_inflacion || 0;
            contenidoCsv += `"${p.pais_id || 'N/A'}","${p.nombre || 'N/A'}",${(rLogistico * 100).toFixed(0)}%,${(rMacro * 100).toFixed(0)}%,${inflacion}%\n`;
        });

        const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Sangel_Predictor_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } else if (formato === 'html-print') {
        const ventanaImpresion = window.open('', '_blank');
        let filasTabla = '';
        datosAExportar.forEach(p => {
            const rLogistico = p.score_riesgo_logistico || 0;
            const rMacro = p.riesgo_pais ? p.riesgo_pais / 100 : 0;
            filasTabla += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${p.pais_id || 'N/A'}</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${p.nombre || 'N/A'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${(rLogistico * 100).toFixed(0)}%</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${(rMacro * 100).toFixed(0)}%</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${p.tasa_inflacion || 0}%</td>
                </tr>
            `;
        });

        ventanaImpresion.document.write(`
            <html>
            <head>
                <title>Reporte Ejecutivo - SANGEL Predictor</title>
                <style>
                    body { font-family: 'Arial', sans-serif; color: #333; padding: 40px; }
                    .header { text-align: center; border-bottom: 3px solid #0d6efd; padding-bottom: 12px; margin-bottom: 30px; }
                    .title { margin: 0; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; }
                    .meta { font-size: 12px; color: #666; margin-top: 6px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                    th { background-color: #f8f9fa; padding: 12px; border-bottom: 2px solid #222; font-size: 13px; text-transform: uppercase; }
                    .footer { margin-top: 60px; font-size: 11px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2 class="title">🔮 SANGEL Predictor - Informe Global de Riesgos</h2>
                    <div class="meta">Fecha de Emisión: ${new Date().toLocaleString()} | Inteligencia Comercial Internacional</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">ID</th>
                            <th style="text-align: left;">Mercado / Socio Comercial</th>
                            <th>Riesgo Logístico</th>
                            <th>Riesgo País (Macro)</th>
                            <th>Tasa Inflación</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasTabla}
                    </tbody>
                </table>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        ventanaImpresion.document.close();
    }
}
