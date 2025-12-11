/**
 * Templates HTML profesionales para emails
 */

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Email al admin cuando se crea una nueva orden
 */
exports.newOrderAdminEmail = (sale) => {
  const products = sale.products
    .map((item, index) => {
      const productName = item.product?.name || "Producto";
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${
          index + 1
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${productName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${formatCurrency(
          item.priceAtSale
        )}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${formatCurrency(
          item.subtotal
        )}</td>
      </tr>
    `;
    })
    .join("");

  return {
    subject: `🔔 Nueva Orden #${sale._id
      .toString()
      .slice(-6)} - Pendiente de Confirmación`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🔔 Nueva Orden Recibida</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px;">Orden #${sale._id
                      .toString()
                      .slice(-6)}</p>
                  </td>
                </tr>

                <!-- Alert Box -->
                <tr>
                  <td style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      <strong>⚠️ Acción Requerida:</strong> Esta orden está pendiente de confirmación. Por favor revisa y confirma el pedido para descontar el stock.
                    </p>
                  </td>
                </tr>

                <!-- Customer Info -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">👤 Información del Cliente</h2>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>Nombre:</strong></td>
                        <td style="color: #333; font-size: 14px;">${
                          sale.user?.name || "N/A"
                        }</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>Email:</strong></td>
                        <td style="color: #333; font-size: 14px;">${
                          sale.user?.email || "N/A"
                        }</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>📱 Teléfono:</strong></td>
                        <td style="color: #333; font-size: 14px;">${
                          sale.user?.phone || "No proporcionado"
                        }</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>Fecha:</strong></td>
                        <td style="color: #333; font-size: 14px;">${
                          sale.user?.phone || "No proporcionado"
                        }</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>Fecha:</strong></td>
                        <td style="color: #333; font-size: 14px;">${formatDate(
                          sale.createdAt
                        )}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Products Table -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📦 Productos</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <thead>
                        <tr style="background-color: #f8f9fa;">
                          <th style="padding: 12px; text-align: left; color: #666; font-size: 14px; border-bottom: 2px solid #dee2e6;">#</th>
                          <th style="padding: 12px; text-align: left; color: #666; font-size: 14px; border-bottom: 2px solid #dee2e6;">Producto</th>
                          <th style="padding: 12px; text-align: center; color: #666; font-size: 14px; border-bottom: 2px solid #dee2e6;">Cant.</th>
                          <th style="padding: 12px; text-align: right; color: #666; font-size: 14px; border-bottom: 2px solid #dee2e6;">Precio</th>
                          <th style="padding: 12px; text-align: right; color: #666; font-size: 14px; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${products}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Order Details -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>💳 Método de Pago:</strong></td>
                        <td style="color: #333; font-size: 14px; text-align: right;">${
                          sale.paymentMethod
                        }</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>📍 Dirección de Envío:</strong></td>
                        <td style="color: #333; font-size: 14px; text-align: right;">${
                          sale.shippingAddress
                        }</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 16px; padding-top: 12px; border-top: 2px solid #dee2e6;"><strong>💰 TOTAL:</strong></td>
                        <td style="color: #667eea; font-size: 20px; font-weight: bold; text-align: right; padding-top: 12px; border-top: 2px solid #dee2e6;">${formatCurrency(
                          sale.totalPrice
                        )}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Action Button -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <a href="${
                      process.env.ADMIN_DASHBOARD_URL ||
                      "http://localhost:3000/admin"
                    }/orders/${sale._id}" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      ✅ Ver y Confirmar Pedido
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px; background-color: #f8f9fa; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #666; font-size: 12px;">
                      Este es un email automático del sistema de Odontools<br>
                      No responder a este correo
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

/**
 * Email al cliente cuando crea una orden
 */
exports.newOrderCustomerEmail = (sale) => {
  const products = sale.products
    .map((item, index) => {
      const productName = item.product?.name || "Producto";
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${
          index + 1
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${productName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${formatCurrency(
          item.subtotal
        )}</td>
      </tr>
    `;
    })
    .join("");

  const orderId = sale._id.toString().slice(-6);

  return {
    subject: `✅ Orden Recibida #${orderId} - Odontools`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">✅ ¡Orden Recibida!</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Orden #${orderId}</p>
                  </td>
                </tr>

                <!-- Success Message -->
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="margin: 0; color: #333; font-size: 18px; line-height: 1.6;">
                      Hola <strong>${sale.user?.name || "Cliente"}</strong>, 👋
                    </p>
                    <p style="margin: 15px 0 0 0; color: #666; font-size: 16px; line-height: 1.6;">
                      Hemos recibido tu orden y la estamos procesando.<br>
                      Te notificaremos cuando sea confirmada y enviada.
                    </p>
                  </td>
                </tr>

                <!-- Products Table -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📦 Resumen de tu Orden</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <thead>
                        <tr style="background-color: #f8f9fa;">
                          <th style="padding: 12px; text-align: left; color: #666; font-size: 14px; border-bottom: 2px solid #dee2e6;">#</th>
                          <th style="padding: 12px; text-align: left; color: #666; font-size: 14px; border-bottom: 2px solid #dee2e6;">Producto</th>
                          <th style="padding: 12px; text-align: center; color: #666; font-size: 14px; border-bottom: 2px solid #dee2e6;">Cantidad</th>
                          <th style="padding: 12px; text-align: right; color: #666; font-size: 14px; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${products}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Order Info -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>📍 Envío a:</strong></td>
                        <td style="color: #333; font-size: 14px; text-align: right;">${
                          sale.shippingAddress
                        }</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>💳 Método de pago:</strong></td>
                        <td style="color: #333; font-size: 14px; text-align: right;">${
                          sale.paymentMethod
                        }</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 16px; padding-top: 12px; border-top: 2px solid #dee2e6;"><strong>💰 TOTAL:</strong></td>
                        <td style="color: #667eea; font-size: 20px; font-weight: bold; text-align: right; padding-top: 12px; border-top: 2px solid #dee2e6;">${formatCurrency(
                          sale.totalPrice
                        )}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Contact Info -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background-color: #f0f7ff; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #667eea; font-size: 16px;">📞 ¿Dudas o cambios en tu pedido?</h3>
                      <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
                        <strong>📱 Teléfono:</strong> ${
                          process.env.ADMIN_PHONE || "Teléfono no disponible"
                        }<br>
                        <strong>📧 Email:</strong> ${
                          process.env.ADMIN_EMAIL || "admin@odontools.com"
                        }
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Next Steps -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 16px;">📋 Próximos Pasos:</h3>
                      <ol style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
                        <li>Revisaremos tu pedido</li>
                        <li>Confirmaremos tu orden</li>
                        <li>Prepararemos tu envío</li>
                        <li>Te notificaremos cuando esté en camino</li>
                      </ol>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px; background-color: #f8f9fa; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">
                      ¿Tienes alguna pregunta?
                    </p>
                    <p style="margin: 0; color: #666; font-size: 12px;">
                      Contáctanos: ${
                        process.env.ADMIN_EMAIL || "support@odontools.com"
                      }
                    </p>
                    <p style="margin: 15px 0 0 0; color: #999; font-size: 11px;">
                      © ${new Date().getFullYear()} Odontools. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

/**
 * Email al cliente cuando su orden es confirmada
 */
exports.orderConfirmedCustomerEmail = (sale) => {
  const orderId = sale._id.toString().slice(-6);

  return {
    subject: `🎉 Orden #${orderId} Confirmada - En Preparación`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎉 ¡Orden Confirmada!</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Orden #${orderId}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
                    <h2 style="margin: 0 0 15px 0; color: #333; font-size: 22px;">Tu pedido ha sido confirmado</h2>
                    <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                      Hola <strong>${
                        sale.user?.name || "Cliente"
                      }</strong>,<br><br>
                      ¡Excelentes noticias! Tu orden ha sido confirmada y estamos preparando tu envío.
                    </p>
                  </td>
                </tr>

                <!-- Status Bar -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background: linear-gradient(90deg, #11998e 0%, #11998e 33%, #e0e0e0 33%, #e0e0e0 100%); height: 8px; border-radius: 4px; margin-bottom: 10px;"></div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 33%; text-align: center; color: #11998e; font-size: 12px; font-weight: bold;">Confirmado ✓</td>
                        <td style="width: 34%; text-align: center; color: #999; font-size: 12px;">En Camino</td>
                        <td style="width: 33%; text-align: center; color: #999; font-size: 12px;">Entregado</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Order Total -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                      <tr>
                        <td style="color: #666; font-size: 16px;"><strong>💰 Total de tu orden:</strong></td>
                        <td style="color: #11998e; font-size: 22px; font-weight: bold; text-align: right;">${formatCurrency(
                          sale.totalPrice
                        )}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Next Steps -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #e65100; font-size: 16px;">📦 ¿Qué sigue?</h3>
                      <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.8;">
                        Estamos preparando tu pedido con mucho cuidado. Te enviaremos otra notificación cuando tu orden esté en camino con la información de seguimiento.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px; background-color: #f8f9fa; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">
                      ¡Gracias por tu compra! 💚
                    </p>
                    <p style="margin: 0; color: #999; font-size: 11px;">
                      © ${new Date().getFullYear()} Odontools. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

/**
 * Email al cliente cuando su orden es cancelada
 */
exports.orderCancelledCustomerEmail = (sale) => {
  const orderId = sale._id.toString().slice(-6);

  return {
    subject: `❌ Orden #${orderId} Cancelada - Odontools`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Orden Cancelada</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Orden #${orderId}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
                    <h2 style="margin: 0 0 15px 0; color: #333; font-size: 22px;">Tu orden ha sido cancelada</h2>
                    <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                      Hola <strong>${
                        sale.user?.name || "Cliente"
                      }</strong>,<br><br>
                      Lamentamos informarte que tu orden #${orderId} ha sido cancelada.
                    </p>
                  </td>
                </tr>

                <!-- Info Box -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background-color: #ffebee; border-left: 4px solid #e74c3c; padding: 20px; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #c0392b; font-size: 16px;">💰 Información de Reembolso</h3>
                      <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.8;">
                        Si ya realizaste el pago, te contactaremos pronto para procesar tu reembolso. 
                        El tiempo de procesamiento puede variar según tu método de pago.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Contact -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.8;">
                      ¿Tienes alguna duda sobre la cancelación?<br>
                      No dudes en contactarnos: <strong>${
                        process.env.ADMIN_EMAIL || "support@odontools.com"
                      }</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px; background-color: #f8f9fa; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #999; font-size: 11px;">
                      © ${new Date().getFullYear()} Odontools. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

/**
 * Email al cliente cuando su orden es enviada
 */
exports.orderShippedCustomerEmail = (sale) => {
  const orderId = sale._id.toString().slice(-6);

  return {
    subject: `🚚 Orden #${orderId} Enviada - Ya va en camino`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🚚 ¡Tu pedido va en camino!</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Orden #${orderId}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 20px;">📦</div>
                    <h2 style="margin: 0 0 15px 0; color: #333; font-size: 22px;">Tu orden ha sido enviada</h2>
                    <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                      Hola <strong>${
                        sale.user?.name || "Cliente"
                      }</strong>,<br><br>
                      ¡Buenas noticias! Tu pedido ya está en camino a la dirección indicada.
                    </p>
                  </td>
                </tr>

                <!-- Status Bar -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background: linear-gradient(90deg, #3498db 0%, #3498db 66%, #e0e0e0 66%, #e0e0e0 100%); height: 8px; border-radius: 4px; margin-bottom: 10px;"></div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 33%; text-align: center; color: #3498db; font-size: 12px; font-weight: bold;">Confirmado ✓</td>
                        <td style="width: 34%; text-align: center; color: #3498db; font-size: 12px; font-weight: bold;">En Camino ✓</td>
                        <td style="width: 33%; text-align: center; color: #999; font-size: 12px;">Entregado</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Shipping Info -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>📍 Dirección de entrega:</strong></td>
                      </tr>
                      <tr>
                        <td style="color: #333; font-size: 16px;">${
                          sale.shippingAddress
                        }</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Timeline -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background-color: #e3f2fd; border-left: 4px solid #3498db; padding: 20px; border-radius: 4px;">
                      <h3 style="margin: 0 0 15px 0; color: #2980b9; font-size: 16px;">⏱️ Tiempo estimado de entrega</h3>
                      <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.8;">
                        Tu pedido debería llegar en los próximos <strong>3-5 días hábiles</strong>.<br>
                        Te enviaremos otra notificación cuando sea entregado.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Total -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                      <tr>
                        <td style="color: #666; font-size: 16px;"><strong>💰 Total pagado:</strong></td>
                        <td style="color: #3498db; font-size: 22px; font-weight: bold; text-align: right;">${formatCurrency(
                          sale.totalPrice
                        )}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px; background-color: #f8f9fa; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">
                      ¿Alguna pregunta? Estamos aquí para ayudarte 💙
                    </p>
                    <p style="margin: 0; color: #666; font-size: 12px;">
                      Contacto: ${
                        process.env.ADMIN_EMAIL || "support@odontools.com"
                      }
                    </p>
                    <p style="margin: 15px 0 0 0; color: #999; font-size: 11px;">
                      © ${new Date().getFullYear()} Odontools. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

/**
 * Email al cliente cuando su orden es entregada
 */
exports.orderDeliveredCustomerEmail = (sale) => {
  const orderId = sale._id.toString().slice(-6);

  return {
    subject: `✅ Orden #${orderId} Entregada - ¡Gracias por tu compra!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎉 ¡Entregado con éxito!</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Orden #${orderId}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 20px;">🎁</div>
                    <h2 style="margin: 0 0 15px 0; color: #333; font-size: 22px;">Tu pedido ha sido entregado</h2>
                    <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">
                      Hola <strong>${
                        sale.user?.name || "Cliente"
                      }</strong>,<br><br>
                      ¡Esperamos que disfrutes tu compra! Tu orden ha sido entregada exitosamente.
                    </p>
                  </td>
                </tr>

                <!-- Status Bar Complete -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background: linear-gradient(90deg, #27ae60 0%, #27ae60 100%); height: 8px; border-radius: 4px; margin-bottom: 10px;"></div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 33%; text-align: center; color: #27ae60; font-size: 12px; font-weight: bold;">Confirmado ✓</td>
                        <td style="width: 34%; text-align: center; color: #27ae60; font-size: 12px; font-weight: bold;">En Camino ✓</td>
                        <td style="width: 33%; text-align: center; color: #27ae60; font-size: 12px; font-weight: bold;">Entregado ✓</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Thank You Message -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background-color: #d5f4e6; border-left: 4px solid #27ae60; padding: 20px; border-radius: 4px; text-align: center;">
                      <h3 style="margin: 0 0 10px 0; color: #229954; font-size: 18px;">💚 ¡Gracias por tu compra!</h3>
                      <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.8;">
                        Tu confianza es muy importante para nosotros.<br>
                        Esperamos verte pronto de nuevo.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Order Summary -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>📦 Orden:</strong></td>
                        <td style="color: #333; font-size: 14px; text-align: right;">#${orderId}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 14px;"><strong>📍 Entregado en:</strong></td>
                        <td style="color: #333; font-size: 14px; text-align: right;">${
                          sale.shippingAddress
                        }</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-size: 16px; padding-top: 10px; border-top: 2px solid #dee2e6;"><strong>💰 Total:</strong></td>
                        <td style="color: #27ae60; font-size: 20px; font-weight: bold; text-align: right; padding-top: 10px; border-top: 2px solid #dee2e6;">${formatCurrency(
                          sale.totalPrice
                        )}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Feedback Request -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <div style="background-color: #fff9e6; padding: 20px; border-radius: 6px;">
                      <p style="margin: 0 0 15px 0; color: #333; font-size: 14px;">
                        ⭐ ¿Qué te pareció tu experiencia?
                      </p>
                      <p style="margin: 0; color: #666; font-size: 13px;">
                        Tu opinión nos ayuda a mejorar cada día
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px; background-color: #f8f9fa; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">
                      ¿Necesitas ayuda con tu orden?
                    </p>
                    <p style="margin: 0; color: #666; font-size: 12px;">
                      Contáctanos: ${
                        process.env.ADMIN_EMAIL || "support@odontools.com"
                      }
                    </p>
                    <p style="margin: 15px 0 0 0; color: #999; font-size: 11px;">
                      © ${new Date().getFullYear()} Odontools. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};
