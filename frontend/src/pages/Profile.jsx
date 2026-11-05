import React, { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  User,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Upload,
  Sparkles,
  Lock,
  Coins,
  Sun,
  Moon,
  Laptop,
  Mail,
  KeyRound,
  Fingerprint,
} from 'lucide-react';

export default function Profile() {
  const { user, updateUserState } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    preferredCurrency: 'BDT',
    maskBalances: false,
    pinEnabled: false,
    securityPin: '',
    newPassword: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setFormData({
        name: data.name || '',
        email: data.email || '',
        avatar: data.avatar || sampleAvatars[0],
        preferredCurrency: data.preferredCurrency || 'BDT',
        maskBalances: data.privacySettings?.maskBalances || false,
        pinEnabled: data.privacySettings?.pinEnabled || false,
        securityPin: '',
        newPassword: '',
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAvatarSelect = (url) => {
    setFormData((prev) => ({ ...prev, avatar: url }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setNotification({ type: 'error', message: 'Please select a valid image file' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setNotification({ type: 'error', message: 'Image size should be less than 2MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
        setNotification({ type: 'success', message: 'Photo preview loaded!' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification({ type: '', message: '' });

    try {
      const payload = {
        name: formData.name,
        avatar: formData.avatar,
        preferredCurrency: formData.preferredCurrency,
        privacySettings: {
          maskBalances: formData.maskBalances,
          pinEnabled: formData.pinEnabled,
          ...(formData.securityPin ? { securityPin: formData.securityPin } : {}),
        },
        ...(formData.newPassword ? { password: formData.newPassword } : {}),
      };

      const res = await updateProfile(payload);

      updateUserState({
        name: res.name,
        avatar: res.avatar,
        preferredCurrency: res.preferredCurrency,
        privacySettings: res.privacySettings,
      });

      setFormData((prev) => ({ ...prev, securityPin: '', newPassword: '' }));
      setNotification({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
          <Sparkles className="w-4 h-4 text-emerald-500 absolute inset-0 m-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Aesthetic Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative group">
            <img
              src={formData.avatar}
              alt="Avatar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-emerald-500/30 border-2 border-white/20 shadow-xl"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all hover:scale-110"
              title="Upload New Photo"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Verified FinancePulse Member
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{formData.name || 'User Profile'}</h1>
            <p className="text-slate-300 text-sm flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {formData.email}
            </p>
          </div>
        </div>
      </div>

      {notification.message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Appearance & Theme Setting */}
        <div className="bg-white dark:bg-[#121826] p-6 sm:p-8 rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                Appearance & Theme
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Switch between clean modern light theme and futuristic dark mode
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                theme === 'light'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <div className="font-bold text-sm">Light Mode</div>
                <div className="text-[11px] opacity-75">Clean & Crisp</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => theme === 'light' && toggleTheme()}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <div className="text-left">
                <div className="font-bold text-sm">Dark Mode</div>
                <div className="text-[11px] opacity-75">Sleek Cyber Obsidian</div>
              </div>
            </button>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-white dark:bg-[#121826] p-6 sm:p-8 rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-6 transition-colors">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Profile Identity</h2>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Select Preset Avatar
            </label>
            <div className="flex items-center gap-3 mb-4">
              {sampleAvatars.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAvatarSelect(url)}
                  className={`relative rounded-full transition-transform hover:scale-110 ${
                    formData.avatar === url ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#121826]' : 'opacity-60'
                  }`}
                >
                  <img src={url} alt={`Option ${idx}`} className="w-11 h-11 rounded-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl text-sm font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Currency Preference */}
        <div className="bg-white dark:bg-[#121826] p-6 sm:p-8 rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Coins className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Primary Ledger Currency</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.preferredCurrency === 'BDT'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="preferredCurrency"
                  value="BDT"
                  checked={formData.preferredCurrency === 'BDT'}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Bangladeshi Taka (BDT)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">National Standard (৳)</div>
                </div>
              </div>
              <span className="text-2xl font-black text-emerald-500">৳</span>
            </label>

            <label
              className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                formData.preferredCurrency === 'USD'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="preferredCurrency"
                  value="USD"
                  checked={formData.preferredCurrency === 'USD'}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">US Dollar (USD)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">International Standard ($)</div>
                </div>
              </div>
              <span className="text-2xl font-black text-emerald-500">$</span>
            </label>
          </div>
        </div>

        {/* Security & Balance Privacy */}
        <div className="bg-white dark:bg-[#121826] p-6 sm:p-8 rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-6 transition-colors">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Privacy & Protection</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {formData.maskBalances ? <EyeOff className="w-4 h-4 text-emerald-500" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  Mask Balances on Startup
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Replaces numeric amounts with dots until toggled with the eye icon.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="maskBalances"
                  checked={formData.maskBalances}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Update Account Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password (optional)"
                className="w-full sm:w-80 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 disabled:opacity-50 text-xs tracking-wider uppercase"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
