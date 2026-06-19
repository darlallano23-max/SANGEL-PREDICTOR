// Variable para recordar qué país seleccionó el usuario en el mapa
let paisSeleccionadoParaDesglose = null;

// Ejecutar listeners automáticos en cuanto cargue el DOM
document.addEventListener("DOMContentLoaded", function() {
    const inputs = ['input-cantidad', 'input-precio', 'input-arancel'];
    inputs.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            // Cada vez que el usuario escriba o cambie un valor, se actualiza el mapa y la tabla
            elemento.addEventListener('input', calcularYRepintarMapa);
        }
    });

    // Forzar un cálculo inicial
    calcularYRepintarMapa();
});

// Función principal: Calcula costos, repinta polígonos de Leaflet y actualiza la tabla correlativa
function calcularYRepintarMapa() {
    // 1. Obtener los inputs del usuario
    const cantidad = parseFloat(document.getElementById('input-cantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('input-precio').value) || 0;
    const porcentajeArancel = (parseFloat(document.getElementById('input-arancel').value) || 0) / 100;

    // Si no hay valores lógicos, dejamos la tabla en cero y frenamos la ejecución del mapa
    if (cantidad === 0 || precioUnitario === 0) {
        limpiarTablaACero();
        return;
    }

    console.log("🔮 Simulando viabilidad comercial global en el mapa y la matriz...");

    // Variables para capturar los datos específicos del país seleccionado actual (si aplica)
    let datosTablaPaisActual = null;

    // Verificar si la capa de Leaflet existe antes de recorrerla
    if (typeof geojsonLayer !== 'undefined' && geojsonLayer) {
        
        // 2. Acceder a la capa del mapa Leaflet y actualizar sus estilos en tiempo real
        geojsonLayer.eachLayer(function(layer) {
            const props = layer.feature.properties || {};
            
            // Si el país no tiene datos de Python, lo dejamos gris
            if (!props.incertidumbre_global) {
                layer.setStyle({ fillColor: '#bdc3c7', fillOpacity: 0.4 });
                return;
            }

            // --- SIMULACIÓN INTERNA DE COSTOS EN CASCADA POR PAÍS ---
            const valorEXW = cantidad * precioUnitario;
            
            // Gastos estimados simulados por país basados en sus índices de Python
            const gastosOrigen = 200 + (props.riesgo_logistico * 300); 
            const valorFOB = valorEXW + gastosOrigen;
            
            // El seguro depende de la incertidumbre global del país
            const tasaSeguro = props.incertidumbre_global >= 0.70 ? 0.035 : (props.incertidumbre_global >= 0.40 ? 0.02 : 0.01);
            const valorSeguro = valorFOB * tasaSeguro;
            
            // Flete internacional base estimado por región geográfica o riesgo
            const fleteInternacional = 1500 + (props.riesgo_logistico * 2000); 
            const valorCIF = valorFOB + fleteInternacional + valorSeguro;

            // Impuestos
            const costoArancel = valorCIF * porcentajeArancel;
            const totalImpuestos = costoArancel + (valorCIF * 0.005) + ((valorCIF + costoArancel) * 0.15);

            // Imprevistos según el riesgo logístico de Python
            const tasaImprevistos = props.riesgo_logistico >= 0.70 ? 0.10 : (props.riesgo_logistico >= 0.40 ? 0.06 : 0.03);
            const fondoImprevistos = valorFOB * tasaImprevistos;

            // Costo Final DDP puesto en planta
            const valorDDP = valorCIF + totalImpuestos + fondoImprevistos + 300; // +300 flete local Quito
            const costoUnitarioFinal = valorDDP / quantity || valorDDP / cantidad;

            // --- MÉTRICA DE VIABILIDAD ("¿ME CONVIENE?") ---
            const incrementoCosto = (costoUnitarioFinal - precioUnitario) / precioUnitario;

            let colorConveniencia = '#198754'; // Verde: Muy conveniente
            let estadoConveniencia = 'Altamente Conveniente';

            if (incrementoCosto > 0.90 || props.incertidumbre_global >= 0.70) {
                colorConveniencia = '#dc3545'; // Rojo: Alto riesgo o muy caro
                estadoConveniencia = 'No Conveniente (Alto Costo/Riesgo)';
            } else if (incrementoCosto > 0.50 || props.incertidumbre_global >= 0.40) {
                colorConveniencia = '#ffc107'; // Amarillo: Advertencia/Margen ajustado
                estadoConveniencia = 'Moderadamente Conveniente';
            }

            // Guardamos este cálculo en el polígono para que se vea en el Popup al hacer clic
            layer.feature.properties.costo_simulado_unitario = costoUnitarioFinal;
            layer.feature.properties.conveniencia = estadoConveniencia;

            // SI ESTE ES EL PAÍS QUE EL USUARIO CLICKEÓ, GUARDAMOS SUS VALORES ADUANEROS PARA LA TABLA
            if (paisSeleccionadoParaDesglose && props.name === paisSeleccionadoParaDesglose) {
                datosTablaPaisActual = {
                    exw: valorEXW,
                    fob: valorFOB,
                    seguro: valorSeguro,
                    cif: valorCIF,
                    imprevistos: fondoImprevistos,
                    impuestos: totalImpuestos,
                    ddp: valorDDP,
                    unitario: costoUnitarioFinal
                };
            }

            // Cambiamos el color del país en el mapa inmediatamente
            layer.setStyle({
                fillColor: colorConveniencia,
                fillOpacity: 0.8,
                color: '#212529',
                weight: 1.5
            });

            // Actualizar el Popup del país para que muestre el costo calculado en vivo
            const nuevoPopup = `
                <div style="font-family: Arial, sans-serif; padding: 5px; min-width: 220px;">
                    <h6 style="margin: 0 0 8px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 4px;">
                        <strong>${props.name}</strong>
                    </h6>
                    <table style="width: 100%; font-size: 12px; color: #495057;">
                        <tr><td>💰 <b>Costo Unitario DDP:</b></td><td style="text-align: right; font-weight: bold; color: ${colorConveniencia};">$ ${costoUnitarioFinal.toFixed(2)}</td></tr>
                        <tr><td>📦 <b>Total Puesto en Quito:</b></td><td style="text-align: right;">$ ${valorDDP.toFixed(2)}</td></tr>
                        <tr style="border-top: 1px solid #dee2e6;">
                            <td style="padding-top: 5px;"><b>Resultado Evaluativo:</b></td>
                            <td style="text-align: right; padding-top: 5px; font-weight: bold; color: ${colorConveniencia};">${estadoConveniencia}</td>
                        </tr>
                    </table>
                </div>
            `;
            layer.bindPopup(nuevoPopup);
            
            // CONFIGURAR ESCUCHA DE CLIC EN EL MAPA PARA CAMBIAR EL PAÍS DE LA TABLA
            layer.off('click').on('click', function() {
                paisSeleccionadoParaDesglose = props.name;
                // Forzar reprocesamiento rápido para inyectar este país seleccionado en la tabla derecha
                calcularYRepintarMapa();
            });
        });
    }

    // 3. RENDERIZAR DATOS EN LA TABLA DEL DESGLOSE CORRELATIVO
    // Si hay un país seleccionado en el mapa, inyectamos sus costos simulados específicos
    if (datosTablaPaisActual) {
        actualizarCeldaHTML('res-exw', datosTablaPaisActual.exw);
        actualizarCeldaHTML('res-fob', datosTablaPaisActual.fob);
        actualizarCeldaHTML('res-seguro', datosTablaPaisActual.seguro);
        actualizarCeldaHTML('res-cif', datosTablaPaisActual.cif);
        actualizarCeldaHTML('res-imprevistos', datosTablaPaisActual.imprevistos);
        actualizarCeldaHTML('res-impuestos', datosTablaPaisActual.impuestos);
        actualizarCeldaHTML('res-ddp', datosTablaPaisActual.ddp);
        actualizarCeldaHTML('res-unitario', datosTablaPaisActual.unitario);
    } else {
        // Si no se ha clickeado ningún país en el mapa, hacemos una simulación estándar global para no dejar vacía la tabla
        const valorEXWGenerico = cantidad * precioUnitario;
        const valorFOBGenerico = valorEXWGenerico + 250;
        const seguroGenerico = valorFOBGenerico * 0.01;
        const fleteGenerico = valorEXWGenerico > 0 ? 1500 : 0;
        const cifGenerico = valorFOBGenerico + fleteGenerico + seguroGenerico;
        const arancelGenerico = cifGenerico * porcentajeArancel;
        const impuestosGenericos = arancelGenerico + (cifGenerico * 0.005) + ((cifGenerico + arancelGenerico) * 0.15);
        const imprevistosGenericos = cifGenerico * 0.03;
        const ddpGenerico = cifGenerico + impuestosGenericos + imprevistosGenericos + 300;
        const unitarioGenerico = cantidad > 0 ? (ddpGenerico / cantidad) : 0;

        actualizarCeldaHTML('res-exw', valorEXWGenerico);
        actualizarCeldaHTML('res-fob', valorFOBGenerico);
        actualizarCeldaHTML('res-seguro', seguroGenerico);
        actualizarCeldaHTML('res-cif', cifGenerico);
        actualizarCeldaHTML('res-imprevistos', imprevistosGenericos);
        actualizarCeldaHTML('res-impuestos', impuestosGenericos);
        actualizarCeldaHTML('res-ddp', ddpGenerico);
        actualizarCeldaHTML('res-unitario', unitarioGenerico);
    }
}

// Función para inyectar y dar formato de moneda estadounidense a los desgloses
function actualizarCeldaHTML(id, valor) {
    const celda = document.getElementById(id);
    if (celda) {
        celda.innerText = `$ ${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

// Resetea los indicadores visuales si el formulario está vacío
function limpiarTablaACero() {
    const ids = ['res-exw', 'res-fob', 'res-seguro', 'res-cif', 'res-imprevistos', 'res-impuestos', 'res-ddp', 'res-unitario'];
    ids.forEach(id => {
        const celda = document.getElementById(id);
        if (celda) celda.innerText = "$ 0.00";
    });
}
