import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaShoppingCart } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { cartQuantity } = useCart(); // 🔥 contador del carrito

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <header className="qg-navbar">

      {/* =========================
          LOGO
      ========================= */}
      <div className="qg-navbar__logo" onClick={() => goTo("/")}>
        <img src="/Logos/LogoLocal.jpeg" alt="Que Gusto" />
        <span>Que Gusto</span>
      </div>

      {/* =========================
          MENU DESKTOP
      ========================= */}
      <nav className="qg-navbar__links">

        <button onClick={() => goTo("/productos/empanadas")}>
          Empanadas
        </button>

        <button onClick={() => goTo("/productos/minutas")}>
          Minutas
        </button>

        <button onClick={() => goTo("/productos/pizzas")}>
          Pizzas
        </button>

        <button onClick={() => goTo("/productos/hamburguesas")}>
          Hamburguesas
        </button>

        <button onClick={() => goTo("/productos/bebidas")}>
          Bebidas
        </button>

      </nav>

      {/* =========================
          ACCIONES (CARRITO + MENU)
      ========================= */}
      <div className="qg-navbar__actions">

        {/* 🛒 CARRITO */}
        <button
          className="qg-navbar__cart"
          onClick={() => goTo("/cart")}
        >
          <FaShoppingCart />

          {cartQuantity > 0 && (
            <span className="qg-navbar__cart-badge">
              {cartQuantity}
            </span>
          )}
        </button>

        {/* ☰ HAMBURGUESA */}
        <button
          className="qg-navbar__toggle"
          onClick={() => setOpen(!open)}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>

      </div>

      {/* =========================
          MENU MOBILE
      ========================= */}
      <div className={`qg-navbar__mobile ${open ? "active" : ""}`}>

        <button onClick={() => goTo("/productos/empanadas")}>
          🥟 Empanadas
        </button>

        <button onClick={() => goTo("/productos/minutas")}>
          🍟 Minutas
        </button>

        <button onClick={() => goTo("/productos/pizzas")}>
          🍕 Pizzas
        </button>

        <button onClick={() => goTo("/productos/hamburguesas")}>
          🍔 Hamburguesas
        </button>

        <button onClick={() => goTo("/productos/bebidas")}>
          🥤 Bebidas
        </button>

      </div>

      {/* OVERLAY */}
      {open && (
        <div
          className="qg-navbar__overlay"
          onClick={() => setOpen(false)}
        />
      )}

    </header>
  );
};

export default Navbar;