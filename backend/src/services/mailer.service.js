import { Resend } from "resend";
import nodemailer from "nodemailer";

// Resend (producción)

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;


// Mailtrap (desarrollo)

const mailtrapTransporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

// Envío principal


export const sendNewWholesaleOrderMail = async (order) => {

  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    throw new Error("Orden inválida");
  }

  if (!process.env.ORDERS_EMAIL) {
    throw new Error("ORDERS_EMAIL no está configurada");
  }

  const userEmail = order.user?.email || order.email || "Sin email";
  const orderId = order.id || order._id || "N/A";
  const totalAmount = order.items.reduce((acc, i) => {
  return acc + Number(i.subtotal || 0);
  }, 0);

  const itemsRows = order.items.map(i => {
    const p = i.product || {};

    const codigo = p.codigoInterno || "-";
    const codigoProveedor = p.codigoProveedor || "-";
    const proveedor = p.proveedor || "-";
    const descripcion = p.descripcion || "-";
    const quantity = Number(i.quantity || 1);
    const subtotal = Number(i.subtotal || 0);

    return `
      <tr>
        <td>${codigo}</td>
        <td>${descripcion}</td>
        <td>${codigoProveedor}</td>
        <td>${proveedor}</td>
        <td align="center">${quantity}</td>
        <td align="right">$${subtotal.toLocaleString("es-AR")}</td>
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
          <th align="left">Código</th>
          <th align="left">Descripción</th>
          <th align="left">Codigo proveedor</th>
          <th align="left">Proveedor</th>
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

    <p>Estado: ${order.status || "PENDING"}</p>
  `;

  //  DESARROLLO → Mailtrap

  if (process.env.NODE_ENV === "development") {
    const info = await mailtrapTransporter.sendMail({
      from: '"Pedidos" <test@mailtrap.io>',
      to: process.env.ORDERS_EMAIL,
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
      from: "Pedidos <onboarding@resend.dev>", // mientras no tengas dominio
      to: [process.env.ORDERS_EMAIL],
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
