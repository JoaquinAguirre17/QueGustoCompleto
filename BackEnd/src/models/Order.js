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
      default: 0
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

    title: {
      type: String,
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    unitPrice: {
      type: Number,
      required: true
    },

    modifiers: {
      type: [selectedModifierSchema],
      default: []
    },

    subtotal: {
      type: Number,
      required: true
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
      required: true
    },

    paymentMethod: {
      type: String,
      enum: [
        "Efectivo",
        "Transferencia",
        "Tarjeta"
      ],
      default: "Efectivo"
    },

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

    total: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Order", orderSchema);