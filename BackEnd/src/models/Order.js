import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        /* =========================
           NÚMERO DE ORDEN
        ========================= */

        orderNumber: {
            type: String,
            required: true,
            unique: true
        },

        /* =========================
           CLIENTE
        ========================= */

        customer: {
            firstName: {
                type: String,
                required: true
            },

            lastName: {
                type: String,
                required: true
            }
        },

        /* =========================
           PRODUCTOS
        ========================= */

        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product"
                },

                title: String,

                price: Number,

                qty: Number,

                subtotal: Number
            }
        ],

        /* =========================
           TOTALES
        ========================= */

        total: {
            type: Number,
            required: true
        },

        /* =========================
           PAGO
        ========================= */

        paymentMethod: {
            type: String,

            enum: [
                "cash",
                "transfer"
            ],

            default: "cash"
        },

        /* =========================
           ESTADO
        ========================= */

        status: {
            type: String,
            enum: ["preparando", "listo", "entregado", "cancelado"],
            default: "preparando"
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "Order",
    orderSchema
);