import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Signup     from './pages/Signup';
import Dashboard  from './pages/Dashboard';
import CardView   from './pages/CardView';
import AuthGuard  from './components/AuthGuard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"                element={<Landing />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/signup"          element={<Signup />} />
          <Route path="/dashboard"       element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/card/:username"  element={<CardView />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
