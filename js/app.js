// Variable global para compartir la data entre archivos
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
}
