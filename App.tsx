import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { UserDashboard } from './pages/UserDashboard';
import { Marketplace } from './pages/Marketplace';
import { MySpots } from './pages/MySpots';
import { AdminDashboard } from './pages/AdminDashboard';
import { Settings } from './pages/Settings';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent login session simulation
    const savedUser = localStorage.getItem('socpark_current_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('socpark_current_session', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('socpark_current_session');
  };

  if (loading) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<UserDashboard user={user} />} />
          <Route path="/home" element={<Marketplace user={user} title="Accueil" />} />
          <Route path="/marketplace" element={<Marketplace user={user} />} />
          <Route path="/my-spots" element={<MySpots user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route 
            path="/admin" 
            element={user.isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;