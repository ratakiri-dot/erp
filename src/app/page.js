"use client";

import { useState, useEffect } from "react";
import { usePOS } from "@/context/POSContext";
import LoginScreen from "@/components/LoginScreen";
import OpenShift from "@/components/OpenShift";
import CloseShiftModal from "@/components/CloseShiftModal";
import ProductGrid from "@/components/pos/ProductGrid";
import CartSidebar from "@/components/pos/CartSidebar";
import PaymentModal from "@/components/pos/PaymentModal";

// Admin Views
import InventoryView from "@/components/admin/InventoryView";
import ProductsView from "@/components/admin/ProductsView";
import TransactionsView from "@/components/admin/TransactionsView";
import RecipesView from "@/components/admin/RecipesView";
import ReportsView from "@/components/admin/ReportsView";
import UsersView from "@/components/admin/UsersView";
import SettingsView from "@/components/admin/SettingsView";
import styles from "@/components/Dashboard.module.css";
import { printerService } from "@/lib/bluetooth";

export default function Home() {
  const { user, shift, cart } = usePOS();
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Mobile Menu Toggle

  // Role Configurations
  const ROLE_ACCESS = {
    ADMIN: ['POS', 'PRODUCTS', 'INVENTORY', 'RECIPES', 'TRANSACTIONS', 'REPORTS', 'USERS', 'SETTINGS'],
    INVENTORY: ['PRODUCTS', 'INVENTORY', 'RECIPES'],
    CASHIER: ['POS', 'TRANSACTIONS'],
    FINANCE: ['REPORTS', 'TRANSACTIONS'], // Read-only financial access
  };

  // Helper: Check Perms
  const hasAccess = (role, tab) => {
    const allowed = ROLE_ACCESS[role] || [];
    return allowed.includes(tab);
  };

  // State for Active Tab
  const [activeTab, setActiveTab] = useState('POS');

  // EFFECT: Set correct default tab when user changes
  useEffect(() => {
    if (user) {
      if (!hasAccess(user.role, activeTab)) {
        const firstAllowed = ROLE_ACCESS[user.role]?.[0];
        if (firstAllowed) setActiveTab(firstAllowed);
      }
    }
  }, [user]);

  // Close sidebar when tab changes (Mobile UX)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowSidebar(false);
  };


  // 1. Not Logged In
  if (!user) {
    return <LoginScreen />;
  }

  const needsShift = () => {
    if (user.role === 'INVENTORY') return false;
    if (user.role === 'ADMIN') return false;
    if (user.role === 'CASHIER') return true;
    return false;
  };

  if (!shift && needsShift()) {
    return <OpenShift />;
  }

  // Calculate total for Payment Modal
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  const total = subtotal;

  // Render Content Based on Tab
  const renderContent = () => {
    // Determine the tab to render.
    let tabToRender = activeTab;
    if (!hasAccess(user.role, activeTab)) {
      tabToRender = ROLE_ACCESS[user.role]?.[0];
    }
    if (!tabToRender) return <div style={{ padding: '2rem' }}>No Access Configured</div>

    switch (tabToRender) {
      case 'PRODUCTS':
        return <div style={{ flex: 1, padding: '2rem', overflowY: "auto" }}><ProductsView /></div>;
      case 'INVENTORY':
        return <div style={{ flex: 1, padding: '2rem', overflowY: "auto" }}><InventoryView /></div>;
      case 'TRANSACTIONS':
        return <div style={{ flex: 1, padding: '2rem', overflowY: "auto" }}><TransactionsView /></div>;
      case 'RECIPES':
        return <div style={{ flex: 1, padding: '2rem', overflowY: "auto" }}><RecipesView /></div>;
      case 'REPORTS':
        return <div style={{ flex: 1, padding: '2rem', overflowY: "auto" }}><ReportsView /></div>;
      case 'USERS':
        return <div style={{ flex: 1, padding: '2rem', overflowY: "auto" }}><UsersView /></div>;
      case 'SETTINGS':
        return <div style={{ flex: 1, padding: '2rem', overflowY: "auto" }}><SettingsView /></div>;
      default:
        // POS VIEW
        return (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
              <ProductGrid />
            </div>

            {/* RIGHT: Cart Sidebar only for POS */}
            {/* Mobile Toggle Button (Floating) */}
            <button
              className={styles.mobileCartToggle}
              onClick={() => setShowMobileCart(!showMobileCart)}
              style={{
                position: 'fixed', bottom: '2rem', right: '2rem',
                background: '#00e0b8', color: 'black', fontWeight: 'bold',
                padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 1000, width: '60px', height: '60px', fontSize: '1.5rem',
                border: 'none', cursor: 'pointer',
              }}
            >
              🛒
              {cart.length > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.length}</span>}
            </button>

            {/* Cart Sidebar: Mobile Responsive */}
            <div
              className={showMobileCart ? styles.mobileVisible : styles.mobileHidden}
              style={{
                width: "400px",
                borderLeft: '1px solid #333',
                background: '#1a1a1a',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Mobile Header for Cart */}
              <div style={{ padding: '1rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className={styles.mobileOnly}>
                <h3>Keranjang</h3>
                <button onClick={() => setShowMobileCart(false)} style={{ background: 'none', border: 'none', color: 'red', fontSize: '1.2rem' }}>✕ Close</button>
              </div>

              <CartSidebar onCheckout={() => setShowPayment(true)} />
            </div>
          </>
        );
    }
  };

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* HEADER */}
      <header style={{ padding: "1rem 2rem", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center", background: '#1a1a1a', zIndex: 1001, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, overflow: 'hidden' }}>

          {/* HAMBURGER MENU (Mobile Only) */}
          <button
            className={styles.hamburger}
            onClick={() => setShowSidebar(!showSidebar)}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', marginRight: '1rem' }}
          >
            ☰
          </button>

          <div style={{ minWidth: 'fit-content' }}>
            <h1 style={{ fontSize: "1.5rem", color: '#00e0b8', fontWeight: 'bold' }}>RATAKIRI POS</h1>
            <p style={{ color: "#888", fontSize: "0.9rem" }}>
              Shift: {shift ? new Date(parseInt(shift.id.split('_')[1])).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </p>
          </div>

          {/* DESKTOP NAVIGATION (Hidden on Mobile) */}
          <div className={`${styles.navBar} ${styles.desktopNav}`} style={{ marginBottom: 0, flex: 1, overflowX: 'auto', border: 'none', background: 'transparent', display: 'flex', gap: '0.5rem' }}>
            {hasAccess(user.role, 'POS') && (
              <button className={`${styles.navItem} ${activeTab === 'POS' ? styles.active : ''}`} onClick={() => handleTabChange('POS')}>🛒 Cashier</button>
            )}
            {hasAccess(user.role, 'PRODUCTS') && (
              <button className={`${styles.navItem} ${activeTab === 'PRODUCTS' ? styles.active : ''}`} onClick={() => handleTabChange('PRODUCTS')}>🍕 Products</button>
            )}
            {hasAccess(user.role, 'INVENTORY') && (
              <button className={`${styles.navItem} ${activeTab === 'INVENTORY' ? styles.active : ''}`} onClick={() => handleTabChange('INVENTORY')}>📦 Inventory</button>
            )}
            {hasAccess(user.role, 'RECIPES') && (
              <button className={`${styles.navItem} ${activeTab === 'RECIPES' ? styles.active : ''}`} onClick={() => handleTabChange('RECIPES')}>📜 Recipes</button>
            )}
            {hasAccess(user.role, 'TRANSACTIONS') && (
              <button className={`${styles.navItem} ${activeTab === 'TRANSACTIONS' ? styles.active : ''}`} onClick={() => handleTabChange('TRANSACTIONS')}>📄 History</button>
            )}
            {hasAccess(user.role, 'REPORTS') && (
              <button className={`${styles.navItem} ${activeTab === 'REPORTS' ? styles.active : ''}`} onClick={() => handleTabChange('REPORTS')}>📊 Reports</button>
            )}
            {hasAccess(user.role, 'USERS') && (
              <button className={`${styles.navItem} ${activeTab === 'USERS' ? styles.active : ''}`} onClick={() => handleTabChange('USERS')}>👥 Users</button>
            )}
            {hasAccess(user.role, 'SETTINGS') && (
              <button className={`${styles.navItem} ${activeTab === 'SETTINGS' ? styles.active : ''}`} onClick={() => handleTabChange('SETTINGS')}>⚙️ Settings</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>


          <div style={{ textAlign: "right" }} className={styles.desktopOnly}>
            <p style={{ fontWeight: "bold" }}>{user.name}</p>
            <p style={{ fontSize: "0.80rem", color: "#ccc", background: '#333', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
              {user.role}
            </p>
          </div>

          {shift && user.role !== 'INVENTORY' && (
            <button
              onClick={() => setShowCloseShift(true)}
              style={{ padding: "0.5rem 1rem", background: "#ff4d4f", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: '0.8rem' }}
            >
              End Shift
            </button>
          )}

          <button
            className={styles.desktopOnly}
            onClick={() => { if (confirm("Logout?")) { sessionStorage.removeItem('pos_current_user'); sessionStorage.removeItem('pos_current_shift'); window.location.reload(); } }}
            style={{ padding: "0.5rem 1rem", background: "#333", color: "white", border: "1px solid #555", borderRadius: "6px", cursor: "pointer", fontSize: '0.8rem' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION (Mobile Drawer + Desktop Nav) */}
      <div
        className={`${styles.sidebar} ${showSidebar ? styles.open : ''}`}
        style={{ background: '#1f1f22' }} // Fallback style
      >
        {/* Mobile Profile Header in Sidebar */}
        <div className={styles.mobileOnly} style={{ padding: '1.5rem', borderBottom: '1px solid #333', marginBottom: '1rem' }}>
          <p style={{ fontWeight: "bold", fontSize: '1.2rem' }}>{user.name}</p>
          <p style={{ color: "#00e0b8" }}>{user.role}</p>
        </div>

        <div className={styles.navLinks}>
          {hasAccess(user.role, 'POS') && (
            <button className={`${styles.navItem} ${activeTab === 'POS' ? styles.active : ''}`} onClick={() => handleTabChange('POS')}>🛒 Cashier</button>
          )}
          {hasAccess(user.role, 'PRODUCTS') && (
            <button className={`${styles.navItem} ${activeTab === 'PRODUCTS' ? styles.active : ''}`} onClick={() => handleTabChange('PRODUCTS')}>🍕 Products</button>
          )}
          {hasAccess(user.role, 'INVENTORY') && (
            <button className={`${styles.navItem} ${activeTab === 'INVENTORY' ? styles.active : ''}`} onClick={() => handleTabChange('INVENTORY')}>📦 Inventory</button>
          )}
          {hasAccess(user.role, 'RECIPES') && (
            <button className={`${styles.navItem} ${activeTab === 'RECIPES' ? styles.active : ''}`} onClick={() => handleTabChange('RECIPES')}>📜 Recipes</button>
          )}
          {hasAccess(user.role, 'TRANSACTIONS') && (
            <button className={`${styles.navItem} ${activeTab === 'TRANSACTIONS' ? styles.active : ''}`} onClick={() => handleTabChange('TRANSACTIONS')}>📄 History</button>
          )}
          {hasAccess(user.role, 'REPORTS') && (
            <button className={`${styles.navItem} ${activeTab === 'REPORTS' ? styles.active : ''}`} onClick={() => handleTabChange('REPORTS')}>📊 Reports</button>
          )}
          {hasAccess(user.role, 'USERS') && (
            <button className={`${styles.navItem} ${activeTab === 'USERS' ? styles.active : ''}`} onClick={() => handleTabChange('USERS')}>👥 Users</button>
          )}
          {hasAccess(user.role, 'SETTINGS') && (
            <button className={`${styles.navItem} ${activeTab === 'SETTINGS' ? styles.active : ''}`} onClick={() => handleTabChange('SETTINGS')}>⚙️ Settings</button>
          )}

          <div className={styles.mobileOnly} style={{ marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
            <button
              className={styles.navItem}
              style={{ color: '#ff4d4f' }}
              onClick={() => { if (confirm("Logout?")) { sessionStorage.removeItem('pos_current_user'); sessionStorage.removeItem('pos_current_shift'); window.location.reload(); } }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY for Mobile Sidebar */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          className={styles.sidebarOverlay}
        />
      )}

      {/* CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: 'relative' }}>
        {renderContent()}
      </div>

      {/* Modals */}
      {showCloseShift && <CloseShiftModal onClose={() => setShowCloseShift(false)} />}
      {showPayment && <PaymentModal total={total} onClose={() => setShowPayment(false)} />}
    </main>
  );
}
