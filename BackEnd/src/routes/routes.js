import { Router } from "express";

import {
  /* =========================
     PRODUCTOS
  ========================= */
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,

  /* =========================
     CATEGORÍAS
  ========================= */
  createCategory,
  getCategories,
/* =========================
   PEDIDOS
========================= */
getOrders,
getOrderById,
createOrder,
updateOrderStatus,
} from "../controllers/controllers.js";

const router = Router();

/* ==================================================
   PRODUCTOS
================================================== */

/**
 * Obtener todos los productos
 */
router.get("/products", getProducts);

/**
 * Obtener un producto por ID
 */
router.get("/products/:id", getProductById);

/**
 * Crear producto
 */
router.post("/products", createProduct);

/**
 * Actualizar producto
 */
router.put("/products/:id", updateProduct);

/**
 * Eliminar producto
 */
router.delete("/products/:id", deleteProduct);

/* ==================================================
   CATEGORÍAS
================================================== */

/**
 * Obtener categorías
 */
router.get("/categories", getCategories);

/**
 * Crear categoría
 */
router.post("/categories", createCategory);

/* ==================================================
   PEDIDOS
================================================== */

/**
 * Obtener pedidos
 */
router.get(
  "/orders",
  getOrders
);

/**
 * Obtener pedido por ID
 */
router.get(
  "/orders/:id",
  getOrderById
);

/**
 * Crear pedido
 */
router.post(
  "/orders",
  createOrder
);

/**
 * Actualizar estado
 */
router.patch(
  "/orders/:id/status",
  updateOrderStatus
);



export default router;