import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import ProductCard from "../ProductCard/ProductCard";

import "./Products.css";

const Products = () => {
  const { category } = useParams();

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");

  /* =========================
     CARGAR PRODUCTOS
  ========================= */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          "http://localhost:3000/api/products"
        );

        const data =
          res.data.products || res.data || [];

        setProducts(data);

      } catch (err) {
        console.error(err);

        setError(
          "No se pudieron cargar los productos"
        );

      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /* =========================
     FILTRADO + BÚSQUEDA
  ========================= */
  const filteredProducts = useMemo(() => {

    let result = [...products];

    if (category) {
      result = result.filter(
        (product) =>
          product.category?.toLowerCase() ===
          category.toLowerCase()
      );
    }

    if (search.trim()) {
      result = result.filter((product) =>
        product.title
          ?.toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    switch (sortBy) {
      case "priceAsc":
        result.sort(
          (a, b) => a.price - b.price
        );
        break;

      case "priceDesc":
        result.sort(
          (a, b) => b.price - a.price
        );
        break;

      case "name":
        result.sort((a, b) =>
          a.title.localeCompare(b.title)
        );
        break;

      default:
        break;
    }

    return result;

  }, [products, category, search, sortBy]);

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <div className="qg-products-loading">
        Cargando productos...
      </div>
    );
  }

  /* =========================
     ERROR
  ========================= */
  if (error) {
    return (
      <div className="qg-products-error">
        {error}
      </div>
    );
  }

  return (
    <section className="qg-products-page">

      {/* HERO */}
      <div className="qg-products-hero">

        <h1>
          {category
            ? category.charAt(0).toUpperCase() +
              category.slice(1)
            : "Todos los productos"}
        </h1>

        <p>
          Descubrí nuestras mejores opciones
        </p>

      </div>

      {/* FILTROS */}
      <div className="qg-products-toolbar">

        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value)
          }
        >
          <option value="default">
            Ordenar
          </option>

          <option value="priceAsc">
            Precio menor
          </option>

          <option value="priceDesc">
            Precio mayor
          </option>

          <option value="name">
            Nombre A-Z
          </option>
        </select>

      </div>

      {/* INFO */}
      <div className="qg-products-info">

        <span>
          {filteredProducts.length} productos
        </span>

      </div>

      {/* GRID */}
      {filteredProducts.length > 0 ? (

        <div className="qg-products-grid">

          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
            />
          ))}

        </div>

      ) : (

        <div className="qg-products-empty">

          <h3>
            No encontramos productos
          </h3>

          <p>
            Probá otra búsqueda o categoría
          </p>

        </div>

      )}

    </section>
  );
};

export default Products;