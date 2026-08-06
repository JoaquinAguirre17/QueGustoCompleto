import { useState } from "react";
import axios from "axios";
import { useCart } from "../../../context/CartContext";
import "./Checkout.css";


const deliveryDisponible = () => {

    const fecha = new Date();

    const dia = fecha.getDay();

    const hora = fecha.getHours();


    const dias = [1, 2, 3, 4, 5, 6];

    return (
        dias.includes(dia) &&
        (hora >= 20 || hora < 1)
    );

};



const Checkout = () => {


    const {
        cart,
        cartTotal,
        clearCart
    } = useCart();



    const [form, setForm] = useState({

        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        deliveryType: "retiro",
        paymentMethod: "efectivo"

    });


    const [loading, setLoading] = useState(false);



    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };



    const createOrder = async () => {


        try {


            if (cart.length === 0) {

                alert("El carrito está vacío");
                return;

            }



            if (
                !form.firstName ||
                !form.lastName ||
                !form.phone
            ) {

                alert(
                    "Completá nombre, apellido y teléfono"
                );

                return;

            }



            if (
                form.deliveryType === "delivery" &&
                !deliveryDisponible()
            ) {

                alert(
                    "Delivery disponible de lunes a sábado por la noche"
                );

                return;

            }



            if (
                form.deliveryType === "delivery" &&
                !form.address
            ) {

                alert(
                    "Ingresá la dirección"
                );

                return;

            }



            setLoading(true);



            const order = {


                customer: {

                    firstName: form.firstName,

                    lastName: form.lastName,

                    phone: form.phone,

                    address:
                        form.deliveryType === "delivery"
                            ?
                            form.address
                            :
                            "Retira en local"

                },



                items: cart.map(item => ({

                    product: item._id,

                    title: item.title,

                    price: item.price,

                    quantity: item.quantity,

                    selectedModifiers:
                        item.selectedModifiers || {}

                })),


                total: cartTotal,


                paymentMethod:
                    form.paymentMethod,


                deliveryType:
                    form.deliveryType


            };



            const res = await axios.post(

                "http://localhost:3000/api/orders",

                order

            );



            if (!res.data.success) {

                throw new Error(
                    "Pedido rechazado"
                );

            }



            alert(
                `Pedido creado ${res.data.order.orderNumber}`
            );



            clearCart();



        } catch (error) {


            console.error(
                "Error pedido:",
                error
            );


            alert(
                error.response?.data?.message ||
                "No se pudo crear el pedido"
            );



        } finally {

            setLoading(false);

        }


    };



    return (

        <div className="checkout-page">

            <h1>
                🍗 Finalizar pedido
            </h1>


            <div className="checkout-container">


                <div className="checkout-form">


                    <h2>
                        Datos del cliente
                    </h2>


                    <input
                        name="firstName"
                        placeholder="Nombre"
                        value={form.firstName}
                        onChange={handleChange}
                    />


                    <input
                        name="lastName"
                        placeholder="Apellido"
                        value={form.lastName}
                        onChange={handleChange}
                    />


                    <input
                        name="phone"
                        placeholder="Teléfono"
                        value={form.phone}
                        onChange={handleChange}
                    />



                    <h2>
                        Entrega
                    </h2>


                    <select
                        name="deliveryType"
                        value={form.deliveryType}
                        onChange={handleChange}
                    >


                        <option value="retiro">
                            Retirar en local
                        </option>


                        <option
                            value="delivery"
                            disabled={!deliveryDisponible()}
                        >

                            Delivery
                            {!deliveryDisponible() && " no disponible"}

                        </option>


                    </select>



                    {
                        form.deliveryType === "delivery" &&

                        <input
                            name="address"
                            placeholder="Dirección"
                            value={form.address}
                            onChange={handleChange}
                        />

                    }



                    <h2>
                        Pago
                    </h2>


                    <select
                        name="paymentMethod"
                        value={form.paymentMethod}
                        onChange={handleChange}
                    >

                        <option value="efectivo">
                            Efectivo
                        </option>


                        <option value="transferencia">
                            Transferencia
                        </option>


                    </select>


                    <button
                        className="checkout-btn"
                        onClick={createOrder}
                        disabled={loading}
                    >

                        {
                            loading
                                ?
                                "Enviando..."
                                :
                                "Confirmar pedido"
                        }


                    </button>


                </div>



                <div className="checkout-summary">


                    <h2>
                        Resumen
                    </h2>



                    {
                        cart.length === 0 ?

                            <p>
                                No hay productos
                            </p>


                            :


                            cart.map((item, index) => (


                                <div
                                    className="summary-item"
                                    key={index}
                                >


                                    <div>

                                        <strong>
                                            {item.title}
                                        </strong>


                                        {
                                            item.selectedModifiers &&

                                            Object.entries(
                                                item.selectedModifiers
                                            )
                                                .map(([name, value]) => (

                                                    <p key={name}>
                                                        🍟 {name}: {value}
                                                    </p>

                                                ))

                                        }


                                    </div>


                                    <span>
                                        {item.quantity} x ${item.price}
                                    </span>


                                </div>


                            ))

                    }



                    <hr />


                    <h3>
                        Total: ${cartTotal}
                    </h3>


                </div>


            </div>


        </div>

    );

};


export default Checkout;