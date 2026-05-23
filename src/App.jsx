import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CodeProvider } from './CodeContext';
import Recharge from './pages/Recharge';
import Clearance from './pages/Clearance';
import Verify from './pages/Verify';
import Admin from './pages/Admin';
import Logs from './pages/Logs';
import UsersAdmin from './pages/UsersAdmin';
import './App.css';

function App() {
  return (
    <CodeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Recharge />} />
          <Route path="/purchase/auth" element={<Clearance />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/ll/lt/yk/logs" element={<Logs />} />
          <Route path="/users/admin" element={<UsersAdmin />} />
        </Routes>
      </Router>
    </CodeProvider>
  );
}

export default App;
