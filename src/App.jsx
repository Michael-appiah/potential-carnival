import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CodeProvider } from './CodeContext';
import Clearance from './pages/Clearance';
import Verify from './pages/Verify';
import Admin from './pages/Admin';
import Logs from './pages/Logs';
import './App.css';

function App() {
  return (
    <CodeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Clearance />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/ll/lt/yk/logs" element={<Logs />} />
        </Routes>
      </Router>
    </CodeProvider>
  );
}

export default App;
