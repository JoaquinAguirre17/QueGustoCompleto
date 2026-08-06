import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import "./ProductCard.css";

const ProductCard = ({ product }) => {

  const { addToCart } = useCart();

  const [open, setOpen] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState({});

  if (!product) return null;

  const modifiers = product.modifiers || [];

  const hasOptions = modifiers.some(
    m => m.options?.length > 0
  );


  const selectOption = (name, value) => {
    setSelectedModifiers({
      ...selectedModifiers,
      [name]: value
    });
  };


 const handleAdd=()=>{

console.log("ANTES DE ENVIAR AL CARRITO:",{
...product,
selectedModifiers
});


for(const modifier of modifiers){

if(
modifier.required &&
!selectedModifiers[modifier.name]
){

alert(`Elegí ${modifier.name}`);
return;

}

}


addToCart({
...product,
selectedModifiers
});


setOpen(false);
setSelectedModifiers({});

};



  return (
    <>

      <div className="qg-card">

        <div className="qg-card-image">

          <img
            src={product.image || "/images/no-image.jpg"}
            alt={product.title}
          />

          {product.featured &&
            <span className="qg-featured">
              <FaStar /> Destacado
            </span>
          }

        </div>


        <div className="qg-card-body">

          <span className="qg-category">
            {product.category}
          </span>

          <h3>{product.title}</h3>

          <p>
            {product.description || "Sin descripción"}
          </p>


          <div className="qg-card-footer">

            <div className="qg-price">
              ${product.price}
            </div>

            <button
              className="qg-add-btn"
              onClick={() => {

                if (hasOptions) {
                  setOpen(true);
                } else {
                  addToCart(product);
                }

              }}
            >
              <FaShoppingCart />
              Agregar
            </button>

          </div>

        </div>

      </div>



      {open &&

        <div
          className="qg-modal-overlay"
          onClick={() => setOpen(false)}
        >

          <div
            className="qg-modal"
            onClick={e => e.stopPropagation()}
          >

            <h2>
              {product.title}
            </h2>

            <p>
              Elegí tus opciones
            </p>


            {modifiers.map((modifier, index) => (

              <div
                key={index}
                className="qg-modifier"
              >

                <h3>
                  {modifier.name}
                  {modifier.required && " *"}
                </h3>


                {modifier.options.map((opt, i) => (

                  <label
                    key={i}
                    className="qg-option"
                  >

                    <input
                      type="radio"
                      name={modifier.name}
                      checked={
                        selectedModifiers[modifier.name] === opt.label
                      }
                      onChange={() =>
                        selectOption(
                          modifier.name,
                          opt.label
                        )
                      }
                    />

                    {opt.label}

                  </label>

                ))}

              </div>

            ))}



            <div className="qg-modal-buttons">

              <button
                onClick={() => {
                  setOpen(false);
                  setSelectedModifiers({});
                }}
              >
                Cancelar
              </button>


              <button
                onClick={handleAdd}
              >
                Confirmar
              </button>

            </div>


          </div>

        </div>

      }

    </>
  );

};

export default ProductCard;