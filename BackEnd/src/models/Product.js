import mongoose from "mongoose";

const modifierOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      default: 0,
      min: 0
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const modifierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["single", "multiple"],
      default: "single"
    },

    required: {
      type: Boolean,
      default: false
    },

    minSelect: {
      type: Number,
      default: 0
    },

    maxSelect: {
      type: Number,
      default: 1
    },

    options: [modifierOptionSchema]
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    /* =========================
       DATOS PRINCIPALES
    ========================= */

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    /* =========================
       PRECIOS
    ========================= */

    price: {
      type: Number,
      required: true,
      min: 0
    },

    cost: {
      type: Number,
      default: 0,
      min: 0
    },

    /* =========================
       IMAGEN
    ========================= */

    image: {
      type: String,
      default: ""
    },

    /* =========================
       STOCK
    ========================= */

    useStock: {
      type: Boolean,
      default: false
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    /* =========================
       MODIFICADORES
    ========================= */

    modifiers: [modifierSchema],

    /* =========================
       CONFIGURACIÓN
    ========================= */

    active: {
      type: Boolean,
      default: true
    },

    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Product", productSchema);