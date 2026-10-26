// src/components/SyntheticDataModal.tsx
import React, { useState } from 'react';
import { 
  Database, Sparkles, CheckCircle2, X, PlusCircle, 
  Building2, School, AlertTriangle, Loader2 
} from 'lucide-react';
import { 
  getPrebuiltSyntheticComplaints, 
  SyntheticComplaint, 
  analyzeComplaintWithGemma 
} from '../services/ollamaService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onIssuesInjected?: () => void;
  existingIssues?: any[];
}

export const SyntheticDataModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onIssuesInjected,
  existingIssues = [] 
}) => {
  const [selectedSet, setSelectedSet] = useState<'campus' | 'agency' | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const prebuilt = getPrebuiltSyntheticComplaints();

  const handleInject = async () => {
    setLoading(true);
    setSuccessCount(null);
    let count = 0;

    try {
      for (const item of prebuilt) {
        // Run AI triage for this synthetic complaint so it enters pre-analyzed with Gemma
        const aiTriage = await analyzeComplaintWithGemma({
          title: item.title,
          description: item.description,
          categoryHint: item.category,
          locationText: `${item.addressDetail}, ${item.city}, ${item.state} - ${item.pincode}`,
          imageUrl: item.imageUrl,
          existingComplaints: existingIssues
        });

        // Add to Firestore
        await addDoc(collection(db, "issues"), {
          title: item.title,
          description: item.description,
          state: item.state,
          city: item.city,
          pincode: item.pincode,
          addressDetail: item.addressDetail,
          locationText: `${item.addressDetail}, ${item.city}, ${item.state} - ${item.pincode}`,
          location: { lat: 12.9716, lng: 77.5946 },
          imageUrl: item.imageUrl,
          status: "OPEN",
          userId: 'synthetic-agent',
          userEmail: 'anonymized-reporter@campus.edu',
          userName: 'Anonymized Citizen / Campus Reporter',
          isSynthetic: true,
          aiAnalysis: {
            category: aiTriage.category || item.category,
            severity: aiTriage.urgency || item.urgency,
            urgency: aiTriage.urgency || item.urgency,
            urgencyScore: aiTriage.urgencyScore || 70,
            urgencyReason: aiTriage.urgencyReason || 'Synthetic complaint evaluated by Gemma.',
            summary: aiTriage.identifiedIssue || item.description.slice(0, 100),
            estimatedTime: aiTriage.estimatedTime || '24-48 Hours',
            impactScope: aiTriage.urgencyScore || 65,
            recommendedDepartment: aiTriage.recommendedDepartment,
            recommendedAction: aiTriage.recommendedAction,
            actionChecklist: aiTriage.actionChecklist || [
              'Shut off main valve / isolate source',
              'Barricade immediate hazardous area',
              `Dispatch ${aiTriage.recommendedDepartment || 'maintenance'} team`
            ],
            citizenReplyDraft: aiTriage.citizenReplyDraft || `Your report regarding this issue has been received and escalated to ${aiTriage.recommendedDepartment || 'Maintenance'}.`,
            duplicateAssessment: aiTriage.duplicateAssessment || (item.isDuplicateOf ? {
              isDuplicate: true,
              confidence: 88,
              matchedTitle: item.isDuplicateOf,
              reason: 'Simulated high-similarity duplicate complaint for triage evaluation.'
            } : { isDuplicate: false, confidence: 0 }),
            precautions: aiTriage.precautions || [],
            diyFixes: aiTriage.diyFixes || [],
            modelUsed: aiTriage.modelUsed || 'Gemma via Ollama'
          },
          createdAt: serverTimestamp(),
          votes: 1
        });
        count++;
      }

      setSuccessCount(count);
      if (onIssuesInjected) onIssuesInjected();
    } catch (err: any) {
      console.error("Error injecting synthetic data:", err);
      alert("Failed to inject synthetic data: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Synthetic & Anonymized Data Center</h2>
              <p className="text-xs text-indigo-300">Simulate incoming complaint volume for campuses & public agencies</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 text-xs text-indigo-200">
            <p className="font-bold text-white mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Privacy & Anonymization Notice:
            </p>
            <p className="opacity-90 leading-relaxed">
              In accordance with public agency data compliance guidelines, all synthetic complaints are fully anonymized. They contain no real-world Personally Identifiable Information (PII) and include deliberate duplicates to validate AI duplicate detection and triage routing.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Pre-configured Synthetic Complaint Scenarios ({prebuilt.length})</h3>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {prebuilt.map((item, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.urgency === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        item.urgency === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {item.urgency}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">{item.category}</span>
                      {item.isDuplicateOf && (
                        <span className="text-amber-400 text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded font-bold">
                          Simulated Duplicate
                        </span>
                      )}
                    </div>
                    <p className="text-white font-bold truncate">{item.title}</p>
                    <p className="text-slate-400 text-[11px] truncate mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {successCount !== null && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Successfully Injected {successCount} Complaints!</p>
                <p>The AI Triage Center is now populated with synthetic records ready for human review.</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total to load: {prebuilt.length} tickets
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInject}
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating & Triaging with Gemma...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Load Synthetic Dataset
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SyntheticDataModal;
