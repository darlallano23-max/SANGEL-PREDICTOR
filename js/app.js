
// Variable global para almacenar los datos macro de los países
let datosPaises = [];

document.addEventListener("DOMContentLoaded", function() {
    console.log("Orquestador del Dashboard cargado de manera local.");
    
    // Cargar los datos sintéticos desde la carpeta data
    fetch('data/datos_macro_riesgo.json')
        .then(response => response.json())
        .then(data => {
            datosPaises = data;
            console.log("Data sintética cargada con éxito:", datosPaises);
        })
        .catch(error => console.error("Error cargando el archivo de datos macro:", error));
});

// Función para alternar la visualización de los módulos sin recargar la página
function cambiarModulo(moduloId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.modulo-seccion').forEach(seccion => {
        seccion.classList.add('d-none');
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(moduloId).classList.remove('d-none');
    
    // Remover clase active de todos los botones del menú
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Actualizar título dinámico de la barra superior
    const titulos = {
        'modulo-macro': 'Módulo Macroeconómico',
        'modulo-calculadora': 'Calculadora de Comercio Exterior',
        'modulo-simulador': 'Simulador de Escenarios Dinámicos ("What-If")',
        'modulo-mapa': 'Mapa de Calor Global de Riesgo',
        'modulo-riesgos': 'Panel de Riesgos Críticos Próximos',
        'modulo-reporte': 'Reporting Ejecutivo y Exportación'
    };
    
    document.getElementById('titulo-modulo').innerText = titulos[moduloId];
    
    // Caso especial: Si abren el mapa, forzar a Leaflet a redibujarse para que no salga gris
    if (moduloId === 'modulo-mapa') {
        setTimeout(() => {
            if (typeof map !== 'undefined') {
                map.invalidateSize();
                console.log("Mapa recalculado en el cambio de módulo.");
            }
        }, 200);
    }
}
