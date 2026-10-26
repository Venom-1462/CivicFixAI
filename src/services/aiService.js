// src/services/aiService.js
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { analyzeComplaintWithGemma } from './ollamaService';

// Re-export ollamaService types & helpers
export * from './ollamaService';

// --- EXPANDED LOCAL KNOWLEDGE BASE ---
const KNOWLEDGE_BASE = [
  {
    id: "waterlogging",
    category: "Water Leakage / Waterlogging",
    textPattern: /(water|leak|pipe|burst|flood|drainage|sewage|overflow|gutter|clogged|river|lake|submerged|pond|puddle)/i,
    visionPattern: /(water|lake|sea|fountain|pool|stream|river|dam|ocean|geyser|drain|gutter|puddle|bathtub|whirlpool|faucet)/i,
    response: {
      category: "Water Leakage / Waterlogging",
      severity: "High",
      estimatedTime: "4-6 Hours",
      impactScope: 80,
      recommendedDepartment: "Plumber",
      recommendedAction: "Dispatch plumbing & drainage crew to seal leak and clear runoff.",
      actionChecklist: [
        "Shut off main valve / isolate water source",
        "Barricade flooded area to prevent slips",
        "Dispatch plumber to seal leak and clear runoff"
      ],
      citizenReplyDraft: "Your report regarding the water leak / waterlogging has been escalated to Plumber & Maintenance. Our team has been notified for priority repair.",
      summary: "Detected water accumulation or flooding on the roadway, posing safety hazards to commuters.",
      precautions: [
        "Avoid driving through deep stagnant water.",
        "Watch out for submerged potholes or open drains underneath the water.",
        "Keep a safe distance from power lines or street poles near water."
      ],
      diyFixes: [
        "Clear surface leaves or debris blocking nearby storm drain grates.",
        "Divert water away from building entrances using sandbags if available.",
        "Report exact GPS location to municipal water & drainage board."
      ]
    }
  },
  {
    id: "potholes",
    category: "Potholes",
    textPattern: /(pothole|pit|crater|broken road|damaged asphalt|sinkhole|asphalt damage|trench|crack)/i,
    visionPattern: /(asphalt|pavement|dirt|mud|soil|crack|trench|gravel|wheelbarrow|cliff)/i,
    response: {
      category: "Potholes",
      severity: "Medium",
      estimatedTime: "24-48 Hours",
      impactScope: 60,
      recommendedDepartment: "Road Maintenance",
      recommendedAction: "Schedule asphalt patch crew and install temporary safety marker.",
      actionChecklist: [
        "Deploy warning cones around crater",
        "Inspect road base cavity depth",
        "Dispatch road maintenance crew for asphalt patch"
      ],
      citizenReplyDraft: "Your report regarding the road damage / pothole has been logged and assigned to Road Maintenance for scheduled patch repair.",
      summary: "Detected surface degradation and road cavity hazardous to vehicles.",
      precautions: [
        "Place a visible marker or reflective cone near the hole.",
        "Slow down when approaching the damaged section.",
        "Do not fill with loose uncompacted soil."
      ],
      diyFixes: [
        "Fill temporarily with cold-mix asphalt or gravel if safe.",
        "Mark the perimeter with bright chalk or safety tape.",
        "Notify local road maintenance authorities."
      ]
    }
  },
  {
    id: "electrical",
    category: "Electrical Hazard",
    textPattern: /(electric|wire|spark|shock|short\s?circuit|current|pole|street\s?light|lamp|voltage|transformer|power|cable)/i,
    visionPattern: /(lamp|light|lantern|pole|wire|electric|spotlight|street sign|traffic light|power line)/i,
    response: {
      category: "Electrical Hazard",
      severity: "Critical",
      estimatedTime: "2-4 Hours",
      impactScope: 95,
      recommendedDepartment: "Electrician",
      recommendedAction: "Dispatch emergency electrical response team and de-energize affected line.",
      actionChecklist: [
        "Shut off main circuit breaker & isolate live line",
        "Barricade 10m perimeter around hazard",
        "Dispatch emergency electrician unit"
      ],
      citizenReplyDraft: "Your report regarding the electrical hazard has been flagged as Critical and routed to the Emergency Electrical Team for immediate intervention.",
      summary: "High-voltage electrical hazard detected. Immediate intervention required.",
      precautions: [
        "STAY AWAY at least 10 meters (30 feet).",
        "Do not touch any nearby metal fences or damp ground.",
        "Keep children and pets away from the area."
      ],
      diyFixes: [
        "Do NOT attempt to touch or move wires.",
        "Call emergency electrical services immediately.",
        "Cordon off the area with caution tape or cones from a safe distance."
      ]
    }
  },
  {
    id: "garbage",
    category: "Garbage",
    textPattern: /(garbage|trash|waste|dump|smell|stink|rubbish|dustbin|litter|plastic|refuse|debris)/i,
    visionPattern: /(garbage|trash|waste|dustbin|ashcan|carton|bag|plastic|bottle|junk|litter|recycling)/i,
    response: {
      category: "Garbage",
      severity: "Low",
      estimatedTime: "1-2 Days",
      impactScope: 30,
      recommendedDepartment: "Garbage Collector",
      recommendedAction: "Assign municipal sanitation waste truck for scheduled bin clearance.",
      actionChecklist: [
        "Inspect container overflow & sanitary perimeter",
        "Dispatch municipal sanitation truck for clearance",
        "Sanitize and deodorize collection zone"
      ],
      citizenReplyDraft: "Your report regarding accumulated waste has been logged and assigned to our Sanitation team for scheduled clearance.",
      summary: "Accumulated waste posing hygiene, pest, and odor issues.",
      precautions: [
        "Wear a face mask when near the site.",
        "Do not burn plastic or municipal waste.",
        "Keep the surrounding area dry to prevent pest breeding."
      ],
      diyFixes: [
        "Ensure waste bins are covered securely.",
        "Sprinkle bleaching powder around the perimeter to neutralize odor.",
        "Coordinate with municipal sanitation workers for clearance."
      ]
    }
  },
  {
    id: "manhole",
    category: "Manhole",
    textPattern: /(manhole|sewer|drain cover|open drain|chamber|broken lid)/i,
    visionPattern: /(manhole|sewer|disk|hatch|lid|drain|iron cover)/i,
    response: {
      category: "Manhole",
      severity: "Critical",
      estimatedTime: "4-8 Hours",
      impactScope: 90,
      recommendedDepartment: "Road Maintenance",
      recommendedAction: "Deploy immediate safety barricade and install replacement reinforced cover.",
      actionChecklist: [
        "Deploy high-visibility barricade over open chamber",
        "Alert campus security / traffic patrol",
        "Dispatch road crew to install secured lid"
      ],
      citizenReplyDraft: "Your report regarding the open manhole chamber has been marked as Critical Priority and escalated to Road Maintenance for immediate safety covering.",
      summary: "Open or damaged manhole posing severe fall and injury risk.",
      precautions: [
        "Do not walk near the opening during rain or low visibility.",
        "Keep children away from the open chamber.",
        "Avoid driving over cracked or misaligned covers."
      ],
      diyFixes: [
        "Insert a tall, visible warning branch or reflective stick into the hole.",
        "Surround the opening with heavy stones or cones.",
        "Barricade with bright warning tape."
      ]
    }
  },
  {
    id: "tree",
    category: "Fallen Tree",
    textPattern: /(tree|branch|fallen|uprooted|blocking|wood|timber)/i,
    visionPattern: /(tree|branch|wood|log|forest|park|plant|shrub)/i,
    response: {
      category: "Fallen Tree",
      severity: "High",
      estimatedTime: "12-24 Hours",
      impactScope: 70,
      recommendedDepartment: "Road Maintenance",
      recommendedAction: "Dispatch chainsaw clearance crew and clear arterial thoroughfare.",
      actionChecklist: [
        "Barricade thoroughfare & re-route vehicular traffic",
        "Inspect site for tangled overhead electrical cables",
        "Dispatch maintenance crew with chainsaw equipment"
      ],
      citizenReplyDraft: "Your report regarding the fallen tree/branches has been forwarded to Grounds & Road Maintenance for immediate clearance.",
      summary: "Fallen tree or large branch obstructing traffic or public pathways.",
      precautions: [
        "Do not stand under unstable or hanging branches.",
        "Check for power lines tangled in the branches before moving.",
        "Divert oncoming traffic safely around the tree."
      ],
      diyFixes: [
        "Clear small, loose twigs and leaves from pathways.",
        "Mark the obstacle with reflective tape for night visibility.",
        "Contact local forestry or municipal authorities for heavy removal."
      ]
    }
  }
];

