
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
      default: 0,
      min: 0
    },

    maxSelect: {
      type: Number,
      default: 1,
      min: 1
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
   PRODUCTOS INCLUIDOS
   Ejemplo: 1 pizza muzzarella
========================= */

const includedProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

/* =========================
   GRUPOS DE SELECCIÓN
   Ejemplo: elegir 6 empanadas
========================= */

const promoSelectionGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    // Cantidad exacta que debe seleccionar el cliente.
    requiredQuantity: {
      type: Number,
      required: true,
      min: 1
    },

    // Productos que puede elegir dentro de este grupo.
    allowedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ]
  },
  { _id: false }
);

/* =========================
   CONFIGURACIÓN DE PROMOCIÓN
========================= */

const promoConfigSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false
    },

    // Productos que vienen incluidos obligatoriamente.
    includedProducts: {
      type: [includedProductSchema],
      default: []
    },

    // Grupos donde el cliente puede elegir productos.
    selectionGroups: {
      type: [promoSelectionGroupSchema],
      default: []
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

    /* IMAGEN */

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

    modifiers: {
      type: [modifierSchema],
      default: []
    },

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
    },

    // Configuración de combos y promociones.
    promoConfig: {
      type: promoConfigSchema,
      default: () => ({
        enabled: false,
        includedProducts: [],
        selectionGroups: []
      })
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Product", productSchema);
