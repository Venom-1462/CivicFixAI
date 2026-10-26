// src/components/AiTriageCenter.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bot, AlertTriangle, ShieldAlert, CheckCircle2, 
  ArrowRight, Sparkles, Filter, Copy, RefreshCw, 
  Layers, Users, MapPin, IndianRupee, Clock, ChevronDown, 
  ChevronUp, Database, FileText, Check, AlertCircle, Wrench,
  Zap, Droplets, Cone, Truck, Ban, Trash2, ListChecks, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeComplaintWithGemma } from '../services/ollamaService';
import DuplicateDetectionBadge from './DuplicateDetectionBadge';
import SyntheticDataModal from './SyntheticDataModal';
import OllamaModelStatus from './OllamaModelStatus';
import RejectReasonModal from './RejectReasonModal';
import { getFastDuplicateInfo, detectAllDuplicates } from '../services/imageHashService';

interface Issue {
  id: string;
  title: string;
  description: string;
  category?: string;
  state?: string;
  city?: string;
  pincode?: string;
  locationText?: string;
  imageUrl?: string;
  status?: string;
  assignedTo?: string;
  price?: string | number;
  contractorName?: string;
  isSynthetic?: boolean;
  userName?: string;
  citizenName?: string;
  duplicateMerged?: boolean;
  primaryIssueId?: string;
  aiAnalysis?: {
    category?: string;
    severity?: string;
    urgency?: 'Critical' | 'High' | 'Medium' | 'Low';
    urgencyScore?: number;
    urgencyReason?: string;
    summary?: string;
    estimatedTime?: string;
    recommendedDepartment?: 'Electrician' | 'Plumber' | 'Road Maintenance' | 'Garbage Collector' | 'All Rounder';
    recommendedAction?: string;
    actionChecklist?: string[];
    citizenReplyDraft?: string;
    precautions?: string[];
    diyFixes?: string[];
    duplicateAssessment?: {
      isDuplicate?: boolean;
      confidence?: number;
      matchedIssueId?: string;
      matchedTitle?: string;
      reason?: string;
    };
    modelUsed?: string;
  };
  createdAt?: any;
}

interface Props {
  issues: Issue[];
  onUpdateStatus: (issueId: string, newStatus: string, extraData?: any) => void;
  onDelete: (issueId: string) => void;
  onRefresh?: () => void;
}

const DEPARTMENTS = [
  { id: 'Electrician', icon: Zap, color: 'bg-yellow-600', textColor: 'text-yellow-400', defaultPrice: '850' },
  { id: 'Plumber', icon: Droplets, color: 'bg-blue-600', textColor: 'text-blue-400', defaultPrice: '600' },
  { id: 'Road Maintenance', icon: Cone, color: 'bg-orange-600', textColor: 'text-orange-400', defaultPrice: '1500' },
  { id: 'Garbage Collector', icon: Truck, color: 'bg-green-600', textColor: 'text-green-400', defaultPrice: '400' },
  { id: 'All Rounder', icon: Wrench, color: 'bg-purple-600', textColor: 'text-purple-400', defaultPrice: '500' },
];

