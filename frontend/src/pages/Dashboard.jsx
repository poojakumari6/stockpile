import { useEffect, useState } from "react";
import { api } from "../api";
import { IconAlert, IconBox, IconCart, IconUsers } from "../components/Icons";
import { useToast } from "../components/Toast.jsx";
import { Empty, Loading, StockBadge } from "../components/ui.jsx";

const STAT_META = [
  { key: "total_products", label: "Products", icon: IconBox, foot: "tracked SKUs" },
  { key: "total_customers", label: "Customers", icon: IconUsers, foot: "registered" },
  { key: "total_orders", label: "Orders", icon: IconCart, foot: "all time" },
];

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await api.dashboard(10);
        if (alive) setData(d);
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [toast]);

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">A snapshot of inventory and order activity.</p>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <Loading label="Loading summary…" />
        ) : !data ? (
          <Empty title="No data yet" hint="Add products and customers to get started." />
        ) : (
          <>
            <div className="stat-grid">
              {STAT_META.map(({ key, label, foot }) => (
                <div className="stat" key={key}>
                  <div className="label">{label}</div>
                  <div className="value">{data[key]}</div>
                  <div className="foot">{foot}</div>
                </div>
              ))}
              <div className="stat">
                <div className="label">Low stock</div>
                <div className="value" style={{ color: data.low_stock_products.length ? "var(--accent)" : undefined }}>
                  {data.low_stock_products.length}
                </div>
                <div className="foot">at or below {data.low_stock_threshold} units</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>
                  <IconAlert style={{ verticalAlign: "-3px", marginRight: 8, color: "var(--amber)" }} width={18} height={18} />
                  Low stock products
                </h2>
              </div>
              {data.low_stock_products.length === 0 ? (
                <Empty title="All stocked up" hint="No products are at or below the low-stock threshold." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.low_stock_products.map((p) => (
                        <tr key={p.id}>
                          <td className="cell-strong">{p.name}</td>
                          <td className="mono">{p.sku}</td>
                          <td><StockBadge qty={p.quantity} threshold={data.low_stock_threshold} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
