export const isValidStatusTransition = (current, next) => {
  const currentStatus = current?.toUpperCase().trim();
  const nextStatus = next?.toUpperCase().trim();

  const allowedTransitions = {
    PENDING: ["CONFIRMED"],
    CONFIRMED: ["DESPACHADO"],
    DESPACHADO: [],
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
    DESPACHADO_DESPACHADO: "El pedido ya esta despachado",
    CONFIRMED_PENDING: "No se puede volver un pedido confirmado a pendiente",
    DESPACHADO_PENDING: "No se puede volver un pedido despachado a pendiente",
    DESPACHADO_CONFIRMED: "No se puede volver un pedido despachado a confirmado",
    PENDING_CANCELLED: "El estado cancelado no esta habilitado",
    PENDING_COMPLETED: "El estado completado no esta habilitado",
    CONFIRMED_CANCELLED: "El estado cancelado no esta habilitado",
    CONFIRMED_COMPLETED: "El estado completado no esta habilitado",
    DESPACHADO_CANCELLED: "El estado cancelado no esta habilitado",
    DESPACHADO_COMPLETED: "El estado completado no esta habilitado",
  };

  const key = `${currentStatus}_${nextStatus}`;
  return messages[key] || `No se puede cambiar el estado de ${currentStatus} a ${nextStatus}`;
};

