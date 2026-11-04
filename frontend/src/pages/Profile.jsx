import React, { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { User, DollarSign, Lock, Shield, Eye, EyeOff, CheckCircle2, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

export default function Profile() {
  const { user, updateUserState } = useAuth();
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

  // Default avatars user can pick from
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
        message: err.response?.data?.message || 'Failed to load profile. Please make sure you are logged in.',
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

  // Direct file upload from computer
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setNotification({ type: 'error', message: 'Please select a valid image file (PNG, JPG, etc.)' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setNotification({ type: 'error', message: 'Image size should be less than 2MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
        setNotification({ type: 'success', message: 'Photo loaded! Click "Save Profile Changes" to keep it.' });
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile & Preferences</h1>
        <p className="text-gray-500 mt-1">
          Manage your personal details, preferred currency (BDT / USD), avatar, and privacy settings.
        </p>
      </div>

      {notification.message && (
        <div
          className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Avatar & Personal Information */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Current Avatar Preview */}
            <div className="flex flex-col items-center gap-3">
              <img
                src={formData.avatar}
                alt="Profile Avatar"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';
                }}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-100 border border-gray-200 shadow-inner"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Avatar Selection & Form Fields */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Preset Avatar or Upload Your Own
                </label>
                <div className="flex items-center gap-3 mb-3">
                  {sampleAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAvatarSelect(url)}
                      className={`relative rounded-full transition-transform hover:scale-105 ${
                        formData.avatar === url ? 'ring-2 ring-emerald-600 ring-offset-2' : 'opacity-70'
                      }`}
                    >
                      <img src={url} alt={`Option ${idx}`} className="w-10 h-10 rounded-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="url"
                    name="avatar"
                    value={formData.avatar.startsWith('data:') ? '' : formData.avatar}
                    onChange={handleChange}
                    placeholder={formData.avatar.startsWith('data:') ? 'Custom uploaded image active' : 'Or paste direct image URL (must end in .jpg, .png)'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Preferred Currency */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-800">Currency Preference</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Select your primary transaction and display currency. All logs and analytics will be rendered with this symbol.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BDT Option */}
            <label
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.preferredCurrency === 'BDT'
                  ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
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
                  <div className="font-semibold">Bangladeshi Taka (BDT)</div>
                  <div className="text-xs text-gray-500">Symbol: ৳ (Local mobile banking & accounts)</div>
                </div>
              </div>
              <span className="text-2xl font-bold text-emerald-700">৳</span>
            </label>

            {/* USD Option */}
            <label
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.preferredCurrency === 'USD'
                  ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
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
                  <div className="font-semibold">US Dollar (USD)</div>
                  <div className="text-xs text-gray-500">Symbol: $ (International & card logging)</div>
                </div>
              </div>
              <span className="text-2xl font-bold text-emerald-700">$</span>
            </label>
          </div>
        </div>

        {/* Section 3: Privacy & Security Settings (R3 Integration) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-800">Privacy & Security Settings</h2>
          </div>

          <div className="space-y-6">
            {/* Balance Masking Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-gray-800 flex items-center gap-2">
                  {formData.maskBalances ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  Mask Account Balances
                </div>
                <div className="text-xs text-gray-500">
                  Hides sensitive balances on Dashboard (shows `••••••` instead of exact amounts).
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* PIN Lock Toggle & Field */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    PIN-based Section Lock
                  </div>
                  <div className="text-xs text-gray-500">
                    Require a 4-digit security PIN before viewing sensitive reports and logs.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="pinEnabled"
                    checked={formData.pinEnabled}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {formData.pinEnabled && (
                <div className="mt-3 pl-6 border-l-2 border-emerald-500">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Set / Update 4-Digit Security PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    name="securityPin"
                    value={formData.securityPin}
                    onChange={handleChange}
                    placeholder="Enter 4-digit PIN (e.g. 1234)"
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank if you want to keep your existing PIN.</p>
                </div>
              )}
            </div>

            {/* Optional Password Update */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Change Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank to keep your current password.</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? 'Saving changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
