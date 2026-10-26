// src/services/ollamaService.ts
// Integration for Ollama and Gemma models with robust fallback and auto-detection

export interface OllamaConfig {
  endpoint: string;
  fallbackEndpoint: string;
  model: string;
  temperature: number;
}

export interface AiComplaintAnalysis {
  identifiedIssue: string;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  urgencyScore: number; // 1-100
  urgencyReason: string;
  recommendedDepartment: 'Electrician' | 'Plumber' | 'Road Maintenance' | 'Garbage Collector' | 'All Rounder';
  recommendedAction: string;
  actionChecklist?: string[];
  citizenReplyDraft?: string;
  estimatedResolutionHours: number;
  estimatedTime: string;
  publicSafetyImpact: string;
  precautions: string[];
  diyFixes: string[];
  category: string;
  duplicateAssessment?: {
    isDuplicate: boolean;
    confidence: number;
    matchedIssueId?: string;
    matchedTitle?: string;
    reason?: string;
  };
  modelUsed: string;
  analyzedAt: string;
}

export interface SyntheticComplaint {
  title: string;
  description: string;
  category: string;
  state: string;
  city: string;
  pincode: string;
  addressDetail: string;
  imageUrl: string;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  isDuplicateOf?: string;
}

const STORAGE_KEY_CONFIG = 'civicfix_ollama_config';

const DEFAULT_CONFIG: OllamaConfig = {
  endpoint: '/api/ollama', // Proxied via Vite dev server to bypass CORS
  fallbackEndpoint: 'http://127.0.0.1:11434',
  model: 'gemma', // Works with gemma, gemma:2b, gemma:7b, gemma2, etc.
  temperature: 0.2,
};

export const getOllamaConfig = (): OllamaConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Error reading Ollama config from localStorage', e);
  }
  return { ...DEFAULT_CONFIG };
};

export const saveOllamaConfig = (config: Partial<OllamaConfig>): OllamaConfig => {
  const current = getOllamaConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving Ollama config to localStorage', e);
  }
  return updated;
};

// Check connection to Ollama and list models
export const checkOllamaStatus = async (customEndpoint?: string): Promise<{
  connected: boolean;
  models: string[];
  gemmaFound: boolean;
  activeModel: string;
  endpoint: string;
  error?: string;
}> => {
  const config = getOllamaConfig();
  const endpointsToTry: string[] = [];
  if (customEndpoint) {
    endpointsToTry.push(customEndpoint);
  } else {
    if (config.endpoint) endpointsToTry.push(config.endpoint);
    if (config.fallbackEndpoint && !endpointsToTry.includes(config.fallbackEndpoint)) {
      endpointsToTry.push(config.fallbackEndpoint);
    }
    if (!endpointsToTry.includes('http://localhost:11434')) {
      endpointsToTry.push('http://localhost:11434');
    }
    if (!endpointsToTry.includes('http://127.0.0.1:11434')) {
      endpointsToTry.push('http://127.0.0.1:11434');
    }
  }

  let lastError: string | undefined;

  for (const ep of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${ep}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const models: string[] = (data.models || []).map((m: any) => m.name || m.model || '');
        const gemmaModel = models.find(m => m.toLowerCase().includes('gemma'));
        
        let active = config.model;
        if (gemmaModel && !models.includes(config.model)) {
          active = gemmaModel;
          saveOllamaConfig({ model: gemmaModel });
        } else if (models.length > 0 && !models.includes(config.model)) {
          // If current model not installed, pick gemma or first available
          active = gemmaModel || models[0];
          saveOllamaConfig({ model: active });
        }

        return {
          connected: true,
          models,
          gemmaFound: !!gemmaModel,
          activeModel: active,
          endpoint: ep
        };
      }
    } catch (err: any) {
      lastError = err?.message || 'Connection failed';
    }
  }

  return {
    connected: false,
    models: [],
    gemmaFound: false,
    activeModel: config.model,
    endpoint: config.endpoint,
    error: lastError || 'Unable to reach Ollama server'
  };
};

