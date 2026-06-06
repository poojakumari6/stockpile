import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api";
import {
  IconBox,
  IconCart,
  IconDashboard,
  IconUsers,
} from "./components/Icons";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Customers from "./pages/Customers.jsx";
import Orders from "./pages/Orders.jsx";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { to: "/products", label: "Products", icon: IconBox },
  { to: "/customers", label: "Customers", icon: IconUsers },
  { to: "/orders", label: "Orders", icon: IconCart },
];

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-name">Stockpile</div>
            <div className="brand-sub">Inventory · Orders</div>
          </div>
        </div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="nav-link">
            <Icon className="ic" />
            {label}
          </NavLink>
        ))}
        <div className="sidebar-foot">
          API endpoint
          <br />
          {api.baseUrl}
        </div>
      </aside>

      <div className="mobile-bar">
        <div className="brand" style={{ margin: 0 }}>
          <div className="brand-mark" style={{ width: 30, height: 30, fontSize: 16 }}>
            S
          </div>
          <div className="brand-name" style={{ fontSize: 17 }}>
            Stockpile
          </div>
        </div>
        <nav className="mobile-nav">
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
