import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Profile from './pages/Profile';
import Accounts from './pages/Accounts';
import Login from './pages/Login';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accounts"
                  element={
                    <ProtectedRoute>
                      <Accounts />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/accounts" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
