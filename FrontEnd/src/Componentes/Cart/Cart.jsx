import { useCart } from "../../context/CartContext";
import "./Cart.css";

const Cart = () => {

  const {
    cart,
    cartTotal,
    removeFromCart,
    clearCart
  } = useCart();


  return (
    <div className="cart-page">

      <h2>
        🛒 Tu Pedido
      </h2>


      {
        cart.length === 0 ?

          <p className="empty-cart">
            Tu carrito está vacío
          </p>

          :

          <>

            <div className="cart-items">


              {
                cart.map((item, index) => (

                  <div
                    key={index}
                    className="cart-item"
                  >


                    <div className="cart-item-info">


                      <h4>
                        {item.title}
                      </h4>


                      {
                        item.selectedModifiers &&
                        Object.keys(item.selectedModifiers).length > 0 &&

                        <div className="cart-options">

                          {
                            Object.entries(
                              item.selectedModifiers
                            ).map(([name, value]) => (

                              <p key={name}>
                                🍟 <b>{name}:</b> {value}
                              </p>

                            ))
                          }

                        </div>

                      }


                      <p className="cart-price">

                        {item.quantity} x ${item.price}

                      </p>


                    </div>



                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(index)}
                    >
                      ❌
                    </button>


                  </div>

                ))

              }


            </div>



            <div className="cart-summary">


              <h3>
                Total: ${cartTotal}
              </h3>



              <button
                className="clear-btn"
                onClick={clearCart}
              >
                🗑 Vaciar carrito
              </button>



              <button
                className="confirm-btn"
                onClick={() => {
                  window.location.href = "/checkout"
                }}
              >
                Confirmar pedido
              </button>


            </div>


          </>

      }


    </div>
  );

};

export default Cart;