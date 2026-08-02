import { useState, useEffect } from 'react';
import { Home, Calendar, Timer, CheckSquare, Settings, Moon, Sun, Menu, X } from 'lucide-react';

const Sidebar = ({ currentTab, setCurrentTab, theme, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const tabs = [
    { id: 'tracker', label: 'Daily Tracker', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: Calendar },
    { id: 'goals', label: 'Seva & Goals', icon: CheckSquare },
    { id: 'timer', label: 'Focus Timer', icon: Timer },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="btn-icon mobile-menu-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 50, display: 'none' }} // Handled via CSS for mobile
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="brand-logo">
            <span style={{ color: 'var(--primary-color)' }}>FOLK</span> SadhnaSync
          </h2>
        </div>

        <nav className="sidebar-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-item ${currentTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab(tab.id);
                  setIsOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <>
                <Sun size={20} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={20} />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

export default Sidebar;
