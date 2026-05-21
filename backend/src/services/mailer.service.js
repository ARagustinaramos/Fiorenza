import { Resend } from "resend";
import nodemailer from "nodemailer";
import { getShippingLabel } from "../utils/shipping.utils.js";

// Resend (producción)

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;


// Mailtrap (desarrollo)

const mailtrapTransporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  secure: false,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

// Envío principal

export const sendNewWholesaleOrderMail = async (order) => {

  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    throw new Error("Orden inválida");
  }

  if (!process.env.ORDERS_EMAIL) {
    throw new Error("ORDERS_EMAIL no está configurada");
  }
await mailtrapTransporter.verify()
  .then(() => console.log("SMTP OK"))
  .catch(err => console.error("SMTP ERROR:", err));

  const userEmail = order.user?.email || order.email || "Sin email";
  const orderId = order.id || order._id || "N/A";
  const replyTo = userEmail.includes("@") ? userEmail : undefined;
  const totalAmount = order.items.reduce((acc, i) => {
  return acc + Number(i.subtotal || 0);
  }, 0);

  const itemsRows = order.items.map(i => {
    const p = i.product || {};

    const proveedor = p.proveedor || "-";
    const codigoProveedor = p.codigoProveedor || "-";
    const descripcion = p.descripcion || "-";
    const codigo = p.codigoInterno || "-";
    const quantity = Number(i.quantity || 1);

    return `
      <tr>
        <td>${proveedor}</td>
        <td>${codigoProveedor}</td>
        <td>${descripcion}</td>
        <td>${codigo}</td>
        <td align="center">${quantity}</td>
      </tr>
    `;
  }).join("");

  const htmlContent = `
    <h2>Nuevo pedido mayorista</h2>

    <p><strong>Cliente:</strong> ${userEmail}</p>
    <p><strong>Pedido Nº:</strong> ${orderId}</p>
    <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-AR")}</p>

    <table 
      border="1" 
      cellpadding="6" 
      cellspacing="0" 
      width="100%" 
      style="border-collapse: collapse; margin-top: 10px; font-family: Arial, sans-serif;"
    >
            <thead style="background:#f2f2f2;">
        <tr>
          <th align="left">Proveedor</th>
          <th align="left">Codigo proveedor</th>
          <th align="left">Descripcion</th>
          <th align="left">Codigo interno</th>
          <th align="center">Cantidad</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <h3 style="margin-top:15px;">
      Total: $${totalAmount.toLocaleString("es-AR")}
    </h3>

    <p>Estado: ${order.status || "PENDING"}</p>
  `;

  //  DESARROLLO → Mailtrap

  if (process.env.NODE_ENV === "development") {
    const info = await mailtrapTransporter.sendMail({
      from: '"Pedidos" <test@mailtrap.io>',
      to: process.env.ORDERS_EMAIL,
      replyTo,
      subject: `Nuevo pedido mayorista #${orderId}`,
      html: htmlContent
    });

    console.log("📧 Mail enviado por Mailtrap:", info.messageId);
    return info;
  }

  //  PRODUCCIÓN → Resend
 
  if (!resend) throw new Error("RESEND_API_KEY no está configurada");

  try {
    const result = await resend.emails.send({
      from: "Pedidos <pedidos@fiorenzarepuestos.com.ar>", 
      to: [process.env.ORDERS_EMAIL],
      replyTo,
      subject: `Nuevo pedido mayorista #${orderId}`,
      html: htmlContent
    });

    console.log("📧 Mail enviado por Resend:", result);
    return result;

  } catch (error) {
    console.error("❌ Error enviando mail:", error);
    throw error;
  }
};

