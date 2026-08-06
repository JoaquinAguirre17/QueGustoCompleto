import Cart from "../cart/Cart";
import Navbar from "../Navbar/Navbar";
import "./Home.css";

const Home = () => {
  return (
    <>


      <section className="hero">
        <div className="hero-content">
          <h1>Bienvenido a Que Gusto</h1>
          <p>
            Empanadas, minutas,
            pizzas, sandwiches y hamburguesas.
          </p>
          <button>Ver Menú</button>
        </div>
      </section>
      <Cart />
      <section className="categories">
        <div id="empanadas" className="category-card">
          🥟 Empanadas
        </div>
        <div id="minutas" className="category-card">
          🍟 Minutas
        </div>
        <div id="pizzas" className="category-card">
          🍕 Pizzas
        </div>
        <div id="hamburguesas" className="category-card">
          🍔 Hamburguesas
        </div>
      </section>
    </>
  );
};

export default Home;