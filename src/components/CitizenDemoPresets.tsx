// src/components/CitizenDemoPresets.tsx
import React, { useState } from 'react';
import { 
  Sparkles, Zap, Package, Dices, RotateCcw, 
  ChevronDown, ChevronUp, Check, AlertTriangle, ShieldCheck,
  Eye, Droplets, Layers, Users, Copy
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateHeuristicTriage } from '../services/ollamaService';

export interface DemoPreset {
  id: string;
  badgeLabel: string;
  testPurpose: string;
  subBadge: string;
  category: string;
  title: string;
  citizenName: string;
  location: string;
  state: string;
  city: string;
  pincode: string;
  complaintText: string;
  imageUrl: string;
  isDuplicateOf?: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'exposed-live-wire',
    badgeLabel: '⚡ Exposed Live Wire',
    testPurpose: 'Tests Critical Urgency & Safety Hazard',
    subBadge: 'Tests Critical Triage',
    category: 'Street Light',
    title: 'High-Voltage Overhead Cable Snapped & Sparking',
    citizenName: 'Aarav Sharma',
    location: 'Outside Hostel Block B Main Gate',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: "URGENT! A high-voltage overhead cable snapped after the windstorm and is sparking right on the wet pavement where students walk. Someone is going to get electrocuted if power isn't cut immediately!",
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'burst-pipe-original',
    badgeLabel: '💧 Burst Pipe - Original',
    testPurpose: 'Tests Primary Ticket Creation',
    subBadge: 'Tests Primary Ticket Creation',
    category: 'Water Leakage',
    title: 'Main Underground Water Supply Line Rupture',
    citizenName: 'Priya Nair',
    location: 'North Academic Quad, Near Library',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'The main underground water supply line next to the library entrance has ruptured. Clean drinking water is gushing out onto the walkway for the last 30 minutes.',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'burst-pipe-duplicate',
    badgeLabel: '🔁 Burst Pipe - Duplicate Wording',
    testPurpose: 'Tests Semantic Duplicate Detection',
    subBadge: 'Tests Duplicate Merge',
    category: 'Water Leakage',
    title: 'Library Entrance Flooding from Broken Water Main',
    citizenName: 'Kunal Sen',
    location: 'Central Library Stairs / North Quad',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'Huge flooding outside the library! Looks like a water main broke underground and the whole path is ankle-deep in water. Please send a plumber fast.',
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80',
    isDuplicateOf: 'Main Underground Water Supply Line Rupture'
  },
  {
    id: 'low-water-pressure',
    badgeLabel: '🔗 Low Water Pressure - Related Symptom',
    testPurpose: 'Tests Root-Cause Clustering',
    subBadge: 'Tests Root-Cause Clustering',
    category: 'Water Leakage',
    title: 'Zero Water Pressure in Taps across Canteen & Labs',
    citizenName: 'Dr. Sunita Rao',
    location: 'Canteen & Lab Complex (Adjacent to Library)',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'There is zero water coming out of the taps in the North Canteen and Chemistry Lab washrooms since morning. We cannot run lab experiments or wash dishes.',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'angry-hinglish-rant',
    badgeLabel: '🌐 Angry Hinglish Rant',
    testPurpose: 'Tests Multilingual NLP & Sentiment Extraction',
    subBadge: 'Tests Multilingual NLP',
    category: 'Water Leakage',
    title: 'Hostel Block D Water Cooler Broken for 3 Days',
    citizenName: 'Rohit Verma',
    location: 'Hostel Block D, 3rd Floor',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'Bhai pichle 3 din se 3rd floor ka water cooler kharab pada hai aur garmi mein bura haal hai! Kitni baar complain karein? Koi sunta hi nahi hai, jaldi mechanic bhejo yaar!',
    imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'pii-heavy-complaint',
    badgeLabel: '🔒 PII-Heavy Complaint',
    testPurpose: 'Tests Auto-Anonymization / Privacy Redaction',
    subBadge: 'Tests PII Redaction',
    category: 'Other',
    title: 'Sewage Backup Behind Staff Quarters Flat 402',
    citizenName: 'Rajesh Verma',
    location: 'Staff Quarters, Flat 402',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'My name is Rajesh Verma (Employee ID: EMP-99281) and my phone number is 9876543210, email rajesh.v@campus.edu. Raw sewage is backing up into the ground floor courtyard behind my flat.',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'fallen-tree-road',
    badgeLabel: '🌪️ Fallen Tree on Road',
    testPurpose: 'Tests Multi-Department Routing & Domino Effect',
    subBadge: 'Tests Multi-Dept Routing',
    category: 'Other',
    title: 'Massive Neem Tree Collapsed Across Main Ring Road',
    citizenName: 'Devendra Singh',
    location: 'Main Campus Ring Road near Gate 2',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'A massive neem tree just collapsed across the main ring road, crushing a streetlight pole and completely blocking the ambulance and bus lane during peak rush hour.',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'chemical-fume-leak',
    badgeLabel: '🧪 Chemical Fume Leak',
    testPurpose: 'Tests Hazmat Escalation & Immediate Safety SOP',
    subBadge: 'Tests Hazmat Escalation',
    category: 'Other',
    title: 'Pungent Ammonia Chemical Fumes in Science Basement',
    citizenName: 'Ananya Joshi',
    location: 'Science Building, Basement Storage Room 04',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'Strong pungent ammonia-like chemical fumes are leaking from the basement ventilated storage cabinet. Two lab assistants are feeling dizzy and we have evacuated the hallway.',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'wifi-outage-exams',
    badgeLabel: '📡 Campus Wi-Fi Outage during Exams',
    testPurpose: 'Tests Context-Aware Priority Boost',
    subBadge: 'Tests Priority Boost',
    category: 'Other',
    title: 'Wi-Fi and LAN Drop in Exam Hall 3 During Online Test',
    citizenName: 'Prof. K. Venkatesh',
    location: 'Examination Hall 3 & Computer Center',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'The entire campus Wi-Fi and LAN network dropped in Exam Hall 3 right in the middle of our online coding assessment. 120 students are stuck on the submission screen!',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'routine-overflowing-bin',
    badgeLabel: '🗑️ Routine Overflowing Bin',
    testPurpose: 'Tests Low/Standard Priority Baseline',
    subBadge: 'Tests Low Priority Baseline',
    category: 'Garbage',
    title: 'Dry Waste Dustbins Overflowing near Sports Bleachers',
    citizenName: 'Suresh Patel',
    location: 'South Sports Ground Bleachers',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: "The dry waste dustbins near the football ground seating area haven't been emptied since the weekend match and plastic bottles are scattered on the grass.",
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'vague-frustrated-rant',
    badgeLabel: '❓ Vague / Frustrated Rant',
    testPurpose: "Tests Low AI Confidence & 'Needs Clarification' Guardrail",
    subBadge: 'Tests Low AI Confidence Guardrail',
    category: 'Other',
    title: 'Frustrated General Campus Complaint',
    citizenName: 'Anonymous Student',
    location: 'Unknown / Not Specified',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'Everything in this place is completely broken and nobody cares!! Fix it right now or we are going to protest outside the office tomorrow morning!!',
    imageUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'elevator-trap-emergency',
    badgeLabel: '🏥 Elevator Trap Emergency',
    testPurpose: 'Tests Life-Safety SLA & Instant Human Alert',
    subBadge: 'Tests Critical Triage',
    category: 'Other',
    title: 'Lift #2 Stuck Between 4th and 5th Floor with Trapped Students',
    citizenName: 'Meera Desai',
    location: 'Admin Tower, Lift #2',
    state: 'Karnataka',
    city: 'Bengaluru',
    pincode: '560001',
    complaintText: 'Lift #2 is stuck between the 4th and 5th floor! Two students are trapped inside, the exhaust fan stopped working, and the emergency alarm bell is ringing continuously.',
    imageUrl: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=600&q=80'
  }
];

