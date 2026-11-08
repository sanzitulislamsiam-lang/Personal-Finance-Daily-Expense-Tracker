import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PrivacyProvider } from './context/PrivacyContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import PinLock from './components/common/PinLock';
import Profile from './pages/Profile';
import Accounts from './pages/Accounts';
import ExpenseLog from './pages/ExpenseLog';
import IncomeLog from './pages/IncomeLog';
import Login from './pages/Login';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PrivacyProvider>
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
                        <PinLock section="accounts">
                          <Accounts />
                        </PinLock>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/expenses"
                    element={
                      <ProtectedRoute>
                        <PinLock section="transactions">
                          <ExpenseLog />
                        </PinLock>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/income"
                    element={
                      <ProtectedRoute>
                        <PinLock section="transactions">
                          <IncomeLog />
                        </PinLock>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/accounts" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </PrivacyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
