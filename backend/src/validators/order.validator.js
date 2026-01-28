export const validateOrderInput = ({ type, items }) => {
    const errors = [];
  
    if (!type || !["MAYORISTA", "MINORISTA"].includes(type)) {
      errors.push("INVALID_ORDER_TYPE");
    }
  
    if (!Array.isArray(items) || items.length === 0) {
      errors.push("ITEMS_REQUIRED");
      return errors;
    }
  
    items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`ITEM_${index}_PRODUCT_ID_REQUIRED`);
      }
  
      if (
        typeof item.quantity !== "number" ||
        item.quantity <= 0 ||
        !Number.isInteger(item.quantity)
      ) {
        errors.push(`ITEM_${index}_INVALID_QUANTITY`);
      }
    });
  
    return errors;
  };
  