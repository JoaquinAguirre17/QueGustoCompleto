import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
/* ==================================================
                    PRODUCTOS
================================================== */
/*=======================================================
 * Obtener todos los productos
 =======================================================*/
export const getProducts = async (req, res) => {
  try {
    console.log("🔥 Entrando a getProducts");

    const products = await Product.find();

    console.log("🔥 Productos:", products);

    return res.json(products);

  } catch (error) {
    console.log("💥 ERROR REAL:", error);

    return res.status(500).json({
      success: false,
      message: "Error obteniendo productos"
    });
  }
};

/*=======================================================
 * Obtener producto por ID
 ======================================================*/
export const getProductById = async (req, res) => {
  try {

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    res.status(200).json(product);

  } catch (error) {
    console.error("Error obteniendo producto:", error);

    res.status(500).json({
      success: false,
      message: "Error obteniendo producto"
    });
  }
};

/*==================================================
 * Crear producto
 =================================================*/
export const createProduct = async (req, res) => {
  try {

    const {
      title,
      description,
      category,
      price,
      cost,
      image,
      stock,
      useStock,
      modifiers,
      featured,
      active
    } = req.body;

    const product = await Product.create({
      title,
      description,
      category,
      price,
      cost,
      image,
      stock,
      useStock,
      modifiers: modifiers || [],
      featured,
      active
    });

    res.status(201).json({
      success: true,
      product
    });

  } catch (error) {

    console.error("Error creando producto:", error);

    res.status(500).json({
      success: false,
      message: "Error creando producto"
    });

  }
};

/*============================================
 * Actualizar producto
 =============================================*/
export const updateProduct = async (req, res) => {

  try {

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set:req.body
      },
      {
        new:true,
        runValidators:true
      }
    );


    if(!product){

      return res.status(404).json({
        success:false,
        message:"Producto no encontrado"
      });

    }


    res.status(200).json({
      success:true,
      product
    });


  } catch(error){

    console.error(
      "Error actualizando producto:",
      error
    );


    res.status(500).json({
      success:false,
      message:"Error actualizando producto"
    });

  }

};

/*================================================
 * Eliminar producto
 *==============================================*/
export const deleteProduct = async (req, res) => {
  try {

    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Producto eliminado correctamente"
    });

  } catch (error) {
    console.error("Error eliminando producto:", error);

    res.status(500).json({
      success: false,
      message: "Error eliminando producto"
    });
  }
};

/* ==================================================
                    CATEGORÍAS
================================================== */

/*===================================================
  obtener todas las categorías
 ===================================================*/
export const getCategories = async (req, res) => {
  try {

    const categories =
      await Category.find().sort({
        order: 1
      });

    res.status(200).json(categories);

  } catch (error) {
    console.error("Error obteniendo categorías:", error);

    res.status(500).json({
      success: false,
      message: "Error obteniendo categorías"
    });
  }
};

/*=================================================
  Crear categoría
 =================================================*/
export const createCategory = async (req, res) => {
  try {

    const {
      name,
      icon,
      order
    } = req.body;

    const category =
      await Category.create({
        name,
        icon,
        order
      });

    res.status(201).json({
      success: true,
      category
    });

  } catch (error) {
    console.error("Error creando categoría:", error);

    res.status(500).json({
      success: false,
      message: "Error creando categoría"
    });
  }
};
/*=======================================================
  Obtener todos los pedidos
 ==============================================*/
export const getOrders = async (
  req,
  res
) => {
  try {

    const orders =
      await Order.find()
        .sort({
          createdAt: -1
        });

    res.status(200).json(orders);

  } catch (error) {

    console.error(
      "Error obteniendo pedidos:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Error obteniendo pedidos"
    });
  }
};
/*=================================================
  Obtener pedido por ID
 =================================================*/
export const getOrderById = async (
  req,
  res
) => {
  try {

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    res.status(200).json(order);

  } catch (error) {

    console.error(
      "Error obteniendo pedido:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Error obteniendo pedido"
    });
  }
};

