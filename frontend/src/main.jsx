import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import AppointmentConfirmationPage from './pages/AppointmentConfirmationPage';
import PublicBookingPage from './pages/PublicBookingPage';

// =============================================================================
// Configura React, Roteamento, AuthProvider e CSS global
// =============================================================================

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/agendamento" element={<PublicBookingPage />} />
          <Route path="/confirmacao/:token" element={<AppointmentConfirmationPage />} />
          <Route path="*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
