import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./Componentes/HOME/Home";

import Cart from "./Componentes/cart/Cart";
import AdminLayout from "./Componentes/Admin/layout/AdminLayout";
import Pedidos from "./Componentes/Admin/pages/Pedidos";
import Menu from "./Componentes/Admin/pages/Menu";
import Ventas from "./Componentes/Admin/pages/Ventas";
import Navbar from './Componentes/Navbar/Navbar';
import Products from './Componentes/Products/Products';
import Checkout from './Componentes/Admin/pages/Checkout';

const App = () => {
  return (

    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/productos" element={<Products />} />
        <Route path="/productos/:category" element={<Products />} />
        {/* CARRITO */}
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={<Checkout />}
        />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="/admin/pedidos" element={<Pedidos />} />
          <Route path="/admin/menu" element={<Menu />} />
          <Route path="/admin/ventas" element={<Ventas />} />
        </Route>
      </Routes>
    </Router>
  );
}


export default App;
