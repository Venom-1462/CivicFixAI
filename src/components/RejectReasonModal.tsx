// src/components/RejectReasonModal.tsx
import React, { useState } from 'react';
import { 
  X, AlertOctagon, Trash2, Wrench, CheckCircle2, 
  HelpCircle, Sparkles, UserCheck 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  issue: any;
  onClose: () => void;
  onRejectAsDiy: (issueId: string, reason: string, diyNotes: string[]) => void;
  onDeleteDirectly: (issueId: string) => void;
}

export const RejectReasonModal: React.FC<Props> = ({
  isOpen,
  issue,
  onClose,
  onRejectAsDiy,
  onDeleteDirectly,
}) => {
  if (!isOpen || !issue) return null;

  const defaultReason = "Does not qualify for minimum contractor labour threshold; can be addressed manually by the public/community.";
  const [selectedReason, setSelectedReason] = useState<string>(defaultReason);
  const [customNote, setCustomNote] = useState<string>('');

  const aiDiyFixes = issue.aiAnalysis?.diyFixes || [
    "Mark area with temporary caution marker if necessary.",
    "Clear minor debris using domestic cleaning tools.",
    "No heavy machinery or specialist contractor needed."
  ];

  const handleConfirmRejectDiy = () => {
    const finalReason = customNote ? `${selectedReason} - ${customNote}` : selectedReason;
    onRejectAsDiy(issue.id, finalReason, aiDiyFixes);
    onClose();
  };

  const handleConfirmDelete = () => {
    onDeleteDirectly(issue.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-rose-500/30 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Reject Complaint / Below Minimum Labour</h3>
              <p className="text-xs text-rose-300/80">Public manual resolution & ticket disposal</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Issue Summary */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <p className="text-slate-400 font-mono text-[11px] mb-1">Target Ticket:</p>
            <p className="text-white font-bold text-sm truncate">{issue.title}</p>
            <p className="text-slate-400 text-xs line-clamp-2 mt-1">{issue.description}</p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Rejection & Labour Assessment Reason
            </label>
            <div className="space-y-2">
              {[
                "Does not qualify for minimum contractor labour threshold; can be addressed manually by the public/community.",
                "Minor cosmetic or domestic fix; does not require municipal/campus contractor dispatch.",
                "Public self-service task (e.g. surface litter pickup, minor dry leaves, domestic tap tightening).",
                "Non-qualifying complaint with zero structural or safety hazard."
              ].map((r, i) => (
                <label 
                  key={i} 
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === r 
                      ? 'bg-rose-500/10 border-rose-500/40 text-white font-bold' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="rejectionReason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="mt-0.5 text-rose-600 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span className="leading-relaxed">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Directives */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Additional Public Guidance Note (Optional)
            </label>
            <input 
              type="text" 
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Residents can place waste in green bin or request community rake"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500"
            />
          </div>

          {/* Gemma AI DIY Fixes preview */}
          {aiDiyFixes && aiDiyFixes.length > 0 && (
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Gemma DIY Recommendations for Public Resolution:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {aiDiyFixes.slice(0, 3).map((f: string, idx: number) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <button
            type="button"
            onClick={handleConfirmDelete}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
            title="Permanently remove this ticket from the system"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            Delete Ticket Directly
          </button>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRejectDiy}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              Reject & Mark Public DIY
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RejectReasonModal;
