import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Wallet, 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  CreditCard, 
  PieChart, 
  Repeat, 
  Target, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { AddTransactionModal } from './AddTransactionModal';
import './AppLayout.css';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/accounts', label: 'Accounts & Wallets', icon: CreditCard },
    { to: '/budgets', label: 'Budgets', icon: PieChart },
    { to: '/recurring', label: 'Recurring', icon: Repeat },
    { to: '/goals', label: 'Savings Goals', icon: Target },
  ];

  // Close mobile sidebar on route click
  const handleNavClick = () => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Get current page title for top bar on mobile
  const currentNavItem = navItems.find((item) => item.to === location.pathname);

  // User initials
  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="app-layout-container">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          {/* Brand Header */}
          <div className="sidebar-brand">
            <NavLink to="/dashboard" className="brand-wrapper" onClick={handleNavClick}>
              <div className="brand-logo-box">
                <Wallet size={22} />
              </div>
              <div className="brand-text-col">
                <h1 className="brand-main-title">
                  Expense<span>Tracker</span>
                </h1>
                <span className="brand-sub-badge">Financial Suite</span>
              </div>
            </NavLink>

            {/* Mobile Close Button */}
            <button 
              className="mobile-sidebar-close-btn"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Add Button */}
          <button 
            className="sidebar-quick-add"
            onClick={() => {
              setIsAddModalOpen(true);
              setIsSidebarOpen(false);
            }}
          >
            <PlusCircle size={18} />
            <span>Add Transaction</span>
          </button>

          {/* Navigation Menu */}
          <div className="sidebar-nav-section-title">Navigation Menu</div>
          <nav className="sidebar-nav-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <span className="nav-item-icon">
                    <Icon size={19} />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User Card & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-profile-left">
              <div className="user-avatar">{userInitials}</div>
              <div className="user-profile-info">
                <span className="user-name-text">{user?.name || 'Account'}</span>
                <span className="user-email-text">{user?.email || 'Logged In'}</span>
              </div>
            </div>

            <button 
              className="logout-action-btn"
              onClick={handleLogout}
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="app-main-area">
        {/* Mobile Header with Hamburger Menu */}
        <header className="main-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="mobile-brand-title">
              {currentNavItem?.label || 'ExpenseTracker'}
            </h2>
          </div>

          <button 
            className="sidebar-quick-add"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', margin: 0, fontSize: '0.8rem' }}
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle size={16} />
            <span>Add</span>
          </button>
        </header>

        {/* Page Content Outlet */}
        <main className="main-content-scroll">
          <Outlet context={{ refreshTrigger, triggerRefresh: () => setRefreshTrigger((p) => p + 1) }} />
        </main>
      </div>

      {/* Universal Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => setRefreshTrigger((p) => p + 1)}
      />
    </div>
  );
};