export const sendNewRetailOrderMail = async (order) => {
  console.log("ENTRANDO A MAIL MINORISTA");
console.log("ORDER:", JSON.stringify(order, null, 2));
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MAILTRAP_HOST:", process.env.MAILTRAP_HOST);
console.log("MAILTRAP_PORT:", process.env.MAILTRAP_PORT);
console.log("MAILTRAP_USER:", process.env.MAILTRAP_USER);
console.log("MAILTRAP_PASS:", process.env.MAILTRAP_PASS ? "EXISTE" : "NO EXISTE");
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    throw new Error("Orden invalida");
  }

  if (!process.env.ORDERS_EMAIL) {
    throw new Error("ORDERS_EMAIL no esta configurada");
  }

  const userEmail = order.user?.email || order.email || "Sin email";
  const orderId = order.id || order._id || "N/A";
  const replyTo = userEmail.includes("@") ? userEmail : undefined;
  const totalAmount = order.items.reduce((acc, item) => {
    return acc + Number(item.subtotal || 0);
  }, 0);

  const itemsRows = order.items
    .map((item) => {
      const product = item.product || {};
      const descripcion = product.descripcion || "-";
      const codigo = product.codigoInterno || "-";
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPrice || 0);

      return `
        <tr>
          <td>${descripcion}</td>
          <td>${codigo}</td>
          <td align="center">${quantity}</td>
          <td align="right">$${unitPrice.toLocaleString("es-AR")}</td>
        </tr>
      `;
    })
    .join("");

  const customerName =
    order.shippingFullName ||
    order.user?.perfilMinorista?.nombreCompleto ||
    order.user?.perfil?.nombreCompleto ||
    userEmail;

  const shippingMethod = getShippingLabel(order.shippingMethod);
  const shippingZone = order.shippingZone
    ? getShippingLabel(order.shippingZone)
    : "No aplica";
  const shippingBoxSize = order.shippingBoxSize
    ? getShippingLabel(order.shippingBoxSize)
    : "No aplica";
  const shippingEstimatedCost = Number(order.shippingEstimatedCost || 0);
  const shippingReference = order.shippingReference || "Sin referencia";
  const shippingPhone =
    order.shippingPhone ||
    order.user?.perfilMinorista?.telefono ||
    "Sin telefono";
  const shippingAddress = order.shippingAddress || "Sin direccion";
  const shippingCity = order.shippingCity || "Sin ciudad";
  const shippingProvince = order.shippingProvince || "Sin provincia";
  const shippingPostalCode = order.shippingPostalCode || "Sin codigo postal";
  const shippingDni =
    order.user?.perfilMinorista?.dni ||
    order.shippingDni ||
    "Sin DNI";

  const htmlContent = `
    <h2>Nuevo pedido minorista</h2>
    <p><strong>Cliente:</strong> ${customerName}</p>
    <p><strong>Email:</strong> ${userEmail}</p>
    <p><strong>Pedido N:</strong> ${orderId}</p>
    <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-AR")}</p>

    <table
      border="1"
      cellpadding="6"
      cellspacing="0"
      width="100%"
      style="border-collapse: collapse; margin-top: 10px; font-family: Arial, sans-serif;"
    >
      <thead style="background:#f2f2f2;">
        <tr>
          <th align="left">Descripcion</th>
          <th align="left">Codigo interno</th>
          <th align="center">Cantidad</th>
          <th align="right">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <h3 style="margin-top:15px;">
      Total: $${totalAmount.toLocaleString("es-AR")}
    </h3>

    <h3 style="margin-top:20px;">Envio estimativo</h3>
    <p><strong>Metodo de envio:</strong> ${shippingMethod}</p>
    <p><strong>Zona:</strong> ${shippingZone}</p>
    <p><strong>Tamano de caja:</strong> ${shippingBoxSize}</p>
    <p><strong>Costo estimado mostrado:</strong> $${shippingEstimatedCost.toLocaleString("es-AR")}</p>
    <p style="margin-top:12px;"><strong>Datos de envio</strong></p>
    <p><strong>Nombre completo:</strong> ${customerName}</p>
    <p><strong>Telefono:</strong> ${shippingPhone}</p>
    <p><strong>DNI:</strong> ${shippingDni}</p>
    <p><strong>Direccion:</strong> ${shippingAddress}</p>
    <p><strong>Ciudad:</strong> ${shippingCity}</p>
    <p><strong>Provincia:</strong> ${shippingProvince}</p>
    <p><strong>Codigo postal:</strong> ${shippingPostalCode}</p>
    <p><strong>Referencia adicional:</strong> ${shippingReference}</p>
    <p><strong>Observaciones:</strong> ${order.observations || "Sin observaciones"}</p>
    <p style="font-size: 13px; color: #666; margin-top: 12px;">
      El costo de envio mostrado es estimativo. El valor final sera confirmado por el equipo luego de la compra segun dimensiones reales, destino final y transporte seleccionado.
    </p>

    <p>Estado: ${order.status || "PENDING"}</p>
  `;

  if (process.env.NODE_ENV === "development") {
    const info = await mailtrapTransporter.sendMail({
      from: '"Pedidos" <test@mailtrap.io>',
      to: process.env.ORDERS_EMAIL,
      replyTo,
      subject: `Nuevo pedido minorista #${orderId}`,
      html: htmlContent,
    });

    console.log("Mail minorista enviado por Mailtrap:", info.messageId);
    return info;
  }

  if (!resend) throw new Error("RESEND_API_KEY no esta configurada");

  try {
    const result = await resend.emails.send({
      from: "Pedidos <pedidos@fiorenzarepuestos.com.ar>",
      to: [process.env.ORDERS_EMAIL],
      replyTo,
      subject: `Nuevo pedido minorista #${orderId}`,
      html: htmlContent,
    });

    console.log("Mail minorista enviado por Resend:", result);
    return result;
  } catch (error) {
    consolconsole.error("ERROR COMPLETO MAIL MINORISTA:");
console.error(JSON.stringify(error, null, 2));
console.error(error);e.error("Error enviando mail minorista:", error);
    throw error;
  }
};