// --- AI MODEL CACHE ---
let aiModel = null;

const loadModel = async () => {
  if (!aiModel) {
    try {
      console.log("📥 Loading TensorFlow.js MobileNet model...");
      aiModel = await mobilenet.load();
      console.log("✅ MobileNet Model Ready.");
    } catch (e) {
      console.warn("Could not load MobileNet, relying on Ollama/Gemma & NLP:", e);
    }
  }
  return aiModel;
};

const loadImageForAI = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    if (typeof file === 'string') {
      img.src = file;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    } else {
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      img.onload = () => {
        resolve(img);
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = (err) => reject(err);
    }
  });
};

// --- SMART MATCHING & SCORING ALGORITHM ---
function evaluateBestMatch(userText, visionPredictions = []) {
  let highestScore = 0;
  let bestMatch = null;

  const visionText = visionPredictions.map(p => p.className).join(" ");
  if (visionText) {
    console.log("👁️ Visual AI Predictions:", visionText);
  }

  KNOWLEDGE_BASE.forEach((entry) => {
    let currentScore = 0;

    // 1. Check Vision Predictions
    visionPredictions.forEach((pred) => {
      if (entry.visionPattern.test(pred.className)) {
        currentScore += Math.round(pred.probability * 5);
      }
    });

    // 2. Check User Text Input
    if (entry.textPattern.test(userText)) {
      currentScore += 3;
    }

    // 3. Special Disambiguation
    if (entry.id === "waterlogging" && /(water|lake|fountain|pool|stream|sea|gutter|drain)/i.test(visionText)) {
      currentScore += 4;
    }

    if (currentScore > highestScore) {
      highestScore = currentScore;
      bestMatch = entry.response;
    }
  });

  return bestMatch;
}

