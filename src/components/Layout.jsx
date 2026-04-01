import { Home, Calendar, Users, Settings, Compass } from 'lucide-react';
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
        <NavLink to="/blender" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Compass />
          <span>Blender</span>
        </NavLink>
        <NavLink to="/classes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users />
          <span>Classes</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings />
          <span>Réglages</span>
        </NavLink>
      </nav>
    </>
  );
};

export default Layout;
