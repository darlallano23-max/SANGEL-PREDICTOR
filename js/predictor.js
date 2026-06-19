let chartWhatIfInstance = null;

document.addEventListener("DOMContentLoaded", function() {
    console.log("Motor de Simulación Predictiva 'What-If' inicializado.");

    // Conectar los event listeners a los sliders del escenario de estrés
    const sliders = ['stress-flete', 'stress-riesgo', 'stress-demora'];
    sliders.forEach(id => {
        const sliderElement = document.getElementById(id);
        if (sliderElement) {
            sliderElement.addEventListener('input', ejecutarSimulacionWhatIf);
        }
    });

    // Inicializar la gráfica vacía o con datos base
    inicializarGraficaWhatIf();
});

// Función para renderizar la gráfica por primera vez
function inicializarGraficaWhatIf() {
    const ctx = document.getElementById('chartWhatIf');
    if (!ctx) return;

    chartWhatIfInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Escenario Base', 'Escenario Estresado (What-If)'],
            datasets: [{
                label: 'Costo Total de Importación (DDP)',
                data: [0, 0],
                backgroundColor: ['#198754', '#dc3545'],
                borderRadius: 6,
                borderWidth: 0,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return '$' + value.toLocaleString(); }
                    }
                }
            }
        }
    });
}

// Ejecuta los cálculos predictivos en cascada estresada
function ejecutarSimulacionWhatIf() {
    // 1. Obtener valores base actuales de la calculadora COMEX
    const inputCantidad = document.getElementById('input-cantidad');
    const inputPrecio = document.getElementById('input-precio');
    
    const cantidad = inputCantidad ? (parseFloat(inputCantidad.value) || 0) : 1000;
    const precioEXW = inputPrecio ? (parseFloat(inputPrecio.value) || 0) : 5;

    // 2. Obtener los valores de estrés de los Sliders
    const sobrecostoFletePorc = parseFloat(document.getElementById('stress-flete').value) || 0;
    const multRiesgo = parseFloat(document.getElementById('stress-riesgo').value) || 1.0;
    const diasDemora = parseInt(document.getElementById('stress-demora').value) || 0;

    // Actualizar etiquetas de texto en los sliders
    document.getElementById('val-stress-flete').innerText = `+${sobrecostoFletePorc}%`;
    document.getElementById('val-stress-riesgo').innerText = `${multRiesgo.toFixed(1)}x`;
    document.getElementById('val-stress-demora').innerText = `${diasDemora} días`;

    // 3. CÁLCULO ESCENARIO BASE
    const totalEXW = cantidad * precioEXW;
    const fleteBase = totalEXW > 0 ? 1500 : 0;
    const seguroBase = (totalEXW + 250) * 0.01;
    const cifBase = totalEXW + 250 + fleteBase + seguroBase;
    const ddpBase = cifBase * 1.25 + 300; // Estimación base rápida (CIF + Impuestos/Imprevistos aprx)

    // 4. CÁLCULO ESCENARIO ESTRESADO ("WHAT-IF")
    const fleteEstresado = fleteBase * (1 + (sobrecostoFletePorc / 100));
    const seguroEstresado = seguroBase * multRiesgo; // El riesgo país afecta directamente la póliza de seguro
    const cifEstresado = totalEXW + 250 + fleteEstresado + seguroEstresado;
    
    // Costo por demoras aduaneras/bodegaje en puerto (Ej: $45 por día de retraso por contenedor)
    const costoDemoraPuerto = diasDemora * 45;

    // Impuestos y fondos de imprevistos aumentan por el factor de riesgo crítico
    const imprevistosEstresados = cifEstresado * (0.03 * multRiesgo);
    const ddpEstresado = cifEstresado * 1.22 + imprevistosEstresados + costoDemoraPuerto + 300;

    // 5. ACTUALIZAR KPIs EN PANTALLA
    const sobrecostoTotal = Math.max(0, ddpEstresado - ddpBase);
    const costoUnitarioBase = cantidad > 0 ? (ddpBase / cantidad) : 0;
    const costoUnitarioEstresado = cantidad > 0 ? (ddpEstresado / cantidad) : 0;
    const incrementoUnitarioPorc = costoUnitarioBase > 0 ? ((costoUnitarioEstresado - costoUnitarioBase) / costoUnitarioBase) * 100 : 0;

    document.getElementById('kpi-sobrecosto').innerText = `$ ${sobrecostoTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('kpi-impacto-unitario').innerText = `+${incrementoUnitarioPorc.toFixed(2)}%`;

    // Cambiar color del KPI según la gravedad
    const kpiElement = document.getElementById('kpi-impacto-unitario');
    if (incrementoUnitarioPorc > 25) {
        kpiElement.className = "fs-5 fw-bold text-danger";
    } else if (incrementoUnitarioPorc > 10) {
        kpiElement.className = "fs-5 fw-bold text-warning";
    } else {
        kpiElement.className = "fs-5 fw-bold text-success";
    }

    // 6. DINAMIZAR EL RECUADRO DE MITIGACIÓN SUGERIDA
    let sugerencia = "El escenario actual es estable. No se requieren rutas alternativas de contingencia.";
    if (sobrecostoFletePorc > 50 || multRiesgo >= 1.8 || diasDemora > 10) {
        sugerencia = "🚨 CRÍTICO: Se sugiere triangular la operación vía puerto alterno o fraccionar el embarque para evitar multas por demorajes.";
    } else if (sobrecostoFletePorc > 15 || multRiesgo > 1.3 || diasDemora > 3) {
        sugerencia = "⚠️ ADVERTENCIA: Margen operativo bajo presión. Se recomienda absorber imprevistos negociando términos FOB o prepagando fletes.";
    }
    document.getElementById('texto-mitigacion').innerText = sugerencia;

    // 7. ACTUALIZAR GRÁFICA EN VIVO
    if (chartWhatIfInstance) {
        chartWhatIfInstance.data.datasets[0].data = [
            parseFloat(ddpBase.toFixed(2)), 
            parseFloat(ddpEstresado.toFixed(2))
        ];
        chartWhatIfInstance.update();
    }
}
