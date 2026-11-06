
import mongoose from "mongoose";

/* ==========================================
   CLIENTE
========================================== */

const customerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      default: ""
    },

    address: {
      type: String,
      default: ""
    },

    notes: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

/* ==========================================
   MODIFICADORES SELECCIONADOS
========================================== */

const selectedModifierSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      required: true
    },

    option: {
      type: String,
      required: true
    },

    extraPrice: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

/* ==========================================
   PRODUCTOS ELEGIDOS EN UNA PROMOCIÓN
========================================== */

const promoSelectedProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "La cantidad debe ser un número entero."
      }
    }
  },
  { _id: false }
);

/* ==========================================
   GRUPOS DE SELECCIÓN DE UNA PROMOCIÓN
========================================== */

const promoSelectionSchema = new mongoose.Schema(
  {
    // Identifica a qué pack pertenece este grupo.
    // Ejemplo: pack 1, pack 2, pack 3.
    packIndex: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "El número de promoción debe ser entero."
      }
    },

    group: {
      type: String,
      required: true,
      trim: true
    },

    products: {
      type: [promoSelectedProductSchema],
      default: []
    }
  },
  { _id: false }
);

/* ==========================================
   PRODUCTOS FIJOS INCLUIDOS EN LA PROMOCIÓN
========================================== */

const promoIncludedProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "La cantidad debe ser un número entero."
      }
    }
  },
  { _id: false }
);

/* ==========================================
   PRODUCTOS DEL PEDIDO
========================================== */

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    // Nombre histórico del producto.
    title: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "La cantidad debe ser un número entero."
      }
    },

    // Precio unitario calculado por el backend.
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },

    modifiers: {
      type: [selectedModifierSchema],
      default: []
    },

    // Selecciones variables de cada pack de la promoción.
    promoSelections: {
      type: [promoSelectionSchema],
      default: []
    },

    // Productos fijos incluidos en la promoción.
    includedProducts: {
      type: [promoIncludedProductSchema],
      default: []
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

/* ==========================================
   PEDIDO
========================================== */

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },

    customer: {
      type: customerSchema,
      required: true
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "El pedido debe contener al menos un producto."
      }
    },

    /* TIPO DE ENTREGA */

    deliveryType: {
      type: String,
      enum: ["retiro", "delivery"],
      default: "retiro"
    },

    /* MÉTODO DE PAGO */

    paymentMethod: {
      type: String,
      enum: [
        "Efectivo",
        "Transferencia",
        "Tarjeta"
      ],
      default: "Efectivo"
    },

    /* ESTADO DEL PEDIDO */

    status: {
      type: String,
      enum: [
        "Pendiente",
        "Aceptado",
        "Preparando",
        "Listo",
        "En camino",
        "Entregado",
        "Cancelado"
      ],
      default: "Pendiente"
    },

    /* TOTAL CALCULADO POR EL BACKEND */

    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Order", orderSchema);