// Heuristic fallback analyzer for instant offline resilience
export const generateHeuristicTriage = (
  title: string = '',
  description: string = '',
  categoryHint?: string,
  existingComplaints: any[] = [],
  imageUrl?: string
): AiComplaintAnalysis => {
  const text = `${title} ${description}`.toLowerCase();

  let category = categoryHint || 'General Civic Issue';
  let urgency: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
  let urgencyScore = 55;
  let urgencyReason = 'Standard civic concern requiring routine inspection.';
  let department: 'Electrician' | 'Plumber' | 'Road Maintenance' | 'Garbage Collector' | 'All Rounder' = 'All Rounder';
  let hours = 24;
  let estimatedTime = '24-48 Hours';
  let publicSafetyImpact = 'Moderate disruption to public convenience.';
  let precautions = ['Exercise caution around the reported area.', 'Maintain safe clearance.'];
  let diyFixes = ['Mark the perimeter safely.', 'Report accurate landmark data.'];
  let actionChecklist: string[] = [
    'Conduct preliminary site inspection',
    'Barricade hazardous zone if applicable',
    'Dispatch assigned maintenance crew'
  ];

  if (/(electric|wire|spark|shock|transformer|current|short\s?circuit|high\s?voltage|live\s?cable|electrocution)/i.test(text)) {
    category = 'Electrical Hazard';
    urgency = 'Critical';
    urgencyScore = 95;
    urgencyReason = 'Severe risk of electrocution, fire outbreak, or life-threatening power discharge.';
    department = 'Electrician';
    hours = 3;
    estimatedTime = '2-4 Hours';
    publicSafetyImpact = 'High hazard zone. Immediate cordoning necessary.';
    actionChecklist = [
      'Shut off main circuit breaker & isolate live line',
      'Barricade 10m perimeter around hazard',
      'Dispatch electrician for emergency line repair'
    ];
    precautions = [
      'STAY AWAY at least 10 meters (30 feet) from fallen wires or sparking fixtures.',
      'Do not touch damp walls, metallic fences, or pooled water nearby.',
      'Keep pedestrians and students away from the perimeter.'
    ];
    diyFixes = [
      'Do NOT attempt to handle or poke wires with sticks or metal.',
      'Turn off local branch breakers if safely accessible.',
      'Notify emergency campus / municipal electrical engineers immediately.'
    ];
  } else if (/(manhole|open drain|broken lid|drain cover|sewer pit|sinkhole)/i.test(text)) {
    category = 'Manhole';
    urgency = 'Critical';
    urgencyScore = 90;
    urgencyReason = 'Risk of serious pedestrian fall injury or vehicular wheel trap in open chamber.';
    department = 'Road Maintenance';
    hours = 4;
    estimatedTime = '4-8 Hours';
    publicSafetyImpact = 'Critical fall and drowning hazard, particularly during dark or rainy conditions.';
    actionChecklist = [
      'Deploy high-visibility barricade over open chamber',
      'Alert campus security / traffic patrol',
      'Dispatch road crew to install secured lid'
    ];
    precautions = [
      'Avoid walking near the opening during low visibility or rain.',
      'Place a prominent visual flag or caution barricade near the opening.'
    ];
    diyFixes = [
      'Insert a tall, visible reflective pole or branch to warn passersby.',
      'Place heavy stones or caution cones around the perimeter.'
    ];
  } else if (/(water|leak|pipe|burst|flood|drainage|sewage|overflow|gutter|waterlogging|submerged)/i.test(text)) {
    category = 'Water Leakage / Waterlogging';
    urgency = 'High';
    urgencyScore = 80;
    urgencyReason = 'Active water loss, flooding of roadways/walkways, and damage to sub-foundations.';
    department = 'Plumber';
    hours = 6;
    estimatedTime = '4-6 Hours';
    publicSafetyImpact = 'Roadway submergence, breeding grounds for vectors, slippery walkways.';
    actionChecklist = [
      'Shut off main valve & isolate water line',
      'Barricade flooded area to prevent slips',
      'Dispatch plumber to inspect and seal pipe'
    ];
    precautions = [
      'Avoid driving two-wheelers through deep opaque water.',
      'Watch out for submerged pits or exposed cabling beneath water.'
    ];
    diyFixes = [
      'Clear surface trash blocking nearby storm grates.',
      'Divert flow away from server rooms or ground-floor classrooms with sandbags.'
    ];
  } else if (/(pothole|pit|crater|broken road|asphalt damage|damaged road|trench|crack)/i.test(text)) {
    category = 'Potholes';
    urgency = 'Medium';
    urgencyScore = 65;
    urgencyReason = 'Surface cavity hazardous to vehicles and two-wheelers.';
    department = 'Road Maintenance';
    hours = 24;
    estimatedTime = '24-48 Hours';
    publicSafetyImpact = 'Vehicle tire/suspension damage and sudden braking collision hazard.';
    actionChecklist = [
      'Deploy caution cones around road crater',
      'Measure cavity depth and vehicle hazard',
      'Dispatch road maintenance asphalt patch crew'
    ];
    precautions = ['Reduce speed when driving through this sector.', 'Avoid sudden swerving into adjacent lanes.'];
    diyFixes = ['Mark with bright spray chalk or road cones.', 'Temporary cold-mix aggregate if permitted.'];
  } else if (/(garbage|trash|waste|dump|smell|stink|rubbish|dustbin|litter|plastic|decay)/i.test(text)) {
    category = 'Garbage';
    urgency = 'Low';
    urgencyScore = 40;
    urgencyReason = 'Solid waste accumulation causing hygiene and odor nuisance.';
    department = 'Garbage Collector';
    hours = 36;
    estimatedTime = '1-2 Days';
    publicSafetyImpact = 'Odor, pest proliferation, and campus cleanliness impact.';
    actionChecklist = [
      'Inspect container overflow & sanitary risk',
      'Dispatch municipal sanitation truck for clearance',
      'Sanitize and deodorize collection zone'
    ];
    precautions = ['Keep trash bags sealed.', 'Wear gloves or face masks in the vicinity.'];
    diyFixes = ['Ensure bin lids are closed tightly.', 'Coordinate with local sanitation shift crew.'];
  } else if (/(tree|branch|fallen|uprooted|blocking|timber)/i.test(text)) {
    category = 'Fallen Tree';
    urgency = 'High';
    urgencyScore = 75;
    urgencyReason = 'Physical blockage of roadway or campus thoroughfare.';
    department = 'Road Maintenance';
    hours = 12;
    estimatedTime = '12-24 Hours';
    publicSafetyImpact = 'Traffic choke point and access barrier for emergency vehicles.';
    actionChecklist = [
      'Barricade thoroughfare & re-route vehicular traffic',
      'Inspect site for tangled overhead electrical cables',
      'Dispatch maintenance crew with chainsaw equipment'
    ];
    precautions = ['Do not stand below hanging weakened branches.', 'Watch for entangled electrical cables.'];
    diyFixes = ['Clear lightweight branches from pedestrian pathways.', 'Divert foot traffic safely.'];
  }

  // --- STRICT 100% ACCURATE DUPLICATE & IMAGE ANALYSIS RULE ---
  // USER RULE:
  // 1. Analyze images carefully.
  // 2. Only consider duplicate if 100% accurate.
  // 3. If 2 images of potholes (or water leakage, garbage) are given, DO NOT consider them same!
  let duplicateAssessment: AiComplaintAnalysis['duplicateAssessment'] = {
    isDuplicate: false,
    confidence: 0
  };

  if (existingComplaints && existingComplaints.length > 0) {
    const currentImg = (imageUrl || '').trim();
    const currentTitle = (title || '').trim().toLowerCase();
    const currentDesc = (description || '').trim().toLowerCase();

    for (const item of existingComplaints) {
      const itemImg = (item.imageUrl || item.image || '').trim();
      const itemTitle = (item.title || '').trim().toLowerCase();
      const itemDesc = (item.description || '').trim().toLowerCase();
      const isExplicitDuplicate = item.isDuplicateOf && item.isDuplicateOf.toLowerCase() === currentTitle;

      // 1. Both complaints have images with identical URL/source
      if (currentImg && itemImg && currentImg === itemImg) {
        duplicateAssessment = {
          isDuplicate: true,
          confidence: 100,
          matchedIssueId: item.id,
          matchedTitle: item.title,
          reason: `100% Visual Image Match: Identical photo detected across tickets. Conclusively verified duplicate.`
        };
        break;
      }

      // 2. Same Title AND Same Specific Location (Identical incident reported at exact same spot)
      const thisLocation = (locationText || text || '').toLowerCase();
      const itemLocation = (item.addressDetail || item.locationText || `${item.city || ''} ${item.state || ''}`).trim().toLowerCase();
      const sameLocation = Boolean(itemLocation && thisLocation && (thisLocation.includes(itemLocation) || itemLocation.includes(thisLocation)));

      if (currentTitle && itemTitle && currentTitle === itemTitle && sameLocation) {
        duplicateAssessment = {
          isDuplicate: true,
          confidence: 100,
          matchedIssueId: item.id,
          matchedTitle: item.title,
          reason: `100% Visual & Incident Match: Same incident reported at "${item.locationText || item.title}".`
        };
        break;
      }

      // 2. Explicit synthetic link or title match
      if (isExplicitDuplicate || currentTitle === `duplicate: ${itemTitle}` || itemTitle === `duplicate: ${currentTitle}`) {
        duplicateAssessment = {
          isDuplicate: true,
          confidence: 100,
          matchedIssueId: item.id,
          matchedTitle: item.title,
          reason: `100% Verified Duplicate: Explicit duplicate report linked to "${item.title}".`
        };
        break;
      }

      // 3. No images available: only 100% exact text and location match
      if (!currentImg && !itemImg && currentTitle && itemTitle) {
        const itemLocation = (item.addressDetail || item.locationText || '').trim().toLowerCase();
        const thisLocation = (text || '').toLowerCase();

        if (currentTitle === itemTitle && currentDesc === itemDesc && itemLocation && thisLocation.includes(itemLocation)) {
          duplicateAssessment = {
            isDuplicate: true,
            confidence: 100,
            matchedIssueId: item.id,
            matchedTitle: item.title,
            reason: `100% Exact Match: Identical title, description, and exact street location.`
          };
          break;
        }
      }
    }
  }

  const locationMatch = (title || description || '').match(/block\s+[a-z0-9]+|gate\s+[a-z0-9]+|wing\s+[a-z0-9]+|hostel\s+[a-z0-9]+|library/i);
  const locationLabel = locationMatch ? locationMatch[0] : (locationText || 'the reported area');
  const citizenReplyDraft = duplicateAssessment?.isDuplicate
    ? `Your report regarding the ${category.toLowerCase()} at ${locationLabel} has been merged with similar reports and escalated to ${department} for priority maintenance. Thank you for reporting this issue.`
    : `Your report regarding the ${category.toLowerCase()} at ${locationLabel} has been received and escalated to ${department}. A service technician has been dispatched to investigate.`;

  return {
    identifiedIssue: title ? `${title}: ${description.slice(0, 100)}` : description.slice(0, 120),
    urgency,
    urgencyScore,
    urgencyReason,
    recommendedDepartment: department,
    recommendedAction: `Forward request to ${department} team with priority ${urgency}.`,
    actionChecklist,
    citizenReplyDraft,
    estimatedResolutionHours: hours,
    estimatedTime,
    publicSafetyImpact,
    precautions,
    diyFixes,
    category,
    duplicateAssessment,
    modelUsed: 'gemma (heuristic fallback)',
    analyzedAt: new Date().toISOString()
  };
};

