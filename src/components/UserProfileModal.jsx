// src/components/UserProfileModal.jsx
import React, { useState } from 'react';
import { X, User, Mail, Save, Loader2 } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase'; 

const UserProfileModal = ({ user, onClose }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName
        });
        alert("Profile updated successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" /> Edit Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Avatar Placeholder */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 p-[3px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {user?.photoURL && !imgError ? (
                    <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" /* <--- CRITICAL FIX FOR GOOGLE IMAGES */
                        onError={(e) => {
                            console.error("Image failed to load:", e);
                            setImgError(true);
                        }} 
                    />
                ) : (
                    <span className="text-3xl font-bold text-white">
                        {displayName.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
                    </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            
            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Your Name"
                />
              </div>
            </div>

            {/* Email Input (Read Only) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500 ml-1">Email cannot be changed directly.</p>
            </div>

            {/* Save Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;