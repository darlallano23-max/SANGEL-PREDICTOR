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

// Función para cambiar de pestaña estilo SPA (Single Page Application)
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
    
    // 3. Quitar el estado activo de todos los botones del menú lateral
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 4. Activar el botón correspondiente según el módulo seleccionado
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
    
    // 5. Títulos de la barra superior según la sección activa
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
    
    // 6. CONTROL CRÍTICO Y SEGURO DEL MAPA:
    if (moduloId === 'modulo-mapa') {
        // Forzar un pequeño delay para asegurarnos de que Bootstrap ya removió el 'd-none' por completo
        setTimeout(() => {
            // Llamar a la inicialización segura que creamos en mapa.js
            if (typeof inicializarGeovisor === 'function') {
                inicializarGeovisor();
            }
            
            // Recalcular dimensiones una vez visible en pantalla para evitar el cuadro gris/blanco
            if (typeof map !== 'undefined' && map !== null) {
                map.invalidateSize();
                console.log("Dimensiones del geovisor adaptadas con éxito.");
            }
        }, 200);
    }

    // 7. ¡AQUÍ AGREGASTE EL DISPARADOR DE RIESGOS CRÍTICOS!
    if (moduloId === 'modulo-riesgos') {
        renderizarRiesgosCriticos();
    }
}; 
// FUNCIÓN INDEPENDIENTE PARA PROCESAR RIESGOS
function renderizarRiesgosCriticos() {
    const contenedor = document.getElementById('contenedor-alertas-criticas');
    const kpiContador = document.getElementById('kpi-contador-riesgos');
    
    if (!contenedor) return;

    if (!datosPaises || datosPaises.length === 0) {
        contenedor.innerHTML = `<p class="text-muted small text-center my-4">No hay datos macroeconómicos disponibles para analizar riesgos.</p>`;
        return;
    }

    // FILTRADO DINÁMICO RE REAL: 
    // - score_riesgo_logistico > 0.40 (40%) debido a congestión o desvíos.
    // - riesgo_pais > 25 (Si tu escala es de 0 a 100, un 28 ya empieza a marcar alerta moderada/crítica).
    const paisesEnRiesgo = datosPaises.filter(p => {
        const rLogistico = p.score_riesgo_logistico || 0;
        // Normalizamos riesgo_pais a escala 0-1 si viene como entero (ej: 28 -> 0.28)
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
        // Si el riesgo logístico o macro supera el 50% total normalizado, va a Alerta Severa (rojo), si no Moderado (amarillo)
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
}
