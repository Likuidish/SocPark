import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, LayoutDashboard, Car, Calendar, Users, Menu, X, Settings, Home, PlusCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Updated to emerald (green) shades
  const isActive = (path: string) => location.pathname === path ? "bg-emerald-700 text-white" : "text-emerald-100 hover:bg-emerald-800";
  
  const toggleMenu = () => setIsSidebarOpen(!isSidebarOpen);
  const closeMenu = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Menu Button */}
      <div className="absolute top-4 left-4 z-20 lg:hidden">
        <button 
          onClick={toggleMenu}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-md shadow-md hover:bg-emerald-800 transition-colors"
        >
          <Menu size={20} />
          <span className="font-medium text-sm">Menu</span>
        </button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-emerald-900 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:shadow-none shadow-2xl
      `}>
        <div className="p-6 border-b border-emerald-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SocPark</h1>
            <p className="text-xs text-emerald-300 mt-1">Gestion de Parking</p>
          </div>
          {/* Close button for mobile */}
          <button onClick={closeMenu} className="lg:hidden text-emerald-300 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
          <div className="px-2 py-2 mb-4 bg-emerald-800 rounded-lg">
             <p className="text-sm font-medium">{user.username}</p>
             <p className="text-xs text-emerald-300 truncate">Place: {user.assignedSpot}</p>
             {user.isAdmin && <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-yellow-500 text-black font-bold rounded">ADMIN</span>}
          </div>

          <div className="mb-4">
              <button 
                  onClick={() => {
                      navigate('/home');
                      closeMenu();
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                  <PlusCircle size={20} />
                  Réserver
              </button>
          </div>

          <nav className="flex flex-col gap-1">
            <Link 
              to="/home" 
              onClick={closeMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/home')}`}
            >
              <Home size={20} />
              <span>Accueil</span>
            </Link>

            <Link 
              to="/" 
              onClick={closeMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/')}`}
            >
              <LayoutDashboard size={20} />
              <span>Tableau de bord</span>
            </Link>
            
            <Link 
              to="/my-spots" 
              onClick={closeMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/my-spots')}`}
            >
              <Calendar size={20} />
              <span>Mes disponibilités</span>
            </Link>

            <Link 
              to="/settings" 
              onClick={closeMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/settings')}`}
            >
              <Settings size={20} />
              <span>Paramètres</span>
            </Link>

            {user.isAdmin && (
              <>
                <div className="my-2 border-t border-emerald-800"></div>
                <p className="px-4 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Administration</p>
                <Link 
                  to="/admin" 
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/admin')}`}
                >
                  <Users size={20} />
                  <span>Utilisateurs</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-emerald-800">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-emerald-100 hover:bg-emerald-800 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full relative">
        <div className="p-8 max-w-7xl mx-auto mt-14 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
};