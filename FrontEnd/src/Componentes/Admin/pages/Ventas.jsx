
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./Ventas.css";

const API_URL = "http://localhost:3000/api";

const Ventas = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filtro, setFiltro] = useState("todas");
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  const [stats, setStats] = useState({
    totalVentas: 0,
    totalPedidos: 0,
    promedio: 0,
    efectivo: 0,
    transferencia: 0,
    otros: 0
  });

  const cargarVentas = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/orders`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setOrders(data);
    } catch (error) {
      console.error(
        "Error cargando ventas:",
        error
      );

      setError(
        "No se pudieron cargar las ventas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const ventasEntregadas = useMemo(() => {
    return orders.filter(
      (order) => order.status === "Entregado"
    );
  }, [orders]);

  const ventasFiltradas = useMemo(() => {
    if (filtro === "todas") {
      return ventasEntregadas;
    }

    if (filtro === "dia") {
      if (!fechaSeleccionada) {
        return ventasEntregadas;
      }

      return ventasEntregadas.filter((order) => {
        if (!order.createdAt) return false;

        const fecha = new Date(order.createdAt);

        const anio = fecha.getFullYear();
        const mes = String(
          fecha.getMonth() + 1
        ).padStart(2, "0");
        const dia = String(
          fecha.getDate()
        ).padStart(2, "0");

        const fechaPedido =
          `${anio}-${mes}-${dia}`;

        return fechaPedido === fechaSeleccionada;
      });
    }

    if (filtro === "mes") {
      if (!mesSeleccionado) {
        return ventasEntregadas;
      }

      return ventasEntregadas.filter((order) => {
        if (!order.createdAt) return false;

        const fecha = new Date(order.createdAt);

        const anio = fecha.getFullYear();

        const mes = String(
          fecha.getMonth() + 1
        ).padStart(2, "0");

        return (
          `${anio}-${mes}` ===
          mesSeleccionado
        );
      });
    }

    return ventasEntregadas;
  }, [
    ventasEntregadas,
    filtro,
    fechaSeleccionada,
    mesSeleccionado
  ]);

  useEffect(() => {
    const totalVentas = ventasFiltradas.reduce(
      (acc, order) =>
        acc + Number(order.total || 0),
      0
    );

    const efectivo = ventasFiltradas
      .filter(
        (order) =>
          String(
            order.paymentMethod || ""
          ).toLowerCase() === "efectivo"
      )
      .reduce(
        (acc, order) =>
          acc + Number(order.total || 0),
        0
      );

    const transferencia = ventasFiltradas
      .filter(
        (order) =>
          String(
            order.paymentMethod || ""
          ).toLowerCase() ===
          "transferencia"
      )
      .reduce(
        (acc, order) =>
          acc + Number(order.total || 0),
        0
      );

    const otros = ventasFiltradas
      .filter((order) => {
        const metodo = String(
          order.paymentMethod || ""
        ).toLowerCase();

        return (
          metodo !== "efectivo" &&
          metodo !== "transferencia"
        );
      })
      .reduce(
        (acc, order) =>
          acc + Number(order.total || 0),
        0
      );

    const promedio =
      ventasFiltradas.length > 0
        ? totalVentas / ventasFiltradas.length
        : 0;

    setStats({
      totalVentas,
      totalPedidos: ventasFiltradas.length,
      promedio,
      efectivo,
      transferencia,
      otros
    });
  }, [ventasFiltradas]);

  const formatearPrecio = (valor) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(
      Math.round(Number(valor) || 0)
    );
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "es-AR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );
  };

  const formatearHora = (fecha) => {
    if (!fecha) return "-";

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleTimeString(
      "es-AR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  };

  const obtenerMetodoPago = (order) => {
    if (order.paymentMethod) {
      return order.paymentMethod;
    }

    if (order.payment?.method) {
      return order.payment.method;
    }

    return "No especificado";
  };

  const obtenerNombreCliente = (order) => {
    const nombre =
      order.customer?.firstName || "";

    const apellido =
      order.customer?.lastName || "";

    const completo =
      `${nombre} ${apellido}`.trim();

    return completo || "Cliente";
  };

  const obtenerProductos = (order) => {
    if (!Array.isArray(order.items)) {
      return "";
    }

    return order.items
      .map((item) => {
        const cantidad =
          Number(item.quantity || 1);

        let texto =
          `${cantidad}x ${item.title || "Producto"}`;

        if (
          Array.isArray(item.modifiers) &&
          item.modifiers.length > 0
        ) {
          const modificadores =
            item.modifiers
              .map(
                (modifier) =>
                  modifier.option
              )
              .filter(Boolean)
              .join(", ");

          if (modificadores) {
            texto += ` (${modificadores})`;
          }
        }

        return texto;
      })
      .join(" | ");
  };

  const obtenerPeriodo = () => {
    if (filtro === "dia") {
      return fechaSeleccionada
        ? `Día ${fechaSeleccionada}`
        : "Día seleccionado";
    }

    if (filtro === "mes") {
      return mesSeleccionado
        ? `Mes ${mesSeleccionado}`
        : "Mes seleccionado";
    }

    return "Todas las ventas";
  };

  const descargarExcel = () => {
    if (ventasFiltradas.length === 0) {
      alert(
        "No hay ventas para exportar."
      );

      return;
    }

    const registros = ventasFiltradas.map(
      (order) => ({
        "N° Pedido":
          order.orderNumber || "",

        Fecha:
          formatearFecha(
            order.createdAt
          ),

        Hora:
          formatearHora(
            order.createdAt
          ),

        Cliente:
          obtenerNombreCliente(order),

        Teléfono:
          order.customer?.phone || "",

        Dirección:
          order.customer?.address || "",

        Productos:
          obtenerProductos(order),

        "Método de pago":
          obtenerMetodoPago(order),

        Total:
          Math.round(
            Number(order.total || 0)
          ),

        Estado:
          order.status || ""
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(
        registros
      );

    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 8 },
      { wch: 25 },
      { wch: 16 },
      { wch: 30 },
      { wch: 70 },
      { wch: 20 },
      { wch: 15 },
      { wch: 14 }
    ];

    const resumen = [
      {
        Concepto: "Período",
        Valor: obtenerPeriodo()
      },
      {
        Concepto: "Cantidad de ventas",
        Valor: ventasFiltradas.length
      },
      {
        Concepto: "Total vendido",
        Valor: Math.round(
          stats.totalVentas
        )
      },
      {
        Concepto: "Efectivo",
        Valor: Math.round(
          stats.efectivo
        )
      },
      {
        Concepto: "Transferencia",
        Valor: Math.round(
          stats.transferencia
        )
      },
      {
        Concepto: "Otros medios",
        Valor: Math.round(
          stats.otros
        )
      },
      {
        Concepto: "Promedio por venta",
        Valor: Math.round(
          stats.promedio
        )
      }
    ];

    const workbook =
      XLSX.utils.book_new();

    const worksheetVentas =
      XLSX.utils.json_to_sheet(
        registros
      );

    const worksheetResumen =
      XLSX.utils.json_to_sheet(
        resumen
      );

    worksheetVentas["!cols"] =
      worksheet["!cols"];

    worksheetResumen["!cols"] = [
      { wch: 25 },
      { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      worksheetResumen,
      "Resumen"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      worksheetVentas,
      "Ventas"
    );

    let nombreArchivo =
      "ventas";

    if (
      filtro === "dia" &&
      fechaSeleccionada
    ) {
      nombreArchivo +=
        `_${fechaSeleccionada}`;
    }

    if (
      filtro === "mes" &&
      mesSeleccionado
    ) {
      nombreArchivo +=
        `_${mesSeleccionado}`;
    }

    XLSX.writeFile(
      workbook,
      `${nombreArchivo}.xlsx`
    );
  };

  const limpiarFiltros = () => {
    setFiltro("todas");
    setFechaSeleccionada("");
    setMesSeleccionado("");
  };

  return (
    <div className="qg-ventas-page">

      <div className="qg-ventas-header">

        <div>
          <span className="qg-ventas-eyebrow">
            ADMINISTRACIÓN
          </span>

          <h1>
            💰 Ventas
          </h1>

          <p>
            Historial y resumen de ventas
          </p>
        </div>

        <button
          className="qg-ventas-refresh"
          onClick={cargarVentas}
          disabled={loading}
        >
          ↻ Actualizar
        </button>

      </div>


      <section className="qg-ventas-filters">

        <div className="qg-ventas-filter-group">

          <label>
            Período
          </label>

          <select
            value={filtro}
            onChange={(e) =>
              setFiltro(e.target.value)
            }
          >
            <option value="todas">
              Todas las ventas
            </option>

            <option value="dia">
              Por día
            </option>

            <option value="mes">
              Por mes
            </option>
          </select>

        </div>


        {filtro === "dia" && (
          <div className="qg-ventas-filter-group">

            <label>
              Seleccionar día
            </label>

            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) =>
                setFechaSeleccionada(
                  e.target.value
                )
              }
            />

          </div>
        )}


        {filtro === "mes" && (
          <div className="qg-ventas-filter-group">

            <label>
              Seleccionar mes
            </label>

            <input
              type="month"
              value={mesSeleccionado}
              onChange={(e) =>
                setMesSeleccionado(
                  e.target.value
                )
              }
            />

          </div>
        )}


        <button
          className="qg-ventas-clear"
          onClick={limpiarFiltros}
        >
          Limpiar
        </button>


        <button
          className="qg-ventas-excel"
          onClick={descargarExcel}
          disabled={
            loading ||
            ventasFiltradas.length === 0
          }
        >
          📊 Descargar Excel
        </button>

      </section>


      <div className="qg-ventas-period">

        <span>
          Mostrando:
        </span>

        <strong>
          {obtenerPeriodo()}
        </strong>

      </div>


      <section className="qg-ventas-stats">

        <div className="qg-ventas-stat qg-ventas-stat-total">

          <div className="qg-ventas-stat-icon">
            💰
          </div>

          <div>
            <span>
              Total vendido
            </span>

            <strong>
              {formatearPrecio(
                stats.totalVentas
              )}
            </strong>
          </div>

        </div>


        <div className="qg-ventas-stat">

          <div className="qg-ventas-stat-icon">
            🧾
          </div>

          <div>
            <span>
              Ventas
            </span>

            <strong>
              {stats.totalPedidos}
            </strong>
          </div>

        </div>


        <div className="qg-ventas-stat">

          <div className="qg-ventas-stat-icon">
            📈
          </div>

          <div>
            <span>
              Promedio
            </span>

            <strong>
              {formatearPrecio(
                stats.promedio
              )}
            </strong>
          </div>

        </div>


        <div className="qg-ventas-stat">

          <div className="qg-ventas-stat-icon">
            💵
          </div>

          <div>
            <span>
              Efectivo
            </span>

            <strong>
              {formatearPrecio(
                stats.efectivo
              )}
            </strong>
          </div>

        </div>


        <div className="qg-ventas-stat">

          <div className="qg-ventas-stat-icon">
            🏦
          </div>

          <div>
            <span>
              Transferencia
            </span>

            <strong>
              {formatearPrecio(
                stats.transferencia
              )}
            </strong>
          </div>

        </div>


        <div className="qg-ventas-stat">

          <div className="qg-ventas-stat-icon">
            💳
          </div>

          <div>
            <span>
              Otros medios
            </span>

            <strong>
              {formatearPrecio(
                stats.otros
              )}
            </strong>
          </div>

        </div>

      </section>


      <section className="qg-ventas-list">

        <div className="qg-ventas-list-header">

          <div>
            <h2>
              🧾 Historial de ventas
            </h2>

            <p>
              {ventasFiltradas.length} registros
            </p>
          </div>

          <span className="qg-ventas-total-badge">
            {formatearPrecio(
              stats.totalVentas
            )}
          </span>

        </div>


        {loading ? (

          <div className="qg-ventas-empty">

            <div className="qg-ventas-loader" />

            <p>
              Cargando ventas...
            </p>

          </div>

        ) : ventasFiltradas.length === 0 ? (

          <div className="qg-ventas-empty">

            <span>
              🧾
            </span>

            <h3>
              No hay ventas
            </h3>

            <p>
              No existen ventas para el período seleccionado.
            </p>

          </div>

        ) : (

          <div className="qg-ventas-table-wrapper">

            <table className="qg-ventas-table">

              <thead>

                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Pago</th>
                  <th>Total</th>
                </tr>

              </thead>

              <tbody>

                {ventasFiltradas.map(
                  (order) => (

                    <tr key={order._id}>

                      <td>
                        <strong>
                          #{order.orderNumber}
                        </strong>
                      </td>

                      <td>
                        <div className="qg-ventas-date">

                          <strong>
                            {formatearFecha(
                              order.createdAt
                            )}
                          </strong>

                          <span>
                            {formatearHora(
                              order.createdAt
                            )}
                          </span>

                        </div>
                      </td>

                      <td>
                        <div className="qg-ventas-customer">

                          <strong>
                            {obtenerNombreCliente(
                              order
                            )}
                          </strong>

                          {order.customer?.phone && (
                            <span>
                              {order.customer.phone}
                            </span>
                          )}

                        </div>
                      </td>

                      <td>
                        <div className="qg-ventas-products">

                          {Array.isArray(
                            order.items
                          ) &&
                            order.items.map(
                              (
                                item,
                                index
                              ) => (
                                <span
                                  key={`${order._id}-${index}`}
                                >
                                  {item.quantity || 1}x{" "}
                                  {item.title}
                                </span>
                              )
                            )}

                        </div>
                      </td>

                      <td>
                        <span className="qg-ventas-payment">
                          {obtenerMetodoPago(
                            order
                          )}
                        </span>
                      </td>

                      <td>
                        <strong className="qg-ventas-row-total">
                          {formatearPrecio(
                            order.total
                          )}
                        </strong>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
};

export default Ventas;

