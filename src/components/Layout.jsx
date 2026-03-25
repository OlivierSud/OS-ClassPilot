import { Home, Calendar, Users, Settings, MonitorPlay } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <>
      <main>
        <Outlet />
      </main>
      
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home />
          <span>Accueil</span>
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar />
          <span>Calendrier</span>
        </NavLink>
        <NavLink to="/classes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users />
          <span>Classes</span>
        </NavLink>
        <a 
          href="https://oliviersud.github.io/OS-blender-course/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="nav-item"
        >
          <MonitorPlay />
          <span>Blender</span>
        </a>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings />
          <span>Réglages</span>
        </NavLink>
      </nav>
    </>
  );
};

export default Layout;
