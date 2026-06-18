function calcularYRepintarMapa() {
    // 1. Obtener los inputs del usuario
    const cantidad = parseFloat(document.getElementById('input-cantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('input-precio').value) || 0;
    const porcentajeArancel = (parseFloat(document.getElementById('input-arancel').value) || 0) / 100;

    if (cantidad === 0 || precioUnitario === 0) return;

    console.log("🔮 Simulando viabilidad comercial global en el mapa...");

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
        const costoUnitarioFinal = valorDDP / cantidad;

        // --- MÉTRICA DE VIABILIDAD ("¿ME CONVIENE?") ---
        // Si el costo final unitario se eleva más del 60% del precio de fábrica debido al riesgo y flete, no conviene.
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
    });
}
