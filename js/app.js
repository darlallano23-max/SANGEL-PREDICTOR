
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
function cambiarModulo(moduloId) {
    // Ocultar todos los módulos
    document.querySelectorAll('.modulo-seccion').forEach(seccion => {
        seccion.classList.add('d-none');
    });
    
    // Mostrar solo el módulo que el usuario clickeó
    document.getElementById(moduloId).classList.remove('d-none');
    
    // Quitar el estado activo de todos los botones del menú lateral
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Títulos de la barra superior según la sección activa
    const titulos = {
        'modulo-macro': 'Módulo Macroeconómico',
        'modulo-calculadora': 'Calculadora de Comercio Exterior',
        'modulo-simulador': 'Simulador de Escenarios Dinámicos ("What-If")',
        'modulo-mapa': 'Mapa de Calor Global de Riesgo',
        'modulo-riesgos': 'Riesgos Críticos Próximos',
        'modulo-reporte': 'Reporting Ejecutivo y Exportación'
    };
    
    document.getElementById('titulo-modulo').innerText = titulos[moduloId];
    
    // SEGURO DEL MAPA: Forzar a Leaflet a recalcular su tamaño si abren el mapa
    if (moduloId === 'modulo-mapa') {
        setTimeout(() => {
            if (typeof map !== 'undefined') {
                map.invalidateSize();
                console.log("Tamaño del mapa ajustado con éxito.");
            }
        }, 150);
    }
}