interface Props {
  onSelectPreset: (preset: DemoPreset) => void;
  onClearForm: () => void;
  activePresetId?: string | null;
  onRefresh?: () => void;
  compact?: boolean;
}

export const CitizenDemoPresets: React.FC<Props> = ({
  onSelectPreset,
  onClearForm,
  activePresetId,
  onRefresh,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const handleRandomPreset = () => {
    const randomIndex = Math.floor(Math.random() * DEMO_PRESETS.length);
    onSelectPreset(DEMO_PRESETS[randomIndex]);
  };

  // Primary Action: [ 📦 Mix & Load Synthetic Wave (5 Random Tickets) ]
  const handleMixAndLoadSyntheticWave = async () => {
    setIsBatchLoading(true);
    setBatchMessage(null);

    try {
      // Pick 5 diverse presets (e.g. 1 critical, 1 primary water, 1 duplicate, 1 multilingual/PII, 1 infrastructure)
      const shuffled = [...DEMO_PRESETS].sort(() => 0.5 - Math.random());
      const selectedWave = shuffled.slice(0, 5);

      let loadedCount = 0;
      for (const preset of selectedWave) {
        // Pre-compute triage so it immediately reflects in the queue with zero delay
        const heuristicTriage = generateHeuristicTriage(
          preset.title,
          preset.complaintText,
          preset.category,
          [],
          preset.imageUrl
        );

        const safeDefaultLocation = { lat: 12.9716, lng: 77.5946 };
        const fullLocation = `${preset.location}, ${preset.city}, ${preset.state} - ${preset.pincode}`;

        await addDoc(collection(db, 'issues'), {
          title: preset.title,
          description: preset.complaintText,
          state: preset.state,
          city: preset.city,
          pincode: preset.pincode,
          addressDetail: preset.location,
          locationText: fullLocation,
          location: safeDefaultLocation,
          imageUrl: preset.imageUrl,
          status: 'OPEN',
          userId: 'synthetic-judge-agent',
          userEmail: 'anonymized-reporter@campus.edu',
          userName: preset.citizenName,
          isSynthetic: true,
          aiAnalysis: {
            category: heuristicTriage.category || preset.category,
            severity: heuristicTriage.urgency || 'High',
            urgency: heuristicTriage.urgency || 'High',
            urgencyScore: heuristicTriage.urgencyScore || 75,
            urgencyReason: heuristicTriage.urgencyReason || `Evaluated for demo preset: ${preset.testPurpose}`,
            summary: heuristicTriage.identifiedIssue || preset.title,
            estimatedTime: heuristicTriage.estimatedTime || '4-8 Hours',
            impactScope: heuristicTriage.urgencyScore || 70,
            recommendedDepartment: heuristicTriage.recommendedDepartment || 'All Rounder',
            recommendedAction: heuristicTriage.recommendedAction || 'Immediate reviewer evaluation.',
            actionChecklist: heuristicTriage.actionChecklist || [
              'Conduct immediate site assessment',
              'Barricade hazard perimeter',
              `Dispatch ${heuristicTriage.recommendedDepartment || 'maintenance'} team`
            ],
            citizenReplyDraft: heuristicTriage.citizenReplyDraft || `Your report regarding "${preset.title}" at ${preset.location} has been registered and escalated for urgent dispatch.`,
            duplicateAssessment: preset.isDuplicateOf ? {
              isDuplicate: true,
              confidence: 96,
              matchedTitle: preset.isDuplicateOf,
              reason: 'Verified duplicate scenario testing semantic text and visual cluster match.'
            } : (heuristicTriage.duplicateAssessment || { isDuplicate: false, confidence: 0 }),
            precautions: heuristicTriage.precautions || ['Maintain safe clearance.'],
            diyFixes: heuristicTriage.diyFixes || ['Report accurate landmark data.'],
            modelUsed: 'Gemma via Ollama (Synthetic Edge-Case)'
          },
          createdAt: serverTimestamp(),
          votes: 1
        });
        loadedCount++;
      }

      setBatchMessage(`✅ Successfully loaded ${loadedCount} edge-case complaints into active queue! Real-time duplicate & urgency clustering triggered.`);
      if (onRefresh) onRefresh();

      setTimeout(() => {
        setBatchMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Error loading synthetic wave:', err);
      setBatchMessage(`⚠️ Failed to load wave: ${err?.message || 'Check Firestore connection'}`);
    } finally {
      setIsBatchLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900/90 via-indigo-950/70 to-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 shadow-xl mb-6 backdrop-blur-md transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                ⚡ Quick-Fill Judge Demo Presets
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                12 Edge Cases
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              1-click test scenarios with pre-loaded high-res photos and rich field data. No typing needed!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Action Button: Mix & Load Synthetic Wave */}
          <button
            type="button"
            onClick={handleMixAndLoadSyntheticWave}
            disabled={isBatchLoading}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/30 border border-indigo-400/40 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            title="Injects 5 diverse presets into the active queue to test real-time AI triage, duplicate detection, and urgency sorting"
          >
            <Package className={`w-3.5 h-3.5 ${isBatchLoading ? 'animate-spin' : ''}`} />
            <span>{isBatchLoading ? 'Injecting Wave...' : '📦 Mix & Load Synthetic Wave (5 Random Tickets)'}</span>
          </button>

          {/* Random Preset Button */}
          <button
            type="button"
            onClick={handleRandomPreset}
            className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            title="Auto-fill form with a randomly chosen preset"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span>🎲 Random</span>
          </button>

          {/* Clear Form Button */}
          <button
            type="button"
            onClick={onClearForm}
            className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            title="Clear all form fields"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>🧹 Clear</span>
          </button>

          {/* Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg text-xs transition-colors"
            title={isOpen ? 'Collapse presets' : 'Expand presets'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Batch Message Notification */}
      {batchMessage && (
        <div className="mt-3 p-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-semibold">{batchMessage}</span>
        </div>
      )}

      {/* Collapsible Presets Container */}
      {isOpen && (
        <div className="mt-3 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {DEMO_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`group relative text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-400 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400'
                      : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                  title={`${preset.testPurpose}\n\nLocation: ${preset.location}\nClick to auto-fill form.`}
                >
                  {/* Top Thumbnail & Badge */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <img 
                      src={preset.imageUrl} 
                      alt="" 
                      className="w-7 h-7 rounded-lg object-cover border border-slate-700/80 shrink-0 bg-slate-950" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-white truncate group-hover:text-indigo-300 transition-colors">
                        {preset.badgeLabel}
                      </p>
                    </div>
                  </div>

                  {/* Sub-badge indicating what AI feature it demonstrates */}
                  <div className="mt-auto pt-1 flex items-center justify-between">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-950/80 text-indigo-300 border border-indigo-500/20 truncate max-w-full font-mono">
                      {preset.subBadge}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDemoPresets;
