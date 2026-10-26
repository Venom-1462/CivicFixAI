import React, { useState } from 'react';
import { MapPin, Clock, Star, Send } from 'lucide-react'; 
import DuplicateDetectionBadge from './DuplicateDetectionBadge';
import { motion } from 'framer-motion'; 

const IssueCard = ({ issue, onClick, onSubmitReview, compact = false }) => {
  const { category, severity, summary } = issue.aiAnalysis || {};
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false); // Added submission state

  const isResolved = issue.status === 'Resolved';
  const hasReviewed = issue.isReviewed;

  const handleReviewSubmit = async (e) => {
    e.stopPropagation(); 
    if (rating === 0) return alert("Please select a star rating!");
    if (onSubmitReview) {
        setIsSubmitting(true);
        await onSubmitReview(issue.id, rating, comment);
        setIsSubmitting(false);
    }
  };

  // --- NEW: NEON STATUS STYLES ---
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.15)]';
      case 'In Progress': return 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]';
      default: return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
    }
  };

  const statusClass = getStatusStyle(issue.status || 'Open');

  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -4, borderColor: 'rgba(59, 130, 246, 0.4)' }}
      className={`bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 overflow-hidden flex flex-col relative shadow-xl cursor-pointer group hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 ${compact ? 'mb-3' : 'h-full'}`}
    >
      {/* Image Section */}
      <div className={`relative overflow-hidden ${compact ? 'h-24' : 'h-48'}`}>
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-60"></div>
        
        <motion.img 
          src={issue.imageUrl} 
          alt={category} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        />
        
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {issue.aiAnalysis?.duplicateAssessment?.isDuplicate && (
            <DuplicateDetectionBadge duplicateInfo={issue.aiAnalysis.duplicateAssessment} compact />
          )}
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusClass} uppercase tracking-wider backdrop-blur-md`}>
            {issue.status || "Open"}
          </span>
        </div>
      </div>
      
      {/* Content Section */}
      <div className={`${compact ? 'p-3' : 'p-5'} flex-1 flex flex-col`}>
        <div className="flex justify-between items-start mb-2">
            <h3 className={`font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors ${compact ? 'text-xs' : 'text-lg'}`}>
            {issue.title || category || "Reported Issue"}
            </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3 font-medium">
             <Clock className="w-3 h-3 text-slate-500"/> 
             {new Date(issue.createdAt?.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {/* --- REVIEW SECTION --- */}
        
        {/* CASE 1: ALREADY REVIEWED */}
        {hasReviewed ? (
            <div className={`mt-auto bg-slate-800/40 border border-slate-700/50 rounded-xl ${compact ? 'p-2' : 'p-3'}`}>
                <div className="flex items-center justify-between mb-1">
                    {!compact && <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wide">Your Review</span>}
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < issue.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                        ))}
                    </div>
                </div>
                {!compact && <p className="text-xs text-slate-300 italic line-clamp-2">"{issue.review}"</p>}
            </div>
        ) : isResolved && !compact ? (
            // CASE 2: RESOLVED (Review Form) - DARK THEME
            <div className="mt-auto bg-slate-800/30 border border-slate-700/50 p-3 rounded-2xl backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                <p className="text-[10px] font-bold text-blue-400 mb-2 uppercase text-center tracking-wider">Rate Resolution</p>
                <div className="flex justify-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                            <Star className={`w-5 h-5 ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        value={comment} 
                        onChange={(e) => setComment(e.target.value)} 
                        className="flex-1 bg-slate-950/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                    />
                    <button 
                        onClick={handleReviewSubmit} 
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                        <Send className="w-3 h-3" />
                    </button>
                </div>
            </div>
        ) : (
            // CASE 3: STANDARD DESCRIPTION
            <p className={`text-slate-400 mb-2 line-clamp-2 leading-relaxed ${compact ? 'text-[10px]' : 'text-sm'}`}>
                {issue.description || summary}
            </p>
        )}

      </div>
    </motion.div>
  );
};

export default IssueCard;