export const AiTriageCenter: React.FC<Props> = ({ 
  issues = [], 
  onUpdateStatus, 
  onDelete,
  onRefresh 
}) => {
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState<boolean>(false);
  const [filterPendingOnly, setFilterPendingOnly] = useState<boolean>(false);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  
  // Human Reviewer Editing State per issue
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, {
    department: string;
    urgency: string;
    price: string;
    reviewerNote: string;
  }>>({});

  const [triagingId, setTriagingId] = useState<string | null>(null);
  const [isBatchTriaging, setIsBatchTriaging] = useState<boolean>(false);
  const [isSyntheticModalOpen, setIsSyntheticModalOpen] = useState<boolean>(false);
  const [rejectingIssue, setRejectingIssue] = useState<Issue | null>(null);

  // Action Checklist checked state per issue: { [issueId]: { [stepIndex]: boolean } }
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});

  // Dropdown accordions state to keep cards compact & sleek
  const [openChecklists, setOpenChecklists] = useState<Record<string, boolean>>({});
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [openMergedDetails, setOpenMergedDetails] = useState<Record<string, boolean>>({});

  const toggleChecklist = (id: string) => {
    setOpenChecklists(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleReply = (id: string) => {
    setOpenReplies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMergedDetails = (id: string) => {
    setOpenMergedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copied Reply notification state
  const [copiedIssueId, setCopiedIssueId] = useState<string | null>(null);

  const toggleChecklistStep = (issueId: string, stepIndex: number) => {
    setCheckedSteps(prev => ({
      ...prev,
      [issueId]: {
        ...(prev[issueId] || {}),
        [stepIndex]: !prev[issueId]?.[stepIndex]
      }
    }));
  };

  const handleCopyReplyDraft = (issueId: string, replyText: string) => {
    navigator.clipboard.writeText(replyText);
    setCopiedIssueId(issueId);
    setTimeout(() => {
      setCopiedIssueId(null);
    }, 2000);
  };

  const getActionChecklist = (issue: Issue): string[] => {
    if (Array.isArray(issue.aiAnalysis?.actionChecklist) && issue.aiAnalysis.actionChecklist.length === 3) {
      return issue.aiAnalysis.actionChecklist;
    }
    const cat = (issue.aiAnalysis?.category || issue.category || issue.title || '').toLowerCase();
    const desc = (issue.description || '').toLowerCase();
    const text = `${cat} ${desc}`;

    if (text.includes('water') || text.includes('leak') || text.includes('flood') || text.includes('pipe') || text.includes('drainage')) {
      return [
        'Shut off main valve & isolate water line',
        'Barricade flooded area to prevent slips',
        'Dispatch plumber to inspect and seal pipe'
      ];
    }
    if (text.includes('electric') || text.includes('spark') || text.includes('wire') || text.includes('shock') || text.includes('power')) {
      return [
        'Shut off main circuit breaker & isolate live line',
        'Barricade 10m perimeter around hazard',
        'Dispatch emergency electrician unit'
      ];
    }
    if (text.includes('manhole') || text.includes('open drain') || text.includes('pit') || text.includes('sinkhole')) {
      return [
        'Deploy high-visibility barricade over open chamber',
        'Alert campus security & traffic control',
        'Dispatch road crew to install secured lid'
      ];
    }
    if (text.includes('pothole') || text.includes('crater') || text.includes('road damage') || text.includes('asphalt')) {
      return [
        'Deploy caution cones around road crater',
        'Measure cavity depth and vehicular risk',
        'Dispatch road maintenance asphalt patch crew'
      ];
    }
    if (text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('dump')) {
      return [
        'Inspect container overflow & sanitary perimeter',
        'Dispatch municipal sanitation truck for clearance',
        'Sanitize and deodorize collection zone'
      ];
    }
    if (text.includes('tree') || text.includes('branch')) {
      return [
        'Barricade thoroughfare & re-route vehicular traffic',
        'Inspect site for tangled overhead electrical cables',
        'Dispatch maintenance crew with chainsaw equipment'
      ];
    }
    return [
      'Conduct preliminary onsite inspection',
      'Barricade hazardous zone if applicable',
      `Dispatch ${issue.aiAnalysis?.recommendedDepartment || 'maintenance'} team`
    ];
  };

  const getCitizenReplyDraft = (issue: Issue, duplicateCount: number = 0): string => {
    if (!issue) return '';
    if (issue.aiAnalysis?.citizenReplyDraft && duplicateCount <= 0) {
      return issue.aiAnalysis.citizenReplyDraft;
    }
    const dup = getDuplicateInfo(issue);
    const titleText = typeof issue.title === 'string' ? issue.title : '';
    const descText = typeof issue.description === 'string' ? issue.description : '';
    const locMatch = `${titleText} ${descText}`.match(/block\s+[a-z0-9]+|gate\s+[a-z0-9]+|wing\s+[a-z0-9]+|hostel\s+[a-z0-9]+|library/i);
    const loc = locMatch ? locMatch[0] : (issue.locationText || issue.city || 'the reported area');
    const dept = issue.aiAnalysis?.recommendedDepartment || 'Maintenance';
    const rawCat = issue.aiAnalysis?.category || issue.category || 'issue';
    const cat = typeof rawCat === 'string' ? rawCat.toLowerCase() : 'reported issue';

    if (duplicateCount > 0 || dup?.isDuplicate) {
      const countNum = duplicateCount > 0 ? duplicateCount : 1;
      return `Your report regarding the ${cat} at ${loc} has been merged with ${countNum} similar report${countNum > 1 ? 's' : ''} and escalated to ${dept} for priority resolution. Our team is actively addressing the matter.`;
    }
    return `Your report regarding the ${cat} at ${loc} has been reviewed and escalated to ${dept}. A service crew has been dispatched for onsite inspection.`;
  };
  
  // Dynamic Live Duplicate Detection across all loaded complaints
  const [liveDuplicateMap, setLiveDuplicateMap] = useState<Record<string, { matchedIssueId: string; matchedTitle: string; reason: string }>>({});

  useEffect(() => {
    let active = true;
    if (Array.isArray(issues) && issues.length > 0) {
      detectAllDuplicates(issues).then(map => {
        if (active) setLiveDuplicateMap(map || {});
      });
    }
    return () => { active = false; };
  }, [issues]);

  const getDuplicateInfo = (issue: Issue) => {
    if (!issue) return { isDuplicate: false, confidence: 0 };
    if (issue.aiAnalysis?.duplicateAssessment?.isDuplicate) {
      return issue.aiAnalysis.duplicateAssessment;
    }
    const issueKey = issue.id ? String(issue.id) : '';
    if (issueKey && liveDuplicateMap[issueKey]) {
      return { isDuplicate: true, confidence: 100, ...liveDuplicateMap[issueKey] };
    }
    const fast = getFastDuplicateInfo(issue, issues);
    if (fast) {
      return { isDuplicate: true, confidence: 100, ...fast };
    }
    return issue.aiAnalysis?.duplicateAssessment || { isDuplicate: false, confidence: 0 };
  };

  // Group duplicate issues into unified incident clusters
  const issueClusters = React.useMemo(() => {
    const safeIssues = Array.isArray(issues) ? issues.filter(Boolean) : [];
    const clusters: {
      primaryIssue: Issue;
      duplicateIssues: Issue[];
      allIssues: Issue[];
    }[] = [];

    const assignedIds = new Set<string>();

    for (let i = 0; i < safeIssues.length; i++) {
      const issue = safeIssues[i];
      if (!issue) continue;
      const issueId = issue.id ? String(issue.id) : `issue-item-${i}`;
      if (assignedIds.has(issueId)) continue;

      const clusterIssues: Issue[] = [issue];
      assignedIds.add(issueId);

      for (let j = 0; j < safeIssues.length; j++) {
        const other = safeIssues[j];
        if (!other || other === issue) continue;
        const otherId = other.id ? String(other.id) : `issue-item-${j}`;
        if (assignedIds.has(otherId)) continue;

        const dupOther = getDuplicateInfo(other);
        const dupThis = getDuplicateInfo(issue);

        const titleA = typeof issue.title === 'string' ? issue.title.trim().toLowerCase() : '';
        const titleB = typeof other.title === 'string' ? other.title.trim().toLowerCase() : '';
        const locA = (issue.locationText || issue.city || '').toString().trim().toLowerCase();
        const locB = (other.locationText || other.city || '').toString().trim().toLowerCase();

        const isDuplicateMatch = Boolean(
          (issue.id && dupOther?.matchedIssueId && String(dupOther.matchedIssueId) === String(issue.id)) ||
          (other.id && dupThis?.matchedIssueId && String(dupThis.matchedIssueId) === String(other.id)) ||
          (dupOther?.matchedIssueId && dupThis?.matchedIssueId && String(dupOther.matchedIssueId) === String(dupThis.matchedIssueId)) ||
          (issue.imageUrl && other.imageUrl && issue.imageUrl === other.imageUrl) ||
          (titleA && titleB && titleA === titleB && locA && locB && (locA === locB || locA.includes(locB) || locB.includes(locA)))
        );

        if (isDuplicateMatch) {
          clusterIssues.push(other);
          assignedIds.add(otherId);
        }
      }

      // Pick primary issue: prefer non-duplicate, or first
      let primary = clusterIssues[0];
      const nonDup = clusterIssues.find(item => item && !getDuplicateInfo(item)?.isDuplicate);
      if (nonDup) {
        primary = nonDup;
      }
      const duplicateIssues = clusterIssues.filter(item => item && item !== primary);

      clusters.push({
        primaryIssue: primary,
        duplicateIssues,
        allIssues: clusterIssues
      });
    }

    return clusters;
  }, [issues, liveDuplicateMap]);

  // Compute metrics
  const totalCount = issues?.length || 0;
  const criticalCount = (issues || []).filter(i => ((i?.aiAnalysis?.urgency || i?.aiAnalysis?.severity || '').toString().toLowerCase() === 'critical')).length;
  const highCount = (issues || []).filter(i => ((i?.aiAnalysis?.urgency || i?.aiAnalysis?.severity || '').toString().toLowerCase() === 'high')).length;
  const duplicateCount = (issues || []).filter(i => Boolean(getDuplicateInfo(i)?.isDuplicate)).length;
  const pendingReviewCount = (issues || []).filter(i => {
    const s = (i?.status || 'open').toString().toLowerCase();
    return s === 'open' || s === 'pending';
  }).length;
  const rejectedCount = (issues || []).filter(i => (i?.status || '').toString().toLowerCase().includes('reject')).length;

  // Filter issue clusters (memoized for lag-free performance)
  const filteredClusters = React.useMemo(() => {
    return issueClusters.filter(cluster => {
      const issue = cluster?.primaryIssue;
      if (!issue) return false;
      const statusStr = (issue.status || 'open').toString().toLowerCase();
      const isRejected = statusStr.includes('reject');
      const isResolved = statusStr === 'resolved';
      const isPending = statusStr === 'open' || statusStr === 'pending';
      const hasDuplicates = cluster.duplicateIssues.length > 0 || Boolean(getDuplicateInfo(issue)?.isDuplicate);

      // Direct tab filters
      if (filterUrgency === 'all') {
        if (filterPendingOnly && !isPending) return false;
        if (filterDuplicatesOnly && !hasDuplicates) return false;
        return true; // Show ALL issues
      }
      if (filterUrgency === 'Pending') return isPending;
      if (filterUrgency === 'Resolved') return isResolved;
      if (filterUrgency === 'Rejected') return isRejected;
      if (filterUrgency === 'Duplicates') return hasDuplicates;

      // Urgency level filters (case-insensitive)
      const urgency = (issue.aiAnalysis?.urgency || issue.aiAnalysis?.severity || 'Medium').toString().toLowerCase();
      if (urgency !== filterUrgency.toLowerCase()) return false;
      if (filterPendingOnly && !isPending) return false;
      if (filterDuplicatesOnly && !hasDuplicates) return false;

      return true;
    });
  }, [issueClusters, filterUrgency, filterPendingOnly, filterDuplicatesOnly]);

  const getDraft = (issue: Issue) => {
    if (reviewDrafts[issue.id]) return reviewDrafts[issue.id];
    const recDept = issue.aiAnalysis?.recommendedDepartment || 'All Rounder';
    const deptInfo = DEPARTMENTS.find(d => d.id === recDept) || DEPARTMENTS[4];
    return {
      department: recDept,
      urgency: issue.aiAnalysis?.urgency || issue.aiAnalysis?.severity || 'Medium',
      price: issue.price ? String(issue.price) : deptInfo.defaultPrice,
      reviewerNote: ''
    };
  };

  const updateDraft = (issueId: string, patch: Partial<ReturnType<typeof getDraft>>) => {
    setReviewDrafts(prev => ({
      ...prev,
      [issueId]: {
        ...(prev[issueId] || { department: 'All Rounder', urgency: 'Medium', price: '500', reviewerNote: '' }),
        ...patch
      }
    }));
  };

  // Run or re-run Gemma triage on a single issue
  const handleTriageSingle = async (issue: Issue) => {
    setTriagingId(issue.id);
    try {
      const result = await analyzeComplaintWithGemma({
        title: issue.title,
        description: issue.description,
        categoryHint: issue.category || issue.aiAnalysis?.category,
        locationText: issue.locationText,
        imageUrl: issue.imageUrl,
        existingComplaints: issues.filter(i => i.id !== issue.id)
      });

      onUpdateStatus(issue.id, issue.status || 'OPEN', {
        aiAnalysis: {
          category: result.category,
          severity: result.urgency,
          urgency: result.urgency,
          urgencyScore: result.urgencyScore,
          urgencyReason: result.urgencyReason,
          summary: result.identifiedIssue,
          estimatedTime: result.estimatedTime,
          recommendedDepartment: result.recommendedDepartment,
          recommendedAction: result.recommendedAction,
          actionChecklist: result.actionChecklist,
          citizenReplyDraft: result.citizenReplyDraft,
          duplicateAssessment: result.duplicateAssessment,
          precautions: result.precautions,
          diyFixes: result.diyFixes,
          modelUsed: result.modelUsed
        }
      });
    } catch (e) {
      console.error("Triage error", e);
    } finally {
      setTriagingId(null);
    }
  };

  // Run Gemma triage in batch on unanalyzed or pending complaints
  const handleBatchTriage = async () => {
    setIsBatchTriaging(true);
    const unreviewed = issues.filter(i => !i.aiAnalysis?.recommendedDepartment || !i.status || i.status === 'OPEN');
    
    for (const item of unreviewed) {
      try {
        const result = await analyzeComplaintWithGemma({
          title: item.title,
          description: item.description,
          categoryHint: item.category || item.aiAnalysis?.category,
          locationText: item.locationText,
          imageUrl: item.imageUrl,
          existingComplaints: issues.filter(i => i.id !== item.id)
        });

        onUpdateStatus(item.id, item.status || 'OPEN', {
          aiAnalysis: {
            category: result.category,
            severity: result.urgency,
            urgency: result.urgency,
            urgencyScore: result.urgencyScore,
            urgencyReason: result.urgencyReason,
            summary: result.identifiedIssue,
            estimatedTime: result.estimatedTime,
            recommendedDepartment: result.recommendedDepartment,
            recommendedAction: result.recommendedAction,
            actionChecklist: result.actionChecklist,
            citizenReplyDraft: result.citizenReplyDraft,
            duplicateAssessment: result.duplicateAssessment,
            precautions: result.precautions,
            diyFixes: result.diyFixes,
            modelUsed: result.modelUsed
          }
        });
      } catch (err) {
        console.warn(`Failed batch item ${item.id}`, err);
      }
    }
    setIsBatchTriaging(false);
  };

  // Human Reviewer Approval (dispatches primary & auto-resolves any merged duplicates)
  const handleApproveAndDispatch = (target: Issue | { primaryIssue: Issue; duplicateIssues?: Issue[] }) => {
    const issue = 'primaryIssue' in target ? target.primaryIssue : target;
    const duplicates = 'primaryIssue' in target ? (target.duplicateIssues || []) : [];
    const draft = getDraft(issue);
    if (!draft.price) {
      alert("Please specify a dispatch compensation/price.");
      return;
    }

    onUpdateStatus(issue.id, 'Accepted', {
      assignedTo: draft.department,
      price: draft.price,
      reviewedByHuman: true,
      reviewerNote: draft.reviewerNote || null,
      reviewedAt: new Date().toISOString()
    });

    // Auto-resolve any linked duplicate tickets under this incident
    if (duplicates.length > 0) {
      duplicates.forEach(dup => {
        onUpdateStatus(dup.id, 'Resolved', {
          duplicateMerged: true,
          primaryIssueId: issue.id,
          reviewerNote: `Auto-resolved as merged duplicate of Ticket #${issue.id.slice(0, 8)} (${issue.title})`
        });
      });
    }
  };

  // Human Reviewer Merging Duplicate
  const handleMergeDuplicate = (issue: Issue, duplicates: Issue[] = []) => {
    const targetTitle = issue.aiAnalysis?.duplicateAssessment?.matchedTitle || "Existing Complaint";
    const count = duplicates.length || 1;
    const confirmed = window.confirm(`Merge and resolve ${count} duplicate ticket(s) under "${targetTitle}"?`);
    if (confirmed) {
      onUpdateStatus(issue.id, 'Resolved', {
        duplicateMerged: true,
        reviewerNote: `Merged as duplicate by Human Reviewer. Primary Ticket: ${targetTitle}`
      });
      duplicates.forEach(dup => {
        onUpdateStatus(dup.id, 'Resolved', {
          duplicateMerged: true,
          reviewerNote: `Merged as duplicate by Human Reviewer. Primary Ticket: ${targetTitle}`
        });
      });
    }
  };

  const getUrgencyBadge = (urgency: string = 'Medium') => {
    switch (urgency) {
      case 'Critical':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  const handleRejectAsDiy = (issueId: string, reason: string, diyNotes: string[]) => {
    onUpdateStatus(issueId, 'Rejected (Public DIY)', {
      reviewedByHuman: true,
      rejectionReason: reason,
      publicDiyInstructions: diyNotes,
      rejectedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-7xl mx-auto">
      
      {/* Synthetic Data Modal */}
      <SyntheticDataModal 
        isOpen={isSyntheticModalOpen}
        onClose={() => setIsSyntheticModalOpen(false)}
        existingIssues={issues}
        onIssuesInjected={() => {
          setIsSyntheticModalOpen(false);
          if (onRefresh) onRefresh();
        }}
      />

      {/* Reject & Public DIY Disposal Modal */}
      <RejectReasonModal
        isOpen={!!rejectingIssue}
        issue={rejectingIssue}
        onClose={() => setRejectingIssue(null)}
        onRejectAsDiy={handleRejectAsDiy}
        onDeleteDirectly={onDelete}
      />

      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Bot className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Ollama & Gemma AI Triage Engine
              </span>
              <OllamaModelStatus />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              AI Complaint Triage & Review Center
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl mt-1">
              Automated issue classification, urgency prioritization, duplicate detection, and department routing. Final decisions remain securely with the Human Reviewer.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSyntheticModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-xl text-xs font-bold border border-slate-700 shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Database className="w-4 h-4 text-purple-400" />
              Load Synthetic Data
            </button>

            <button
              type="button"
              onClick={handleBatchTriage}
              disabled={isBatchTriaging}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <RefreshCw className={`w-4 h-4 ${isBatchTriaging ? 'animate-spin' : ''}`} />
              {isBatchTriaging ? 'Triaging with Gemma...' : 'Batch Triage with Gemma'}
            </button>
          </div>
        </div>

        {/* Real-time Gemma & Ollama Live Integration Notification Banner */}
        <div className="mt-5 p-3.5 bg-indigo-950/40 border border-indigo-500/25 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <div className="text-slate-300">
              <span className="font-bold text-white">Live AI Inference Notice: </span>
              To unlock real-time Gemma LLM triage on this site, run <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono text-[11px] border border-slate-800">ollama run gemma:2b</code>. For online deployment (<span className="text-blue-400 font-mono">civic-fix-ai-lac.vercel.app</span>), connect via HTTPS tunnel (<code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono text-[11px] border border-slate-800">cloudflared tunnel --url http://localhost:11434</code>) or enable CORS. Resilient heuristic engine is active as automated fallback.
            </div>
          </div>
          <div className="shrink-0">
            <OllamaModelStatus />
          </div>
        </div>

        {/* Metric Cards (Clickable Quick Filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-6">
          <div 
            onClick={() => setFilterUrgency('all')}
            className={`bg-slate-900/80 border p-3.5 rounded-2xl cursor-pointer transition-all ${
              filterUrgency === 'all' ? 'border-indigo-500 bg-indigo-500/15 shadow-md ring-1 ring-indigo-500' : 'border-slate-800 hover:border-slate-700'
            }`}
            title="View all complaints"
          >
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">All Reports</p>
            <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
          </div>
          <div 
            onClick={() => setFilterUrgency(filterUrgency === 'Pending' ? 'all' : 'Pending')}
            className={`bg-slate-900/80 border p-3.5 rounded-2xl cursor-pointer transition-all ${
              filterUrgency === 'Pending' ? 'border-blue-500 bg-blue-500/15 shadow-md ring-1 ring-blue-500' : 'border-slate-800 hover:border-slate-700'
            }`}
            title="View pending complaints awaiting review"
          >
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Awaiting Review</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{pendingReviewCount}</p>
          </div>
          <div 
            onClick={() => setFilterUrgency(filterUrgency === 'Critical' ? 'all' : 'Critical')}
            className={`bg-slate-900/80 border p-3.5 rounded-2xl cursor-pointer transition-all ${
              filterUrgency === 'Critical' ? 'border-red-500 bg-red-500/15 shadow-md ring-1 ring-red-500' : 'border-slate-800 hover:border-slate-700'
            }`}
            title="View critical priority complaints"
          >
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Critical Priority</p>
            <p className="text-2xl font-black text-red-400 mt-1">{criticalCount}</p>
          </div>
          <div 
            onClick={() => setFilterUrgency(filterUrgency === 'High' ? 'all' : 'High')}
            className={`bg-slate-900/80 border p-3.5 rounded-2xl cursor-pointer transition-all ${
              filterUrgency === 'High' ? 'border-orange-500 bg-orange-500/15 shadow-md ring-1 ring-orange-500' : 'border-slate-800 hover:border-slate-700'
            }`}
            title="View high priority complaints"
          >
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">High Priority</p>
            <p className="text-2xl font-black text-orange-400 mt-1">{highCount}</p>
          </div>
          <div 
            onClick={() => setFilterUrgency(filterUrgency === 'Duplicates' ? 'all' : 'Duplicates')}
            className={`bg-slate-900/80 border p-3.5 rounded-2xl cursor-pointer transition-all ${
              filterUrgency === 'Duplicates' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 hover:border-slate-700'
            }`}
            title="View 100% verified duplicate complaints"
          >
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Copy className="w-3 h-3" /> Duplicates
            </p>
            <p className="text-2xl font-black text-amber-400 mt-1">{duplicateCount}</p>
          </div>
          <div 
            onClick={() => setFilterUrgency(filterUrgency === 'Rejected' ? 'all' : 'Rejected')}
            className={`bg-slate-900/80 border p-3.5 rounded-2xl cursor-pointer transition-all ${
              filterUrgency === 'Rejected' ? 'border-rose-500 bg-rose-500/10' : 'border-slate-800 hover:border-slate-700'
            }`}
            title="View rejected complaints that do not qualify for minimum contractor labour"
          >
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <Ban className="w-3 h-3" /> Rejected
            </p>
            <p className="text-2xl font-black text-rose-400 mt-1">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-bold flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter Queue:
          </span>
          {['all', 'Pending', 'Duplicates', 'Critical', 'High', 'Medium', 'Low', 'Rejected', 'Resolved'].map(u => (
            <button
              key={u}
              type="button"
              onClick={() => setFilterUrgency(u)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                filterUrgency === u
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold select-none">
            <input 
              type="checkbox" 
              checked={filterDuplicatesOnly}
              onChange={(e) => setFilterDuplicatesOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Duplicates Only ({duplicateCount})</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold select-none">
            <input 
              type="checkbox" 
              checked={filterPendingOnly}
              onChange={(e) => setFilterPendingOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Pending Review ({pendingReviewCount})</span>
          </label>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredClusters.length === 0 ? (
          <div className="p-12 text-center bg-slate-800/40 rounded-3xl border border-slate-700/60 border-dashed">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white mb-1">Queue Clear</h3>
            <p className="text-slate-400 text-xs">No complaints match the current filter criteria.</p>
          </div>
        ) : (
          filteredClusters.map((cluster, clusterIdx) => {
            const issue = cluster?.primaryIssue;
            if (!issue) return null;
            const safeIssueId = issue.id ? String(issue.id) : `incident-${clusterIdx}`;
            const ai = issue.aiAnalysis || {};
            const urgency = ai.urgency || ai.severity || 'Medium';
            const draft = getDraft(issue);
            const isExpanded = expandedIssueId === safeIssueId;
            const isTriaging = triagingId === safeIssueId;
            const duplicateInfo = getDuplicateInfo(issue);
            const checklist = getActionChecklist(issue);
            const replyDraft = getCitizenReplyDraft(issue, cluster.duplicateIssues.length);
            const completedCount = checklist.filter((_, idx) => checkedSteps[safeIssueId]?.[idx]).length;

            // Extract unique reporter names safely
            const reporterNames = cluster.allIssues.map((item, itemIdx) => {
              if (!item) return 'Citizen Reporter';
              if (item.userName) return item.userName;
              if (item.citizenName) return item.citizenName;
              const safeId = item.id ? String(item.id).slice(0, 6) : String(itemIdx + 1);
              return `Citizen #${safeId}`;
            });
            const uniqueReporters = Array.from(new Set(reporterNames));

            return (
              <div 
                key={safeIssueId}
                className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl transition-all hover:border-slate-600"
              >
                {/* Main Row */}
                <div className="flex flex-col lg:flex-row items-start justify-between gap-5">
                  
                  {/* Left: Image & Text Summary */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {issue.imageUrl ? (
                      <img 
                        src={issue.imageUrl} 
                        alt="Issue" 
                        className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-600 shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border ${getUrgencyBadge(urgency)}`}>
                          {urgency} Urgency
                        </span>

                        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {ai.category || issue.category || 'General'}
                        </span>

                        {cluster.duplicateIssues.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Layers className="w-3.5 h-3.5 text-amber-400" />
                            Combined ({cluster.allIssues.length} Reports Merged)
                          </span>
                        ) : (
                          duplicateInfo?.isDuplicate && (
                            <DuplicateDetectionBadge duplicateInfo={duplicateInfo} compact />
                          )
                        )}

                        {issue.isSynthetic && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">
                            Synthetic Data
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 font-mono ml-auto">
                          ID: {safeIssueId.slice(0, 8)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white truncate mb-1">
                        {issue.title}
                      </h3>
                      
                      <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed mb-2">
                        {issue.description}
                      </p>

                      {/* Combined Incident Citizen Summary if multiple reports are merged */}
                      {cluster.duplicateIssues.length > 0 && (
                        <div className="mb-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-amber-300 font-bold min-w-0">
                            <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-amber-400 shrink-0">Reported by ({uniqueReporters.length} citizens):</span>
                            <span className="text-slate-200 font-medium truncate max-w-sm">
                              {uniqueReporters.join(', ')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMergedDetails(safeIssueId)}
                            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 ml-auto transition-colors"
                          >
                            <span>{openMergedDetails[safeIssueId] ? 'Hide Details' : `View All ${cluster.allIssues.length} Reports`}</span>
                            {openMergedDetails[safeIssueId] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {issue.locationText || `${issue.city || 'Campus'}, ${issue.state || ''}`}
                        </span>
                        {ai.estimatedTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            SLA: {ai.estimatedTime}
                          </span>
                        )}
                        {ai.modelUsed && (
                          <span className="text-indigo-300/80">
                            Model: {ai.modelUsed}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: AI Recommendation & Human Decision Box (Compact Sleek Width) */}
                  <div className="w-full lg:w-96 bg-slate-950/70 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-between shrink-0">
                    
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2 pb-1.5 border-b border-slate-800">
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                          <Bot className="w-3.5 h-3.5 text-indigo-400" />
                          AI Recommendation:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTriageSingle(issue)}
                          disabled={isTriaging}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 ${isTriaging ? 'animate-spin' : ''}`} />
                          Re-scan
                        </button>
                      </div>

                      <div className="mb-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Target Dept:</span>
                          <span className="font-bold text-indigo-300">
                            {ai.recommendedDepartment || 'All Rounder'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 leading-snug line-clamp-1">
                          <strong className="text-slate-300">Next Action: </strong>
                          {ai.recommendedAction || `Dispatch ${ai.recommendedDepartment || 'crew'} to site.`}
                        </div>
                      </div>

                      {/* 1. 3-Step Action Checklist (Dropdown Accordion) */}
                      <div className="mb-2 border border-slate-800/90 rounded-xl overflow-hidden bg-slate-900/80 transition-all">
                        <button
                          type="button"
                          onClick={() => toggleChecklist(safeIssueId)}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-800/60 transition-colors text-left"
                        >
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
                            <ListChecks className="w-3.5 h-3.5 text-indigo-400" />
                            Action Checklist
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {completedCount === 3 ? 'Completed' : `${completedCount}/3`}
                            </span>
                            {openChecklists[safeIssueId] ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </button>
                        
                        {openChecklists[safeIssueId] && (
                          <div className="p-2 pt-1 space-y-1 border-t border-slate-800/60 animate-in fade-in duration-150">
                            {checklist.map((step, idx) => {
                              const isDone = !!checkedSteps[safeIssueId]?.[idx];
                              return (
                                <label
                                  key={idx}
                                  className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                                    isDone ? 'bg-emerald-500/10 text-emerald-300' : 'hover:bg-slate-800/60 text-slate-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={() => toggleChecklistStep(safeIssueId, idx)}
                                    className="mt-0.5 rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5 shrink-0"
                                  />
                                  <span className={`text-[11px] leading-tight ${isDone ? 'line-through opacity-75' : ''}`}>
                                    {step}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 2. Auto-Drafted Citizen Reply (Dropdown Accordion) */}
                      <div className="mb-2 border border-slate-800/90 rounded-xl overflow-hidden bg-slate-900/80 transition-all">
                        <div 
                          onClick={() => toggleReply(safeIssueId)}
                          className="w-full flex items-center justify-between p-2 hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                            Citizen Reply Draft
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyReplyDraft(safeIssueId, replyDraft);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                                copiedIssueId === safeIssueId
                                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                                  : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 border border-indigo-500/40 shadow-sm'
                              }`}
                              title="Copy reply to clipboard"
                            >
                              {copiedIssueId === safeIssueId ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-white" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>📋 Copy</span>
                                </>
                              )}
                            </button>
                            {openReplies[safeIssueId] ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {openReplies[safeIssueId] && (
                          <div className="p-2 pt-1 border-t border-slate-800/60 animate-in fade-in duration-150">
                            <p className="text-[11px] text-slate-300 italic bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                              "{replyDraft}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Urgency reasoning quote */}
                      {ai.urgencyReason && (
                        <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-1.5 text-[10px] text-slate-400 mb-2 italic line-clamp-1">
                          "{ai.urgencyReason}"
                        </div>
                      )}
                    </div>

                    {/* Human Reviewer Approval Bar */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      {issue.status === 'Accepted' ? (
                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-2.5 text-xs text-indigo-300 font-bold flex items-center justify-between">
                          <span>Dispatched to {issue.assignedTo} (₹{issue.price})</span>
                          <span className="text-[10px] uppercase bg-indigo-500/20 px-1.5 py-0.5 rounded">Active</span>
                        </div>
                      ) : issue.status === 'Resolved' ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-300 font-bold flex items-center justify-between">
                          <span>Resolved</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      ) : issue.status?.includes('Rejected') ? (
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-300 font-bold flex items-center justify-between">
                          <span className="truncate">Rejected: Public Manual Fix</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleTriageSingle(issue)}
                              className="text-[10px] text-slate-400 hover:text-white underline font-semibold"
                            >
                              Re-open
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(issue.id)}
                              className="p-1 hover:text-rose-400 text-slate-400"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveAndDispatch(cluster)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 px-3 text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept & Dispatch {cluster.duplicateIssues.length > 0 && `(${cluster.allIssues.length})`}
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectingIssue(issue)}
                            className="px-2.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            title="Reject if below minimum labour threshold or can be done manually by public"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                            Reject
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(issue.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                            title="Delete ticket directly"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
                          >
                            <span>Override</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      )}

                      {cluster.duplicateIssues.length > 0 && (!issue.status || issue.status === 'OPEN' || issue.status === 'Open') && (
                        <button
                          type="button"
                          onClick={() => handleMergeDuplicate(issue, cluster.duplicateIssues)}
                          className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Merge & Resolve {cluster.duplicateIssues.length} Duplicate(s)
                        </button>
                      )}
                    </div>

                  </div>
                </div>

                {/* Merged Duplicate Complaints Breakdown Drawer */}
                {openMergedDetails[issue.id] && cluster.duplicateIssues.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-3 border-t border-slate-700/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Combined Incident: All Merged Citizen Reports ({cluster.allIssues.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Deduplicated & Consolidated
                      </span>
                    </div>

                    {duplicateInfo?.reason && (
                      <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-200/90 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-300">AI Clustering Reason: </span>
                          {duplicateInfo.reason}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {cluster.allIssues.map((item, idx) => {
                        if (!item) return null;
                        const itemSafeId = item.id ? String(item.id) : `dup-${idx}`;
                        const isPrimary = itemSafeId === safeIssueId;
                        const reporterName = item.userName || (item as any).citizenName || `Citizen #${itemSafeId.slice(0, 6)}`;
                        return (
                          <div 
                            key={itemSafeId} 
                            className={`p-3 rounded-2xl border text-xs flex flex-col justify-between ${
                              isPrimary 
                                ? 'bg-slate-900/90 border-indigo-500/40 shadow-sm' 
                                : 'bg-slate-900/60 border-slate-700/70'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isPrimary 
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {isPrimary ? 'Primary Ticket' : `Duplicate Report #${idx}`}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ID: {itemSafeId.slice(0, 8)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>{reporterName}</span>
                              </div>

                              <p className="text-slate-300 text-[11px] leading-relaxed mb-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                                "{item.description || item.title || 'Incident reported'}"
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                              <span className="truncate max-w-[200px]">
                                📍 {item.locationText || item.city || 'Campus'}
                              </span>
                              {!isPrimary && item.id && (
                                <button
                                  type="button"
                                  onClick={() => onDelete(item.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors flex items-center gap-1"
                                  title="Remove this individual duplicate report"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Human Reviewer Override Drawer */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-700/80 bg-slate-900/60 -mx-5 -mb-5 p-5 rounded-b-3xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-400" />
                        Human Reviewer Override & Routing Controls
                      </h4>
                      <span className="text-[11px] text-slate-500">All reviewer actions logged for audit</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* Department Override */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                          Override Department
                        </label>
                        <select
                          value={draft.department}
                          onChange={(e) => updateDraft(issue.id, { department: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
                        >
                          {DEPARTMENTS.map(d => (
                            <option key={d.id} value={d.id}>{d.id}</option>
                          ))}
                        </select>
                      </div>

                      {/* Urgency Override */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                          Override Urgency
                        </label>
                        <select
                          value={draft.urgency}
                          onChange={(e) => updateDraft(issue.id, { urgency: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      {/* Pricing / Compensation */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                          Dispatch Price (₹)
                        </label>
                        <div className="relative">
                          <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="number"
                            value={draft.price}
                            onChange={(e) => updateDraft(issue.id, { price: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
                            placeholder="Amount in ₹"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Reviewer Note */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Reviewer Directive / Onsite Instructions
                      </label>
                      <input 
                        type="text"
                        value={draft.reviewerNote}
                        onChange={(e) => updateDraft(issue.id, { reviewerNote: e.target.value })}
                        placeholder="e.g. Ensure perimeter cones are set; turn off main conduit breaker first."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setExpandedIssueId(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleApproveAndDispatch(cluster);
                          setExpandedIssueId(null);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save Decisions & Dispatch
                      </button>
                    </div>

                  </motion.div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default AiTriageCenter;
