
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Componentes/Home/Home";
import Cart from "./Componentes/Cart/Cart";
import AdminLayout from "./Componentes/Admin/layout/AdminLayout";

import Pedidos from "./Componentes/Admin/pages/Pedidos";
import Menu from "./Componentes/Admin/pages/Menu";
import Ventas from "./Componentes/Admin/pages/Ventas";
import Checkout from "./Componentes/Admin/pages/Checkout";
import Inicio from "./Componentes/Admin/pages/Inicio";

import Navbar from "./Componentes/Navbar/Navbar";
import Products from "./Componentes/Products/Products";
import DetalleProducto from "./Componentes/DetalleProducto/DetalleProducto";

const App = () => {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* PÚBLICO */}

        <Route path="/" element={<Home />} />

        {/* PRODUCTOS Y CATEGORÍAS */}

        <Route path="/productos" element={<Products />} />
        <Route path="/productos/:category" element={<Products />} />

        {/* DETALLE DEL PRODUCTO */}

        <Route path="/detalle/:id" element={<DetalleProducto />} />

        {/* CARRITO */}

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* ADMINISTRACIÓN */}

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="menu" element={<Menu />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="inicio" element={<Inicio />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
