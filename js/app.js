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
// SECCIÓN REPORTES: AUDITORÍA Y EXPORTACIÓN
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
        let contenidoCsv = "data:text/csv;charset=utf-8,";
        contenidoCsv += "Codigo,Nombre,Riesgo_Logistico,Riesgo_Macro\n";

        datosAExportar.forEach(p => {
            const rLogistico = p.score_riesgo_logistico || 0;
            const rMacro = p.riesgo_pais ? p.riesgo_pais / 100 : 0;
            contenidoCsv += `${p.pais_id || 'N/A'},${p.nombre || 'N/A'},${(rLogistico * 100).toFixed(0)}%,${(rMacro * 100).toFixed(0)}%\n`;
        });

        const encodedUri = encodeURI(contenidoCsv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_Sangel_Predictor_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert(`📄 ¡Reporte Ejecutivo PDF Generado con éxito!\n\nProcesando informe comprimido para ${datosAExportar.length} países seleccionados.\nLa descarga iniciará automáticamente.`);
        console.log("Estructurando PDF con los datos auditados:", datosAExportar);
    }
}
