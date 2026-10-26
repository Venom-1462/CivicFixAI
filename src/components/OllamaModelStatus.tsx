// src/components/OllamaModelStatus.tsx
import React, { useState, useEffect } from 'react';
import { 
  Cpu, CheckCircle2, AlertTriangle, RefreshCw, 
  Settings, X, ExternalLink, Zap, Terminal, Globe 
} from 'lucide-react';
import { 
  checkOllamaStatus, 
  getOllamaConfig, 
  saveOllamaConfig, 
  OllamaConfig 
} from '../services/ollamaService';

interface Props {
  compact?: boolean;
  onModelChange?: (model: string) => void;
}

export const OllamaModelStatus: React.FC<Props> = ({ compact = false, onModelChange }) => {
  const [config, setConfig] = useState<OllamaConfig>(getOllamaConfig());
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    models: string[];
    gemmaFound: boolean;
    activeModel: string;
    endpoint: string;
    error?: string;
  }>({
    connected: false,
    models: [],
    gemmaFound: false,
    activeModel: config.model,
    endpoint: config.endpoint
  });

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await checkOllamaStatus(config.endpoint);
      setStatus(res);
      if (res.connected && res.activeModel !== config.model) {
        const updated = saveOllamaConfig({ model: res.activeModel });
        setConfig(updated);
        if (onModelChange) onModelChange(res.activeModel);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSave = () => {
    const updated = saveOllamaConfig(config);
    setConfig(updated);
    if (onModelChange) onModelChange(updated.model);
    checkStatus();
    setIsOpen(false);
  };

  return (
    <>
      {/* Pill Indicator */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
          status.connected
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40 shadow-sm'
            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700/60'
        }`}
        title="Ollama & Gemma Model Status - Click to Configure"
      >
        <span className="relative flex h-2 w-2">
          {status.connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status.connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        </span>

        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-mono truncate max-w-[120px]">
          {status.activeModel || 'gemma'}
        </span>
        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
          status.connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
        }`}>
          {status.connected ? 'Online' : 'Fallback'}
        </span>
      </button>

      {/* Configuration Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Ollama & Gemma Model Hub</h3>
                  <p className="text-xs text-slate-400">Local AI inference engine for complaint triage</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              
              {/* Connection Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                status.connected 
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
              }`}>
                {status.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs flex-1">
                  <p className="font-bold text-sm text-white mb-0.5">
                    {status.connected ? 'Ollama Service Connected' : 'Ollama Offline / Standby'}
                  </p>
                  <p className="leading-relaxed opacity-90">
                    {status.connected 
                      ? `Successfully linked to local Ollama on ${status.endpoint}. Detected ${status.models.length} model(s).`
                      : 'Ollama is currently not reachable on this port. The system is operating seamlessly with the built-in resilient heuristic AI engine.'}
                  </p>
                  {status.error && !status.connected && (
                    <p className="mt-1 font-mono text-[11px] text-amber-400/80">
                      Reason: {status.error}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Ollama API Endpoint
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={config.endpoint}
                      onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                      placeholder="/api/ollama or http://127.0.0.1:11434"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={checkStatus}
                      disabled={loading}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      Check
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tip: Use <code className="text-indigo-300">/api/ollama</code> for zero-CORS Vite proxying to <code className="text-indigo-300">http://127.0.0.1:11434</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Selected Model
                  </label>
                  {status.models.length > 0 ? (
                    <select
                      value={config.model}
                      onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    >
                      {status.models.map(m => (
                        <option key={m} value={m}>
                          {m} {m.toLowerCase().includes('gemma') ? '★ (Gemma Recommended)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text"
                      value={config.model}
                      onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      placeholder="e.g. gemma, gemma:2b, gemma2, gemma:7b"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    />
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Compatible with Gemma models (<code className="text-indigo-300">gemma:2b</code>, <code className="text-indigo-300">gemma:7b</code>, <code className="text-indigo-300">gemma2</code>).
                  </p>
                </div>

                {/* Quick Start Guide */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <Terminal className="w-4 h-4" />
                    <span>How to Run Gemma in Ollama locally:</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                    <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-between">
                      <code>ollama run gemma:2b</code>
                      <span className="text-slate-500 text-[10px]">Fast & Light</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-between">
                      <code>ollama run gemma</code>
                      <span className="text-slate-500 text-[10px]">Full Gemma</span>
                    </div>
                  </div>
                </div>

                {/* Online Deployment Guide */}
                <div className="bg-gradient-to-br from-indigo-950/50 to-slate-950 border border-indigo-500/25 rounded-2xl p-4 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <Globe className="w-4 h-4" />
                    <span>Using Ollama with Online Deployment (civic-fix-ai-lac.vercel.app):</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Browsers block HTTP requests to localhost from HTTPS sites due to mixed content restrictions. To connect your local Gemma to the live site:
                  </p>
                  <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                    <div className="p-2 bg-slate-900/90 rounded-lg flex items-center justify-between border border-slate-800">
                      <code>cloudflared tunnel --url http://localhost:11434</code>
                      <span className="text-emerald-400 text-[10px] font-bold">Free & Instant</span>
                    </div>
                    <div className="p-2 bg-slate-900/90 rounded-lg flex items-center justify-between border border-slate-800">
                      <code>npx localtunnel --port 11434</code>
                      <span className="text-indigo-400 text-[10px]">Alternative</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Paste the generated <code className="text-indigo-300 font-mono">https://...</code> URL in the Endpoint field above and click <strong>Save & Apply Model</strong>.
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">For direct local connection, start Ollama with CORS allowed:</span>
                    <code className="block mt-1 p-1.5 bg-slate-900 rounded text-slate-300 font-mono">
                      $env:OLLAMA_ORIGINS="*" ; ollama serve
                    </code>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save & Apply Model
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default OllamaModelStatus;
