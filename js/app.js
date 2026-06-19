let datosPaises = [];

document.addEventListener("DOMContentLoaded", function() {
    console.log("Sistema de navegación cargado correctamente.");
    
    // Carga inicial de la data macro
    fetch('data/datos_macro_riesgo.json')
        .then(response => response.json())
        .then(data => {
            datosPaises = data;
            console.log("Data macro lista para usar:", datosPaises);
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

    // 8. CONTROL DE REPORTES (Con verificación segura)
    if (moduloId === 'modulo-reporte') {
        actualizarPanelReportes();
    }
}; // Llave de cierre perfecta para cambiarModulo

// =================================================================
// FUNCIÓN: RENDERIZAR ALERTAS DE RIESGO (ADAPTADA A TU JSON)
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
        // Añadimos el BOM \uFEFF para forzar a Excel a leer UTF-8 (evita errores con tildes)
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
        // --- INFORME EJECUTIVO IMPRIMIBLE (HERRAMIENTA NATIVA) ---
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
                <p>Auditoría predictiva automatizada sobre la vulnerabilidad de las operaciones comerciales de los mercados listados:</p>
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
                <div class="footer">
                    SANGEL Predictor - Datos de Simulación Confidenciales.
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        ventanaImpresion.document.close();
    }
}
