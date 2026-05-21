import {
    createOrderService,
    getUserOrdersService,
    getAllOrdersService,
    confirmOrderService,
    updateOrderStatusService,
    updateOrderAdminShippingService,
    getOrderByIdService,
    createWholesaleOrderFlow,
  } from "../services/orders.service.js";
 import { sendNewRetailOrderMail } from "../services/mailer.service.js";


 export const createOrder = async (req, res) => {
  try {
    const { type, items, shipping } = req.body;

    let order;

    if (type === "MAYORISTA") {

      order = await createWholesaleOrderFlow({
        user: req.user,
        items,
      });


    } else if (type === "MINORISTA") {

      order = await createOrderService({
        user: req.user,
        type,
        items,
        shipping,
      });
console.log("========= ORDER MINORISTA =========");
console.log(JSON.stringify(order, null, 2));
console.log("===================================");

      try {
        await sendNewRetailOrderMail(order);
      } catch (emailError) {
        console.error("Error al enviar email de pedido minorista:", emailError);
      }

    } else {
      return res.status(400).json({
        error: "Tipo de orden inválido. Debe ser MAYORISTA o MINORISTA",
      });
    }

    if (!order) {
      return res.status(500).json({
        error: "Error al crear la orden: orden no retornada"
      });
    }

    res.status(201).json(order);

  } catch (error) {
    console.error("Error en createOrder:", error);
    console.error("Stack trace:", error.stack);

    res.status(400).json({ 
      error: error.message || "Error al crear la orden",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};
  
  
  export const getMyOrders = async (req, res) => {
    try {
      const orders = await getUserOrdersService(req.user.id);
      res.json(orders);
    } catch (error) {
      console.error("[getMyOrders Error]", error);
      res.status(500).json({ error: error.message || "Error al obtener pedidos" });
    }
  };
  
export const getAllOrders = async (req, res) => {
    try {
      const {
        status,
        type,
        paymentStatus,
        page,
        limit,
        startDate,
        endDate,
        summary,
      } = req.query;
    
      const orders = await getAllOrdersService({
        status,
        type,
        paymentStatus,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        startDate,
        endDate,
        summary: summary === "true",
      });
    
      res.json(orders);
    } catch (error) {
      console.error("[getAllOrders Error]", error);
      res.status(500).json({ error: error.message || "Error al obtener pedidos" });
    }
  };
  
  
  
  export const confirmOrder = async (req, res) => {
    try {
      const order = await confirmOrderService(req.params.id);
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  export const cancelOrder = async (req, res) => {
    return res.status(400).json({
      error: "ORDER_CANCELLATION_DISABLED",
      message: "La cancelacion de pedidos esta deshabilitada. Solo se permiten estados PENDING y CONFIRMED.",
    });
  };
  

  export const updateOrderStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      console.log(`[updateOrderStatus] Intentando actualizar order ${id} a status ${status}`);

      const updated = await updateOrderStatusService({
        orderId: id,
        newStatus: status,
      });
  
      res.json(updated);
    } catch (error) {
      console.error("[updateOrderStatus Error]", error.message);
      res.status(400).json({ error: error.message });
    }
  };
  
  export const getOrderById = async (req, res) => {
    try {
      const order = await getOrderByIdService(req.params.id);
      res.json(order);
    } catch (error) {
      console.error("[getOrderById Error]", error);
      res.status(400).json({ error: error.message || "Error al obtener el pedido" });
    }
  };

  export const updateOrderAdminShipping = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        adminTrackingNumber,
        adminShippingCarrier,
        adminShippingNotes,
      } = req.body;

      const updatedOrder = await updateOrderAdminShippingService({
        orderId: id,
        adminTrackingNumber,
        adminShippingCarrier,
        adminShippingNotes,
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("[updateOrderAdminShipping Error]", error.message);
      res.status(400).json({ error: error.message || "Error al actualizar seguimiento" });
    }
  };
  
