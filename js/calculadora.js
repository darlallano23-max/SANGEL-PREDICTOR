// Variable global para capturar la última simulación activa
let ultimaCargaDatosGeojson = null;

function calcularYRepintarMapa() {
    // 1. Obtener parámetros del formulario
    const flujo = document.getElementById('input-flujo').value;
    const cantidad = parseFloat(document.getElementById('input-cantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('input-precio').value) || 0;
    const porcentajeArancel = (parseFloat(document.getElementById('input-arancel').value) || 0) / 100;

    // Ajustar etiquetas dinámicamente según el flujo de Negocios Internacionales
    if (flujo === "exportacion") {
        document.getElementById('label-precio').innerText = "💰 Costo de Producción Unitario (Ecuador):";
        document.getElementById('label-arancel').innerText = "📈 Arancel de Entrada en Destino:";
    } else {
        document.getElementById('label-precio').innerText = "💰 Precio Unitario en Fábrica (EXW):";
        document.getElementById('label-arancel').innerText = "📈 Porcentaje de Arancel Estimado:";
    }

    if (cantidad === 0 || precioUnitario === 0) return;

    // --- VARIABLES DE DESGLOSE PARA LA TABLA REFERENCIAL ---
    let totalEXW = cantidad * precioUnitario;
    let totalFOB = 0, totalSeguro = 0, totalCIF = 0, totalImprevistos = 0, totalImpuestos = 0, totalDDP = 0;
    
    // Tasas estándar promedio globales para rellenar la tabla referencial antes de dar clic a un país
    let tSeguroRef = 0.02;
    let tImprevistosRef = 0.05;

    // 2. Ejecutar Cálculos Matemáticos según el Flujo Comercial
    if (flujo === "importacion") {
        totalFOB = totalEXW + 350; // + Gastos origen fijos estimados
        totalSeguro = totalFOB * tSeguroRef;
        totalCIF = totalFOB + 1800 + totalSeguro; // + Flete marítimo estimado promedio
        totalImpuestos = (totalCIF * porcentajeArancel) + (totalCIF * 0.005) + ((totalCIF * 1.15) * 0.15); // Arancel + Fodinfa + IVA 15%
        totalImprevistos = totalFOB * tImprevistosRef;
        totalDDP = totalCIF + totalImpuestos + totalImprevistos + 250; // + Transporte local Quito
    } else {
        // FLUJO DE EXPORTACIÓN (Ecuador hacia el mundo)
        totalFOB = totalEXW + 450; // Costo Ex-Works + Logística local de salida en Guayaquil/Manta
        totalSeguro = totalFOB * tSeguroRef;
        totalCIF = totalFOB + 2200 + totalSeguro; // Flete internacional de salida
        totalImprevistos = totalFOB * (tImprevistosRef * 1.5); // Riesgo de rechazo en aduana destino
        totalImpuestos = totalCIF * porcentajeArancel; // Arancel aduanero del país comprador
        totalDDP = totalCIF + totalImpuestos + totalImprevistos; // Costo total para que tu cliente reciba allá
    }

    // 3. Renderizar valores inmediatos en la tabla de desglose (Evita el problema del cero)
    document.getElementById('res-exw').innerText = `$ ${totalEXW.toFixed(2)}`;
    document.getElementById('res-fob').innerText = `$ ${totalFOB.toFixed(2)}`;
    document.getElementById('res-seguro').innerText = `$ ${totalSeguro.toFixed(2)} (${(tSeguroRef * 100).toFixed(1)}%)`;
    document.getElementById('res-cif').innerText = `$ ${totalCIF.toFixed(2)}`;
    document.getElementById('res-imprevistos').innerText = `$ ${totalImprevistos.toFixed(2)} (${(tImprevistosRef * 100).toFixed(0)}%)`;
    document.getElementById('res-impuestos').innerText = `$ ${totalImpuestos.toFixed(2)}`;
    document.getElementById('res-ddp').innerText = `$ ${totalDDP.toFixed(2)}`;
    document.getElementById('res-unitario').innerText = `$ ${(totalDDP / cantidad).toFixed(2)}`;

    // 4. Repintar las capas espaciales de Leaflet si el mapa ya cargó datos
    if (typeof geojsonLayer !== 'undefined' && geojsonLayer) {
        geojsonLayer.eachLayer(function(layer) {
            const props = layer.feature.properties || {};
            if (!props.incertidumbre_global) return;

            // Ajustar riesgos individuales inyectados desde Python
            const rLogistico = props.riesgo_logistico || 0.3;
            const rMacro = props.incertidumbre_global || 0.3;

            let seguroPais = totalFOB * (rMacro >= 0.7 ? 0.035 : (rMacro >= 0.4 ? 0.02 : 0.01));
            let imprevistosPais = totalFOB * (rLogistico >= 0.7 ? 0.10 : (rLogistico >= 0.4 ? 0.06 : 0.03));
            let fletePais = 1500 + (rLogistico * 2500);

            let cifPais = totalFOB + fletePais + seguroPais;
            let impPais = flujo === "importacion" 
                ? (cifPais * porcentajeArancel) + (cifPais * 0.005) + ((cifPais) * 0.15)
                : cifPais * porcentajeArancel;

            let ddpPais = cifPais + impPais + imprevistosPais;
            let unitarioPais = ddpPais / cantidad;

            // Lógica de Semáforo Predictivo ("¿Qué tanto nos afecta el costo logístico de la ruta?")
            let margenVariacion = (unitarioPais - precioUnitario) / precioUnitario;
            let colorConveniencia = '#198754'; // Verde por defecto
            let estado = 'Óptimo / Rentable';

            if (flujo === "importacion") {
                if (margenVariacion > 0.85 || rMacro >= 0.7) { colorConveniencia = '#dc3545'; estado = 'Crítico / No Conveniente'; }
                else if (margenVariacion > 0.45 || rMacro >= 0.4) { colorConveniencia = '#ffc107'; estado = 'Alerta / Margen Reducido'; }
            } else {
                // Al exportar, la inestabilidad del destino (Riesgo alto) penaliza fuertemente la viabilidad
                if (rMacro >= 0.65 || rLogistico >= 0.7) { colorConveniencia = '#dc3545'; estado = 'Mercado Destino de Alto Riesgo'; }
                else if (rMacro >= 0.4 || rLogistico >= 0.4) { colorConveniencia = '#ffc107'; estado = 'Mercado Destino Moderado'; }
            }

            // Cambiar el color en el mapa de inmediato
            layer.setStyle({ fillColor: colorConveniencia, fillOpacity: 0.75 });

            // Actualizar Popups con enfoque dual Importación / Exportación
            layer.bindPopup(`
                <div style="font-family: Arial, sans-serif; padding: 5px; min-width: 220px;">
                    <h6 style="margin: 0 0 8px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 4px; font-weight: bold;">
                        ${props.name} (${flujo.toUpperCase()})
                    </h6>
                    <table style="width: 100%; font-size: 12px; color: #495057;">
                        <tr><td>💰 <b>Costo Unitario Proyectado:</b></td><td style="text-align: right; font-weight: bold; color: ${colorConveniencia};">$ ${unitarioPais.toFixed(2)}</td></tr>
                        <tr><td>⚓ <b>Flete Marítimo Ruta:</b></td><td style="text-align: right;">$ ${fletePais.toFixed(0)}</td></tr>
                        <tr style="border-top: 1px solid #dee2e6;">
                            <td style="padding-top: 5px;"><b>Análisis de Viabilidad:</b></td>
                            <td style="text-align: right; padding-top: 5px; font-weight: bold; color: ${colorConveniencia};">${estado}</td>
                        </tr>
                    </table>
                </div>
            `);
        });
    }
}

// Ejecutar automáticamente al cargar el script para que no empiece en cero
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(calcularYRepintarMapa, 800); 
});
