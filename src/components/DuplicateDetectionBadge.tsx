// src/components/DuplicateDetectionBadge.tsx
import React from 'react';
import { Copy, AlertCircle, Link as LinkIcon } from 'lucide-react';

interface DuplicateInfo {
  isDuplicate?: boolean;
  confidence?: number;
  matchedIssueId?: string;
  matchedTitle?: string;
  reason?: string;
}

interface Props {
  duplicateInfo?: DuplicateInfo;
  onViewOriginal?: (id: string) => void;
  compact?: boolean;
}

export const DuplicateDetectionBadge: React.FC<Props> = ({ 
  duplicateInfo, 
  onViewOriginal,
  compact = false 
}) => {
  if (!duplicateInfo || !duplicateInfo.isDuplicate) {
    return null;
  }

  const confidence = duplicateInfo.confidence || 75;

  if (compact) {
    return (
      <span 
        title={duplicateInfo.reason || `Potential duplicate (${confidence}% confidence)`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30"
      >
        <Copy className="w-3 h-3 text-amber-400" />
        Duplicate ({confidence}%)
      </span>
    );
  }

  return (
    <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 my-2 text-xs">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Gemma AI Detected Potential Duplicate</span>
        </div>
        <span className="bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
          {confidence}% match
        </span>
      </div>
      
      {duplicateInfo.reason && (
        <p className="text-amber-200/80 mb-2 leading-relaxed">
          {duplicateInfo.reason}
        </p>
      )}

      {duplicateInfo.matchedTitle && (
        <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-amber-500/20">
          <span className="text-slate-300 truncate max-w-[280px]">
            Original: <strong className="text-white">{duplicateInfo.matchedTitle}</strong>
          </span>
          {duplicateInfo.matchedIssueId && onViewOriginal && (
            <button
              type="button"
              onClick={() => onViewOriginal(duplicateInfo.matchedIssueId!)}
              className="flex items-center gap-1 text-amber-400 hover:text-white font-bold text-[11px] transition-colors"
            >
              <LinkIcon className="w-3 h-3" /> View
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DuplicateDetectionBadge;
