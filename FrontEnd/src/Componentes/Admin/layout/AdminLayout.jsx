import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "./AdminLayout.css";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="qg-admin-container">

      {/* TOP BAR MOBILE */}
      <header className="qg-admin-mobileHeader">

        <h2 className="qg-admin-logo">🍗 Que Gusto</h2>

        <button
          className="qg-admin-menuBtn"
          onClick={() => setOpen(!open)}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>

      </header>

      {/* SIDEBAR */}
      <aside className={`qg-admin-sidebar ${open ? "qg-admin-active" : ""}`}>

        <div className="qg-admin-brand">
          <h2>🍗 Que Gusto</h2>
          <p className="qg-admin-subtitle">Panel del local</p>
        </div>

        <nav
          className="qg-admin-nav"
          onClick={() => setOpen(false)}
        >
          <Link to="/admin">🏠 Inicio</Link>
          <Link to="/admin/pedidos">🧾 Pedidos</Link>
          <Link to="/admin/menu">🍔 Menú</Link>
          <Link to="/admin/ventas">💰 Ventas</Link>
        </nav>

      </aside>

      {/* OVERLAY MOBILE */}
      {open && (
        <div
          className="qg-admin-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* CONTENIDO */}
      <main className="qg-admin-content">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;