/* ==================================================
   CREAR PEDIDO (TIEMPO REAL + NÚMERO AUTOMÁTICO)
================================================== */
export const createOrder = async (req, res) => {

  try {

    const io = req.app.get("io");

    const {
      customer,
      items,
      paymentMethod
    } = req.body;


    /* =========================
       VALIDACIONES BÁSICAS
    ========================= */

    if (!customer?.firstName || !customer?.lastName) {

      return res.status(400).json({
        success:false,
        message:"Falta nombre del cliente"
      });

    }


    if (!items || items.length === 0) {

      return res.status(400).json({
        success:false,
        message:"El pedido no tiene productos"
      });

    }



    let orderItems = [];
    let total = 0;



    /* =========================
       PROCESAR PRODUCTOS
    ========================= */

    for (const item of items) {


      const product = await Product.findById(
        item.product
      );


      if (!product) {

        return res.status(404).json({
          success:false,
          message:"Producto no encontrado"
        });

      }



      let subtotal = product.price;


      let selectedModifiers = [];



      /* =========================
         VALIDAR MODIFICADORES
      ========================= */


      if (product.modifiers?.length) {


        for (const modifier of product.modifiers) {


          const selected =
            item.modifiers?.filter(
              m => m.group === modifier.name
            ) || [];



          // obligatorio
          if (
            modifier.required &&
            selected.length === 0
          ) {

            return res.status(400).json({

              success:false,

              message:
              `Debe seleccionar ${modifier.name}`

            });

          }



          // cantidad mínima

          if (
            selected.length < modifier.minSelect
          ) {

            return res.status(400).json({

              success:false,

              message:
              `Debe elegir mínimo ${modifier.minSelect} opciones de ${modifier.name}`

            });

          }



          // cantidad máxima

          if (
            selected.length > modifier.maxSelect
          ) {

            return res.status(400).json({

              success:false,

              message:
              `Superó el máximo permitido en ${modifier.name}`

            });

          }



          for (const choice of selected) {


            const option =
              modifier.options.find(
                o =>
                o.label === choice.option
              );



            if (!option) {

              return res.status(400).json({

                success:false,

                message:
                `Opción inválida: ${choice.option}`

              });

            }



            subtotal += option.price;



            selectedModifiers.push({

              group: modifier.name,

              option: option.label,

              extraPrice: option.price

            });


          }


        }


      }



      subtotal =
      subtotal * item.quantity;



      total += subtotal;



      orderItems.push({

        product: product._id,

        title: product.title,

        quantity:item.quantity,

        unitPrice:product.price,

        modifiers:selectedModifiers,

        subtotal

      });



    }



    /* =========================
       GENERAR NÚMERO PEDIDO
    ========================= */


    const counter =
    await Counter.findOneAndUpdate(

      {
        name:"orders"
      },

      {
        $inc:{
          value:1
        }
      },

      {
        new:true,
        upsert:true
      }

    );



    const orderNumber =
    `QG-${String(counter.value).padStart(6,"0")}`;



    /* =========================
       CREAR PEDIDO
    ========================= */


    const order =
    await Order.create({

      customer,

      items:orderItems,

      total,

      paymentMethod,

      orderNumber

    });



    /* =========================
       SOCKET TIEMPO REAL
    ========================= */

    io.emit(
      "newOrder",
      order
    );



    console.log(
      "🟢 Nuevo pedido:",
      orderNumber
    );



    return res.status(201).json({

      success:true,

      order

    });



  } catch(error) {


    console.error(
      "Error creando pedido:",
      error
    );


    return res.status(500).json({

      success:false,

      message:"Error creando pedido"

    });


  }

};
/*=================================================
  Actualizar estado pedido
 =================================================*/
export const updateOrderStatus = async (req, res) => {

  try {

    const io = req.app.get("io");

    const { status } = req.body;


    const order =
      await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          new: true
        }
      );


    if (!order) {

      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });

    }


    io.emit(
      "orderUpdated",
      order
    );


    res.status(200).json({
      success: true,
      order
    });


  } catch (error) {

    console.error(
      "Error actualizando pedido:",
      error
    );


    res.status(500).json({
      success: false,
      message: "Error actualizando pedido"
    });

  }

};