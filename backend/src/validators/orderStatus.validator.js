export const isValidStatusTransition = (current, next) => {
    // Normalizar a mayúsculas por si acaso
    const currentStatus = current?.toUpperCase().trim();
    const nextStatus = next?.toUpperCase().trim();
    
    const allowedTransitions = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
    };
  
    console.log(`[isValidStatusTransition] Validando: ${currentStatus} -> ${nextStatus}`);
    console.log(`[isValidStatusTransition] Transiciones permitidas desde ${currentStatus}:`, allowedTransitions[currentStatus]);
    
    const result = allowedTransitions[currentStatus]?.includes(nextStatus);
    console.log(`[isValidStatusTransition] Resultado:`, result);
    
    return result;
  };

export const getStatusTransitionMessage = (current, next) => {
  const currentStatus = current?.toUpperCase().trim();
  const nextStatus = next?.toUpperCase().trim();

  // Mensajes personalizados por transición inválida
  const messages = {
    "PENDING_COMPLETED": "El pedido debe ser confirmado primero antes de marcarlo como completado",
    "PENDING_PROCESSING": "El pedido debe ser confirmado primero",
    "COMPLETED_PENDING": "No se puede revertir un pedido completado",
    "COMPLETED_CONFIRMED": "No se puede revertir un pedido completado",
    "CANCELLED_PENDING": "No se puede revertir un pedido cancelado",
    "CANCELLED_CONFIRMED": "No se puede revertir un pedido cancelado",
  };

  const key = `${currentStatus}_${nextStatus}`;
  return messages[key] || `No se puede cambiar el estado de ${currentStatus} a ${nextStatus}`;
};
  