
import { Router } from "express";
import multer from "multer";

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
  getProductImage,

} from "../controllers/controllers.js";

const router = Router();

/* ==================================================
   CONFIGURACIÓN DE MULTER
   Imágenes almacenadas en memoria para MongoDB
================================================== */

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  // Límite máximo de imagen: 5 MB
  limits: {
    fileSize: 5 * 1024 * 1024
  },

  // Permitir solamente imágenes
  fileFilter: (req, file, cb) => {

    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new Error("Solo se permiten archivos de imagen")
      );
    }

    cb(null, true);
  }
});


/* ==================================================
   PRODUCTOS
================================================== */

/**
 * Obtener todos los productos
 */
router.get(
  "/products",
  getProducts
);

/**
 * Obtener un producto por ID
 */
router.get(
  "/products/:id",
  getProductById
);
/**
 * Obtener imagen local del producto
 */
router.get(
  "/products/:id/image",
  getProductImage
);

/**
 * Crear producto con imagen local
 */
router.post(
  "/products",
  upload.single("image"),
  createProduct
);

/**
 * Actualizar producto
 * La imagen es opcional.
 * Si no se envía una nueva, conserva la anterior.
 */
router.put(
  "/products/:id",
  upload.single("image"),
  updateProduct
);

/**
 * Eliminar producto
 */
router.delete(
  "/products/:id",
  deleteProduct
);


/* ==================================================
   CATEGORÍAS
================================================== */

/**
 * Obtener categorías
 */
router.get(
  "/categories",
  getCategories
);

/**
 * Crear categoría
 */
router.post(
  "/categories",
  createCategory
);


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