// Call Ollama with Gemma model for Deep Complaint Triage
export const analyzeComplaintWithGemma = async (params: {
  title: string;
  description: string;
  categoryHint?: string;
  locationText?: string;
  imageUrl?: string;
  existingComplaints?: any[];
}): Promise<AiComplaintAnalysis> => {
  const { title, description, categoryHint, locationText, imageUrl, existingComplaints = [] } = params;
  const config = getOllamaConfig();

  // Summary of existing complaints for duplicate detection prompt
  const existingSummary = existingComplaints.slice(0, 15).map((c, idx) => ({
    id: c.id || `ISSUE-${idx + 1}`,
    title: c.title,
    category: c.category || c.aiAnalysis?.category,
    location: c.locationText || c.city || '',
    imageUrl: c.imageUrl || c.image || ''
  }));

  const systemPrompt = `You are Gemma, an AI civic and campus triage officer.
You read incoming complaints for public agencies, university campuses, and municipal service teams.
Your job is to:
1. Identify the core issue accurately.
2. Determine urgency ("Critical", "High", "Medium", "Low") and provide a 1-100 score with reasoning.
3. Check for duplicates or closely related complaints among existing tickets.
4. Recommend the exact department: "Electrician", "Plumber", "Road Maintenance", "Garbage Collector", or "All Rounder".
5. Recommend immediate next action for a human reviewer: Provide a 3-step action checklist (actionChecklist) with 3 clickable action items (e.g., ["Shut off main valve", "Dispatch plumber", "Barricade area"]) and an auto-drafted citizen reply (citizenReplyDraft) notifying the citizen of status, routing, and any merged duplicate reports.
6. Provide public safety precautions and temporary mitigations.

CRITICAL DUPLICATE DETECTION RULE (IMAGE & CATEGORY ACCURACY):
- Analyze images carefully: if two complaints have images of potholes, DO NOT consider them duplicates! Two separate potholes on roads are DIFFERENT complaints. The same applies for garbage and water leaks.
- ONLY consider a complaint a duplicate if you are 100% ACCURATE (exact same photo or 100% verified identical physical spot).
- If it is a 100% match, set "isDuplicate": true and "confidence": 100.
- If it is not 100% certain, set "isDuplicate": false and "confidence": 0.

CRITICAL: Return ONLY valid, raw JSON with no markdown backticks, conforming exactly to this structure:
{
  "identifiedIssue": "string",
  "category": "string (Water Leakage / Waterlogging | Potholes | Electrical Hazard | Garbage | Manhole | Fallen Tree | General Civic Issue)",
  "urgency": "Critical | High | Medium | Low",
  "urgencyScore": number (1 to 100),
  "urgencyReason": "string",
  "recommendedDepartment": "Electrician | Plumber | Road Maintenance | Garbage Collector | All Rounder",
  "recommendedAction": "string",
  "actionChecklist": ["Step 1", "Step 2", "Step 3"],
  "citizenReplyDraft": "string (pre-written message to the citizen mentioning status, location, and department or merged reports)",
  "estimatedResolutionHours": number,
  "estimatedTime": "string (e.g. 2-4 Hours, 24-48 Hours)",
  "publicSafetyImpact": "string",
  "precautions": ["string", "string"],
  "diyFixes": ["string", "string"],
  "duplicateAssessment": {
    "isDuplicate": boolean,
    "confidence": number (0 to 100),
    "matchedIssueId": "string or empty",
    "matchedTitle": "string or empty",
    "reason": "string"
  }
}`;

  const userPrompt = `INCOMING COMPLAINT:
Title: "${title || 'Untitled'}"
Description: "${description || 'No description provided'}"
Category Category: "${categoryHint || 'Auto-detect'}"
Location: "${locationText || 'Not specified'}"
Image URL: "${imageUrl || 'None'}"

EXISTING TICKETS IN DATABASE FOR DUPLICATE CHECK:
${JSON.stringify(existingSummary, null, 2)}

Provide your triage JSON assessment now:`;

  const endpointsToTry: string[] = [];
  if (config.endpoint) endpointsToTry.push(config.endpoint);
  if (config.fallbackEndpoint && !endpointsToTry.includes(config.fallbackEndpoint)) {
    endpointsToTry.push(config.fallbackEndpoint);
  }
  if (!endpointsToTry.includes('http://localhost:11434')) {
    endpointsToTry.push('http://localhost:11434');
  }
  if (!endpointsToTry.includes('http://127.0.0.1:11434')) {
    endpointsToTry.push('http://127.0.0.1:11434');
  }

  for (const ep of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${ep}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          system: systemPrompt,
          prompt: userPrompt,
          stream: false,
          format: 'json',
          options: {
            temperature: config.temperature || 0.2,
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data.response;
        
        // Parse JSON from Gemma
        let parsed: any;
        try {
          parsed = JSON.parse(rawText.trim());
        } catch {
          // If Gemma wraps in markdown code block, extract it
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        }

        if (parsed && parsed.urgency && parsed.recommendedDepartment) {
          const checklist = Array.isArray(parsed.actionChecklist) && parsed.actionChecklist.length === 3
            ? parsed.actionChecklist
            : [
                `Isolate and secure immediate perimeter`,
                `Dispatch ${parsed.recommendedDepartment} crew to location`,
                `Verify resolution with citizen / reporting party`
              ];

          const defaultReply = parsed.citizenReplyDraft || (
            parsed.duplicateAssessment?.isDuplicate
              ? `Your report regarding this issue has been merged with similar reports and escalated to ${parsed.recommendedDepartment} for priority maintenance.`
              : `Your report regarding this issue has been received and escalated to ${parsed.recommendedDepartment}. Our team has been dispatched to inspect the site.`
          );

          return {
            identifiedIssue: parsed.identifiedIssue || title || description.slice(0, 80),
            urgency: parsed.urgency,
            urgencyScore: parsed.urgencyScore || (parsed.urgency === 'Critical' ? 95 : parsed.urgency === 'High' ? 80 : parsed.urgency === 'Medium' ? 60 : 35),
            urgencyReason: parsed.urgencyReason || 'Identified by Gemma AI triage model.',
            recommendedDepartment: parsed.recommendedDepartment,
            recommendedAction: parsed.recommendedAction || `Dispatch ${parsed.recommendedDepartment} unit.`,
            actionChecklist: checklist,
            citizenReplyDraft: defaultReply,
            estimatedResolutionHours: parsed.estimatedResolutionHours || 24,
            estimatedTime: parsed.estimatedTime || `${parsed.estimatedResolutionHours || 24} Hours`,
            publicSafetyImpact: parsed.publicSafetyImpact || 'Evaluated for public and campus safety.',
            precautions: Array.isArray(parsed.precautions) ? parsed.precautions : ['Maintain safe distance.'],
            diyFixes: Array.isArray(parsed.diyFixes) ? parsed.diyFixes : ['Notify on-duty authorities.'],
            category: parsed.category || categoryHint || 'General Civic Issue',
            duplicateAssessment: (() => {
              let da = parsed.duplicateAssessment || { isDuplicate: false, confidence: 0 };
              if (da.confidence < 100) {
                return { isDuplicate: false, confidence: 0 };
              }
              if (imageUrl && existingComplaints.length > 0) {
                const matched = existingComplaints.find(e => e.id === da.matchedIssueId);
                if (matched && matched.imageUrl && matched.imageUrl !== imageUrl) {
                  return { isDuplicate: false, confidence: 0 };
                }
              }
              return da;
            })(),
            modelUsed: `${config.model} (via Ollama)`,
            analyzedAt: new Date().toISOString()
          };
        }
      }
    } catch (e: any) {
      console.warn(`Ollama request to ${ep} did not respond:`, e?.message);
    }
  }

  // Graceful offline fallback
  console.log('Using robust heuristic fallback triage engine for Gemma.');
  return generateHeuristicTriage(title, description, categoryHint, existingComplaints, imageUrl);
};

