import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, LogOut, CreditCard, Sun, Moon, TrendingDown, TrendingUp } from 'lucide-react';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/70 dark:bg-[#0E1322]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Custom SVG Aesthetic Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/accounts" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-cyan-500 flex items-center justify-center p-2 shadow-lg shadow-emerald-500/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-200 border border-white/20">
                <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
                  <path 
                    d="M3 18 L10 18 L15 8 L21 26 L27 13 L31 18 L34 18" 
                    stroke="#FFFFFF" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <path 
                    d="M27 6 L28.2 9.5 L32 10.7 L28.2 11.9 L27 15.4 L25.8 11.9 L22 10.7 L25.8 9.5 Z" 
                    fill="#FFFFFF" 
                  />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">
                  Finance<span className="text-emerald-500">Pulse</span>
                </span>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 -mt-1 uppercase tracking-widest">
                  Personal Wealth
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            {user && (
              <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <Link
                  to="/accounts"
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/accounts')
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  Accounts
                </Link>

                <Link
                  to="/expenses"
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/expenses')
                      ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  Expenses
                </Link>

                <Link
                  to="/income"
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/income')
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Income
                </Link>

                <Link
                  to="/profile"
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/profile')
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  Profile
                </Link>
              </div>
            )}
          </div>

          {/* User Nav & Dark Mode Toggle */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60"
                >
                  <div className="relative">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Standard Plan</div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/60 dark:border-emerald-800/60 ml-1">
                    {user.preferredCurrency || 'BDT'}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-md hover:shadow-emerald-500/20 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
