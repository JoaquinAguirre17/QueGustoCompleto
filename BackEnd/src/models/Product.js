
import mongoose from "mongoose";

/* =========================
   OPCIONES DE MODIFICADORES
========================= */

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

/* =========================
   MODIFICADORES
========================= */

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

/* =========================
   IMAGEN LOCAL
========================= */

const imageSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      required: true
    },

    contentType: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

/* =========================
   PRODUCTO
========================= */

const productSchema = new mongoose.Schema(
  {
    /* DATOS PRINCIPALES */

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

    /* PRECIOS */

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

    /* IMAGEN ALMACENADA EN MONGODB */

    image: {
      type: imageSchema,
      default: null
    },

    /* STOCK */

    useStock: {
      type: Boolean,
      default: false
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    /* MODIFICADORES */

    modifiers: [modifierSchema],

    /* CONFIGURACIÓN */

    active: {
      type: Boolean,
      default: true
    },

    featured: {
      type: Boolean,
      default: false
    },

    /* PROMOCIONES */

    isPromo: {
      type: Boolean,
      default: false
    },

    promoPrice: {
      type: Number,
      default: null,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Product", productSchema);
