export const isValidStatusTransition = (current, next) => {
  const currentStatus = current?.toUpperCase().trim();
  const nextStatus = next?.toUpperCase().trim();

  const allowedTransitions = {
    PENDING: ["CONFIRMED"],
    CONFIRMED: [],
  };

  const result = allowedTransitions[currentStatus]?.includes(nextStatus);
  return Boolean(result);
};

export const getStatusTransitionMessage = (current, next) => {
  const currentStatus = current?.toUpperCase().trim();
  const nextStatus = next?.toUpperCase().trim();

  const messages = {
    PENDING_PENDING: "El pedido ya esta pendiente",
    CONFIRMED_CONFIRMED: "El pedido ya esta confirmado",
    CONFIRMED_PENDING: "No se puede volver un pedido confirmado a pendiente",
    PENDING_CANCELLED: "El estado cancelado no esta habilitado",
    PENDING_COMPLETED: "El estado completado no esta habilitado",
    CONFIRMED_CANCELLED: "El estado cancelado no esta habilitado",
    CONFIRMED_COMPLETED: "El estado completado no esta habilitado",
  };

  const key = `${currentStatus}_${nextStatus}`;
  return messages[key] || `No se puede cambiar el estado de ${currentStatus} a ${nextStatus}`;
};

