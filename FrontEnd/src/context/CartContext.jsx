import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {

  const [cart, setCart] = useState([]);


  const sameProduct = (a, b) => {

    return (
      a._id === b._id &&
      JSON.stringify(a.selectedModifiers || {}) ===
      JSON.stringify(b.selectedModifiers || {})
    );

  };



  const addToCart = (product) => {
    console.log("LLEGA AL CONTEXTO:", product);
    if (!product || !product._id) {
      console.error("Producto inválido");
      return;
    }


    const exists = cart.find(
      item => sameProduct(item, product)
    );



    if (exists) {

      setCart(
        cart.map(item =>
          sameProduct(item, product)
            ?
            {
              ...item,
              quantity: item.quantity + 1
            }
            :
            item
        )
      );


    } else {

      setCart([
        ...cart,
        {
          ...product,
          quantity: 1
        }
      ]);

    }

  };



  const removeFromCart = (index) => {

    setCart(
      cart.filter(
        (_, i) => i !== index
      )
    );

  };



  const clearCart = () => {

    setCart([]);

  };



  const cartQuantity = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );



  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      (item.price || 0) *
      (item.quantity || 0),
    0
  );



  return (

    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartQuantity,
        cartTotal
      }}
    >

      {children}

    </CartContext.Provider>

  );

};



export const useCart = () => useContext(CartContext);