// --- FALLBACK RESPONSE ---
const getOfflineFallback = () => ({
  severity: "Medium",
  category: "General Civic Issue",
  estimatedTime: "24-48 Hours",
  impactScope: 50,
  recommendedDepartment: "All Rounder",
  recommendedAction: "Conduct onsite physical inspection to classify requirements.",
  actionChecklist: [
    "Conduct preliminary onsite inspection",
    "Barricade hazardous zone if applicable",
    "Dispatch designated maintenance unit"
  ],
  citizenReplyDraft: "Your report has been received and escalated to our Maintenance department. An inspector has been assigned.",
  precautions: ["Ensure personal safety around the site.", "Maintain a safe distance.", "Inform neighbors if needed."],
  diyFixes: ["Provide accurate landmark details.", "Take clear photos from multiple angles.", "Await municipal inspection."],
  summary: "Issue registered. Flagged for human reviewer assessment.",
  modelUsed: "Ollama Gemma / Heuristic Hybrid"
});

// --- MAIN FUNCTION: HYBRID OLLAMA GEMMA + MULTI-MODAL PIPELINE ---
export const getAiAdvice = async (imageFile, title, description, existingComplaints = []) => {
  console.log("🚀 Running Gemma & Multi-Modal Civic Triage Analysis...");
  const combinedUserText = `${title || ""} ${description || ""}`;
  let visionPredictions = [];
  let visualKeywords = "";

  // 1. Run Visual Classification if image exists
  if (imageFile) {
    try {
      const model = await loadModel();
      if (model) {
        const imgElement = await loadImageForAI(imageFile);
        visionPredictions = await model.classify(imgElement);
        visualKeywords = visionPredictions.map(p => p.className).slice(0, 3).join(", ");
      }
    } catch (error) {
      console.warn("⚠️ Image visual classification skipped:", error);
    }
  }

  // 2. Query Ollama with Gemma model for deep triage, urgency scoring, duplicate detection and routing
  try {
    const enrichedDescription = visualKeywords 
      ? `${description || ''} [Visual tags detected: ${visualKeywords}]` 
      : (description || '');

    const gemmaAnalysis = await analyzeComplaintWithGemma({
      title: title || '',
      description: enrichedDescription,
      imageUrl: (typeof imageFile === 'string' ? imageFile : imageFile?.name) || '',
      existingComplaints
    });

    if (gemmaAnalysis) {
      console.log("🎯 Gemma Analysis Result:", gemmaAnalysis);
      return {
        category: gemmaAnalysis.category || "General Civic Issue",
        severity: gemmaAnalysis.urgency || "Medium",
        urgency: gemmaAnalysis.urgency || "Medium",
        urgencyScore: gemmaAnalysis.urgencyScore || 60,
        urgencyReason: gemmaAnalysis.urgencyReason || "",
        estimatedTime: gemmaAnalysis.estimatedTime || "24-48 Hours",
        impactScope: gemmaAnalysis.urgencyScore || 60,
        recommendedDepartment: gemmaAnalysis.recommendedDepartment || "All Rounder",
        recommendedAction: gemmaAnalysis.recommendedAction || "Forward to human reviewer for confirmation.",
        actionChecklist: gemmaAnalysis.actionChecklist || [
          "Conduct preliminary onsite inspection",
          "Barricade hazardous zone if applicable",
          `Dispatch ${gemmaAnalysis.recommendedDepartment || 'maintenance'} team`
        ],
        citizenReplyDraft: gemmaAnalysis.citizenReplyDraft || `Your report regarding this issue has been escalated to ${gemmaAnalysis.recommendedDepartment || 'Maintenance'}.`,
        summary: gemmaAnalysis.identifiedIssue || gemmaAnalysis.urgencyReason || combinedUserText.slice(0, 100),
        precautions: gemmaAnalysis.precautions || [],
        diyFixes: gemmaAnalysis.diyFixes || [],
        duplicateAssessment: gemmaAnalysis.duplicateAssessment || { isDuplicate: false, confidence: 0 },
        modelUsed: gemmaAnalysis.modelUsed || "Gemma via Ollama"
      };
    }
  } catch (err) {
    console.warn("Gemma analysis attempt encountered an issue, falling back to local multi-modal heuristics:", err);
  }

  // 3. Fallback to Vision + Text Knowledge Base Match
  const match = evaluateBestMatch(combinedUserText, visionPredictions);
  if (match) {
    console.log("🎯 Selected Heuristic Match:", match.category);
    return {
      ...match,
      actionChecklist: match.actionChecklist || [
        "Conduct preliminary onsite inspection",
        "Barricade hazardous zone if applicable",
        `Dispatch ${match.recommendedDepartment || 'maintenance'} team`
      ],
      citizenReplyDraft: match.citizenReplyDraft || `Your report regarding this issue has been escalated to ${match.recommendedDepartment || 'Maintenance'}.`,
      modelUsed: "Heuristic (Gemma compatible)"
    };
  }

  // 4. Return Safe Fallback
  return getOfflineFallback();
};
