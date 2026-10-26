// src/components/LiveTrackerModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, Clock, MapPin, AlertTriangle, Activity } from 'lucide-react';

const LiveTrackerModal = ({ issues, onClose }) => {
  const trackableIssues = (issues || []).filter(i => !i.status || !i.status.toLowerCase().includes('reject'));
  
  const getProgressStep = (status) => {
    if (!status) return 0;
    const s = status.toLowerCase();
    if (s === 'resolved') return 3;
    if (s === 'in progress' || s === 'in_progress') return 2;
    if (s === 'accepted') return 1;
    return 0;
  };

  const getStatusColor = (status) => {
    const s = status ? status.toLowerCase() : 'open';
    if (s === 'resolved') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (s === 'in progress') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (s === 'accepted') return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 w-full max-w-4xl h-[80vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header - UPDATED: Dark */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 z-10">
          <div>
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-500" /> Live Issue Tracker
             </h2>
             <p className="text-slate-400 text-sm">Real-time status of civic repairs</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Scrollable Content - UPDATED: Dark Background */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 space-y-6">
          {trackableIssues.length === 0 ? (
            <div className="text-center py-20 opacity-50 text-slate-500">
                <p>No active issues to track.</p>
            </div>
          ) : (
            trackableIssues.map((issue) => {
               const currentStep = getProgressStep(issue.status);
               
               return (
                <motion.div 
                    key={issue.id}
                    layout
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden"
                >
                    {/* Top Row */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                            {issue.imageUrl ? (
                                <img src={issue.imageUrl} alt="Thumb" className="w-16 h-16 rounded-lg object-cover bg-slate-800 border border-slate-700" />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                                    <AlertTriangle className="w-6 h-6 text-slate-500" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-bold text-white">{issue.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {issue.locationText || 'Unknown'}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(issue.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(issue.status)}`}>
                            {issue.status || 'Open'}
                        </span>
                    </div>

                    {/* Progress Bar Container - UPDATED: Dark Colors */}
                    <div className="relative pt-4 pb-2 px-2">
                        {/* The Dark Background Line */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full"></div>
                        
                        {/* The Colored Progress Line */}
                        <div 
                            className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                            style={{ width: `${(currentStep / 3) * 100}%` }}
                        />

                        {/* Steps (Bubbles) */}
                        <div className="relative flex justify-between w-full">
                            {[
                                { label: "Reported", step: 0 },
                                { label: "Accepted", step: 1 },
                                { label: "In Progress", step: 2 },
                                { label: "Resolved", step: 3 }
                            ].map((item, idx) => {
                                const isCompleted = idx <= currentStep;
                                const isCurrent = idx === currentStep;

                                return (
                                    <div key={idx} className="flex flex-col items-center gap-2 group cursor-default">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10
                                            ${isCompleted ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-900 border-slate-700 text-slate-600'}
                                            ${isCurrent ? 'scale-110 ring-2 ring-blue-500/30' : ''}
                                        `}>
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isCompleted ? 'text-blue-400' : 'text-slate-600'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Info */}
                    {currentStep === 3 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-sm font-medium"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            This issue has been successfully resolved by the team.
                        </motion.div>
                    )}
                </motion.div>
               );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LiveTrackerModal;