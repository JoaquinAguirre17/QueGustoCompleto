import mongoose from "mongoose";

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
      required: true
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
      default: 0
    },

    /* =========================
       IMAGEN
    ========================= */
    image: {
      type: String,
      default: ""
    },

    /* =========================
       STOCK (solo bebidas)
    ========================= */
    stock: {
      type: Number,
      default: 0
    },

    useStock: {
      type: Boolean,
      default: false // solo bebidas true
    },

    /* =========================
       MODIFICADORES (GUARNICIONES, EXTRAS, ETC)
    ========================= */
    modifiers: [
      {
        name: {
          type: String, // "Guarnición"
          required: true
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

        options: [
          {
            label: String,  // "Puré"
            price: {
              type: Number,
              default: 0
            }
          }
        ]
      }
    ],

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