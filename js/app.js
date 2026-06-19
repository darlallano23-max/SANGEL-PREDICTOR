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

    // Verificar si hay datos cargados
    if (typeof datosPaises === 'undefined' || datosPaises.length === 0) {
        contenedor.innerHTML = `<p class="text-muted small text-center my-4">No hay datos macroeconómicos disponibles para analizar riesgos.</p>`;
        return;
    }

    // Filtrar países con riesgo logístico o macro mayor al 60% (0.60)
    const paisesEnRiesgo = datosPaises.filter(p => p.riesgo_logistico > 0.60 || p.riesgo_macro > 0.60);
    
    // Actualizar el número gigante del KPI izquierdo
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

    // Limpiar el contenedor antes de inyectar
    contenedor.innerHTML = '';

    // Dibujar una tarjeta interactiva por cada país en riesgo
    paisesEnRiesgo.forEach(p => {
        // Determinar un color de barra según el nivel de riesgo máximo detectado
        const maxRiesgo = Math.max(p.riesgo_logistico, p.riesgo_macro);
        const colorAlerta = maxRiesgo > 0.75 ? 'danger' : 'warning';
        
        const tarjetaHtml = `
            <div class="p-3 bg-light rounded border-start border-${colorAlerta} border-4 shadow-sm mb-2">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="m-0 fw-bold text-dark">${p.nombre || 'País Desconocido'}</h6>
                        <small class="text-muted text-uppercase fw-semibold" style="font-size: 0.7rem;">Código Región: ${p.codigo || 'N/A'}</small>
                    </div>
                    <span class="badge bg-${colorAlerta === 'danger' ? 'danger' : 'warning text-dark'} fw-bold">
                        ${colorAlerta === 'danger' ? 'ALERTA SEVERA' : 'RIESGO MODERADO'}
                    </span>
                </div>
                
                <div class="row g-2 mt-1">
                    <div class="col-sm-6">
                        <div class="d-flex justify-content-between mb-1 small text-secondary">
                            <span>⚓ Riesgo de Ruta/Puerto:</span>
                            <span class="fw-bold">${(p.riesgo_logistico * 100).toFixed(0)}%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-secondary" role="progressbar" style="width: ${p.riesgo_logistico * 100}%"></div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="d-flex justify-content-between mb-1 small text-secondary">
                            <span>📈 Riesgo Cambiario/Macro:</span>
                            <span class="fw-bold">${(p.riesgo_macro * 100).toFixed(0)}%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-dark" role="progressbar" style="width: ${p.riesgo_macro * 100}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        contenedor.insertAdjacentHTML('beforeend', tarjetaHtml);
    });
}
