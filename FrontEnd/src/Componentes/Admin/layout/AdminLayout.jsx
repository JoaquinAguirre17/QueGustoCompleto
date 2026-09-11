
import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { useSocket } from "./../hooks/useSocket";
import "./AdminLayout.css";

const API_URL = "http://localhost:3000/api";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const [cantidadPedidos, setCantidadPedidos] = useState(0);

  const {
    newOrder,
    updatedOrder,
  } = useSocket();

  const obtenerCantidadPedidos = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`);

      if (!response.ok) {
        throw new Error("No se pudieron obtener los pedidos");
      }

      const pedidos = await response.json();

      const pedidosActivos = pedidos.filter(
        (pedido) =>
          pedido.status !== "Entregado" &&
          pedido.status !== "Cancelado"
      );

      setCantidadPedidos(pedidosActivos.length);
    } catch (error) {
      console.error(
        "Error obteniendo cantidad de pedidos:",
        error
      );
    }
  };

  useEffect(() => {
    obtenerCantidadPedidos();
  }, []);

  useEffect(() => {
    if (!newOrder) return;

    if (
      newOrder.status !== "Entregado" &&
      newOrder.status !== "Cancelado"
    ) {
      setCantidadPedidos((prev) => prev + 1);
    }
  }, [newOrder]);

  useEffect(() => {
    if (!updatedOrder) return;

    if (
      updatedOrder.status === "Entregado" ||
      updatedOrder.status === "Cancelado"
    ) {
      setCantidadPedidos((prev) =>
        Math.max(0, prev - 1)
      );
    }
  }, [updatedOrder]);

  const cerrarMenu = () => {
    setOpen(false);
  };

  return (
    <div className="qg-admin-container">

      <header className="qg-admin-mobileHeader">
        <h2 className="qg-admin-logo">
          🍗 Que Gusto
        </h2>

        <button
          type="button"
          className="qg-admin-menuBtn"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </header>

      <aside
        className={`qg-admin-sidebar ${
          open ? "qg-admin-active" : ""
        }`}
      >

        <div className="qg-admin-brand">
          <h2>🍗 Que Gusto</h2>

          <p className="qg-admin-subtitle">
            Panel del local
          </p>
        </div>

        <nav className="qg-admin-nav">

          <Link
            to="/admin/inicio"
            onClick={cerrarMenu}
          >
            <span className="qg-admin-nav-text">
              🏠 Inicio
            </span>
          </Link>

          <Link
            to="/admin/pedidos"
            onClick={cerrarMenu}
            className="qg-admin-orders-link"
          >
            <span className="qg-admin-nav-text">
              🧾 Pedidos
            </span>

            {cantidadPedidos > 0 && (
              <span className="qg-admin-orders-badge">
                {cantidadPedidos}
              </span>
            )}
          </Link>

          <Link
            to="/admin/menu"
            onClick={cerrarMenu}
          >
            <span className="qg-admin-nav-text">
              🍔 Menú
            </span>
          </Link>

          <Link
            to="/admin/ventas"
            onClick={cerrarMenu}
          >
            <span className="qg-admin-nav-text">
              💰 Ventas
            </span>
          </Link>

        </nav>
      </aside>

      {open && (
        <div
          className="qg-admin-overlay"
          onClick={cerrarMenu}
        />
      )}

      <main className="qg-admin-content">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;
