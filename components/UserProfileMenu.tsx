/**
 * User Profile Menu
 * Dropdown menu for authenticated user actions.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings, UserCircle, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../services/authContext';

export const UserProfileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all group"
      >
        <div className="relative">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name || user.email}
              className="w-8 h-8 rounded-full object-cover border border-indigo-500/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <User size={16} className="text-indigo-400" />
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#020205]" />
        </div>

        <div className="flex flex-col items-start mr-2">
          <span className="text-sm font-medium text-indigo-100 group-hover:text-white transition-colors">
            {user.display_name || user.email.split('@')[0]}
          </span>
          <span className="text-[10px] text-indigo-400/80 uppercase tracking-wider">Operator</span>
        </div>

        <ChevronDown
          size={14}
          className={`text-indigo-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
          >
            {/* User Header */}
            <div className="p-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <UserCircle size={24} className="text-indigo-400" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">
                    {user.display_name || 'Neural Operator'}
                  </span>
                  <span className="text-xs text-slate-400 truncate">{user.email}</span>
                </div>
              </div>
              {user.is_verified && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-full w-fit">
                  <CheckCircle2 size={10} className="text-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-300 uppercase tracking-wide">
                    Verified Account
                  </span>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                onClick={() => console.debug('Profile settings')}
              >
                <Settings size={16} />
                <span className="text-sm">Account Settings</span>
              </button>

              <div className="h-px bg-white/5 my-1" />

              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
              >
                <LogOut size={16} />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>

            <div className="p-2 border-t border-white/5 bg-black/20 text-center">
              <span className="text-[10px] text-slate-600 font-mono">
                SESSION ID: {user.id.substring(0, 8)}...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfileMenu;
