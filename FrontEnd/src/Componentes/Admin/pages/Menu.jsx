import { useEffect, useState } from "react";
import axios from "axios";
import "./Menu.css";

const API = "http://localhost:3000/api";

const Menu = () => {

  const emptyProduct = {
    title:"",
    description:"",
    category:"",
    price:"",
    cost:"",
    stock:"",
    image:"",
    active:true,
    featured:false
  };

  const emptyModifier = {
    name:"",
    type:"single",
    required:false,
    options:[]
  };

  const emptyOption = {
    label:""
  };


  const [products,setProducts] = useState([]);
  const [loading,setLoading] = useState(false);

  const [form,setForm] = useState(emptyProduct);


  // MODAL
  const [showModal,setShowModal] = useState(false);
  const [selectedProduct,setSelectedProduct] = useState(null);


  // MODIFICADOR
  const [modifier,setModifier] = useState(emptyModifier);
  const [option,setOption] = useState(emptyOption);



  useEffect(()=>{

    getProducts();

  },[]);



  const getProducts = async()=>{

    try{

      setLoading(true);

      const res = await axios.get(
        `${API}/products`
      );

      setProducts(
        res.data.products || res.data
      );


    }catch(error){

      console.log(error);

      alert(
        "Error cargando productos"
      );

    }finally{

      setLoading(false);

    }

  };



  const createProduct = async(e)=>{

    e.preventDefault();


    try{

      const res = await axios.post(
        `${API}/products`,
        {
          ...form,
          price:Number(form.price),
          cost:Number(form.cost),
          stock:Number(form.stock)
        }
      );


      setProducts([
        ...products,
        res.data.product
      ]);


      setForm(emptyProduct);


      alert(
        "✅ Producto creado correctamente"
      );


    }catch(error){

      console.log(error);

      alert(
        "❌ Error creando producto"
      );

    }

  };



  const deleteProduct = async(id)=>{

    if(
      !confirm("¿Eliminar producto?")
    ) return;


    try{

      await axios.delete(
        `${API}/products/${id}`
      );


      setProducts(
        products.filter(
          p=>p._id!==id
        )
      );


      alert(
        "Producto eliminado"
      );


    }catch(error){

      console.log(error);

    }

  };



  const openModal = (product)=>{

    setSelectedProduct(product);

    setModifier(emptyModifier);

    setOption(emptyOption);

    setShowModal(true);

  };



  const addOption = ()=>{


    if(!option.label){

      alert(
        "Ingrese una guarnición"
      );

      return;

    }


    setModifier({

      ...modifier,

      options:[
        ...modifier.options,
        {
          label:option.label
        }
      ]

    });


    setOption(emptyOption);

  };
    const saveModifier = async()=>{

    if(!modifier.name){

      alert(
        "Ingrese el nombre del grupo"
      );

      return;

    }


    if(modifier.options.length===0){

      alert(
        "Agregue al menos una opción"
      );

      return;

    }


    try{

      const modifiers = [
        ...(selectedProduct.modifiers || []),
        modifier
      ];


      const res = await axios.put(
        `${API}/products/${selectedProduct._id}`,
        {
          modifiers
        }
      );


      setProducts(
        products.map(p=>
          p._id===selectedProduct._id
          ?
          res.data.product
          :
          p
        )
      );


      setShowModal(false);


      alert(
        "✅ Guarnición agregada correctamente"
      );


    }catch(error){

      console.log(error);

      alert(
        "❌ Error guardando guarnición"
      );

    }

  };



  return (

    <div className="menu-container">

      <h1>
        🍔 Administración del menú
      </h1>



      <form
        className="product-form"
        onSubmit={createProduct}
      >

        <h2>
          Nuevo producto
        </h2>


        <input
          placeholder="Nombre del producto"
          value={form.title}
          onChange={e=>
            setForm({
              ...form,
              title:e.target.value
            })
          }
        />


        <input
          placeholder="Descripción"
          value={form.description}
          onChange={e=>
            setForm({
              ...form,
              description:e.target.value
            })
          }
        />


        <input
          placeholder="Categoría"
          value={form.category}
          onChange={e=>
            setForm({
              ...form,
              category:e.target.value
            })
          }
        />


        <input
          type="number"
          placeholder="Precio"
          value={form.price}
          onChange={e=>
            setForm({
              ...form,
              price:e.target.value
            })
          }
        />


        <input
          type="number"
          placeholder="Costo"
          value={form.cost}
          onChange={e=>
            setForm({
              ...form,
              cost:e.target.value
            })
          }
        />


        <input
          placeholder="URL imagen"
          value={form.image}
          onChange={e=>
            setForm({
              ...form,
              image:e.target.value
            })
          }
        />


        <button>
          ➕ Crear producto
        </button>


      </form>





      <div className="products-grid">


      {
        loading ?

        <p>
          Cargando productos...
        </p>


        :


        products.map(product=>(

          <div
            className="product-card"
            key={product._id}
          >


            {
              product.image &&

              <img
                src={product.image}
                alt={product.title}
              />

            }



            <h3>
              {product.title}
            </h3>


            <p>
              {product.description}
            </p>


            <strong>
              ${product.price}
            </strong>



            {
              product.modifiers?.length > 0 &&

              <div className="current-options">

                🍟 Tiene opciones

              </div>

            }




            <button
              className="modifier-btn"
              onClick={()=>
                openModal(product)
              }
            >
              🍟 Agregar guarniciones
            </button>



            <button
              className="delete-btn"
              onClick={()=>
                deleteProduct(product._id)
              }
            >
              🗑 Eliminar
            </button>


          </div>

        ))

      }


      </div>






      {
        showModal &&


        <div className="modal-overlay">


          <div className="modal-box">


            <button
              className="close"
              onClick={()=>
                setShowModal(false)
              }
            >
              ✖
            </button>



            <h2>
              🍟 Guarniciones
            </h2>



            <h3>
              {selectedProduct.title}
            </h3>



            <input
              placeholder="Ej: Guarnición"
              value={modifier.name}
              onChange={e=>
                setModifier({
                  ...modifier,
                  name:e.target.value
                })
              }
            />



            <select
              value={modifier.type}
              onChange={e=>
                setModifier({
                  ...modifier,
                  type:e.target.value
                })
              }
            >

              <option value="single">
                Elegir una opción
              </option>


              <option value="multiple">
                Elegir varias opciones
              </option>


            </select>



            <label>

              <input
                type="checkbox"
                checked={modifier.required}
                onChange={e=>
                  setModifier({
                    ...modifier,
                    required:e.target.checked
                  })
                }
              />

              Selección obligatoria

            </label>




            <div className="add-option">


              <input
                placeholder="Ej: Papas fritas"
                value={option.label}
                onChange={e=>
                  setOption({
                    label:e.target.value
                  })
                }
              />


              <button
                type="button"
                onClick={addOption}
              >
                ➕ Agregar
              </button>


            </div>





            <ul>

            {
              modifier.options.map((item,index)=>(

                <li key={index}>

                  🍟 {item.label}

                </li>

              ))
            }

            </ul>





            {
              selectedProduct.modifiers?.length > 0 &&

              <div className="old-options">

                <h4>
                  Opciones actuales:
                </h4>


                {
                  selectedProduct.modifiers.map((m,i)=>(

                    <div key={i}>

                      <b>
                        {m.name}
                      </b>


                      {
                        m.options.map((o,j)=>(

                          <p key={j}>
                            🍟 {o.label}
                          </p>

                        ))
                      }

                    </div>

                  ))
                }


              </div>

            }





            <button
              className="save-btn"
              onClick={saveModifier}
            >
              💾 Guardar guarniciones
            </button>



          </div>


        </div>

      }


    </div>

  );

};


export default Menu;