// Synthetic complaint batch for testing public agency / campus triage
export const getPrebuiltSyntheticComplaints = (): SyntheticComplaint[] => [
  {
    title: "Campus Library North Wing Main Water Line Burst",
    description: "Major water leak on the first floor near student study cubicles. Water pooling rapidly, risk of water damage to books and electrical conduits on the floor.",
    category: "Water Leakage / Waterlogging",
    state: "Karnataka",
    city: "Bengaluru",
    pincode: "560001",
    addressDetail: "University Central Library, Ground Floor corridor",
    imageUrl: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80",
    urgency: "High"
  },
  {
    title: "Hostel Block 4 Electrical Sparking and Smoke",
    description: "Main distribution box on 2nd floor corridor is emitting loud sparks and burnt plastic smell. Tripping breaker repeatedly. Students instructed to vacate corridor.",
    category: "Electrical Hazard",
    state: "Maharashtra",
    city: "Mumbai",
    pincode: "400076",
    addressDetail: "Hostel 4, Wing B, 2nd Floor Distribution Board",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    urgency: "Critical"
  },
  {
    title: "Open Drainage Chamber Near Campus Sports Complex",
    description: "Heavy iron manhole lid was displaced during recent heavy showers. 5-foot deep open hole right on the pedestrian jogging track with zero warning markers.",
    category: "Manhole",
    state: "Delhi",
    city: "New Delhi",
    pincode: "110001",
    addressDetail: "University Sports Track, North Bend near Pavilion",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80",
    urgency: "Critical"
  },
  {
    title: "Deep Pothole at Main Entrance Gate Causing Traffic Snarl",
    description: "3-foot wide, 6-inch deep road crater right at the vehicle security barrier. Vehicles bottoming out and campus shuttles cannot pass safely without sudden braking.",
    category: "Potholes",
    state: "Karnataka",
    city: "Bengaluru",
    pincode: "560001",
    addressDetail: "Campus Main Gate 1, Inbound Lane",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    urgency: "Medium"
  },
  {
    title: "DUPLICATE: Heavy Water Leak in Central Library",
    description: "Water flooding near the study hall in library. Students complaining of wet carpet and slippery tiles. Seems identical to the morning burst pipe report.",
    category: "Water Leakage / Waterlogging",
    state: "Karnataka",
    city: "Bengaluru",
    pincode: "560001",
    addressDetail: "Central Library, Ground Floor reading section",
    imageUrl: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80",
    urgency: "High",
    isDuplicateOf: "Campus Library North Wing Main Water Line Burst"
  },
  {
    title: "Overflowing Garbage and Wet Waste Dump Behind Student Cafeteria",
    description: "3 large municipal containers overflowing with food waste and packaging. Strong putrid odor entering the cafeteria dining area, attracting stray animals and flies.",
    category: "Garbage",
    state: "Tamil Nadu",
    city: "Chennai",
    pincode: "600036",
    addressDetail: "Student Dining Complex, Rear Loading Dock",
    imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
    urgency: "Low"
  }
];
