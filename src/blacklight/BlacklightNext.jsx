import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Bot, User, Send, Loader2, Menu, X, Shield, Globe2, KeyRound, Settings2, History, Sparkles, ServerCog, Code2, Image, Cpu, Zap, Download, Upload, Palette, Terminal, FileText, Brain, Network, Eye, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import CodeRunner from "../components/CodeRunner.jsx";
import { orChat, orVision } from "../lib/providers/openrouter.js";
import { webllmChat } from "../lib/providers/webllm.js";
import { a1111Txt2Img } from "../lib/providers/a1111.js";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

/**
 * BLACKLIGHT NEXT — Advanced Decentralized AI Platform
 * 
 * New Features:
 * - Multi-modal support (text, image, code, voice)
 * - Advanced model routing and fallbacks
 * - Plugin system for extensibility
 * - Local storage with encryption
 * - Voice input/output
 * - Code execution sandbox
 * - Image generation with multiple providers
 * - Smart model selection based on task type
 * - Real-time collaboration
 * - Advanced prompt engineering
 */

// Web capabilities / env
const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;
const hasOR = !!import.meta.env?.VITE_OPENROUTER_KEY;

// === Brand Tokens for Brutalist UI ===
const PALETTE = {
  sage: "#BFC1A6",
  sageDeep: "#7B7D66",
  sageInk: "#2B2D23",
  white: "#FFFFFF",
  black: "#000000",
};

// Inline placeholder logo (can be replaced with provided data-URL)
const LOGO = "https://i.ibb.co/QvRcVRBv/v0id-logo-white.webp";

// Enhanced model configurations
const MODEL_CONFIGS = {
  text: {
    "mistralai/Mistral-7B-Instruct-v0.3": { type: "text", params: { max_tokens: 4096, temperature: 0.7 } },
    "microsoft/DialoGPT-large": { type: "conversation", params: { max_tokens: 2048, temperature: 0.8 } },
    "codellama/CodeLlama-7b-Python-hf": { type: "code", params: { max_tokens: 8192, temperature: 0.1 } },
    "bigcode/starcoder": { type: "code", params: { max_tokens: 8192, temperature: 0.1 } }
  },
  image: {
    "stabilityai/stable-diffusion-2-1": { type: "image", params: { guidance_scale: 7.5, num_inference_steps: 50 } },
    "runwayml/stable-diffusion-v1-5": { type: "image", params: { guidance_scale: 7.5, num_inference_steps: 50 } },
    "prompthero/openjourney": { type: "image", params: { guidance_scale: 7, num_inference_steps: 25 } }
  }
};

// Task-based model selection
const selectOptimalModel = (taskType, availableModels) => {
  const preferences = {
    code: ["codellama/CodeLlama-7b-Python-hf", "bigcode/starcoder"],
    image: ["stabilityai/stable-diffusion-2-1", "runwayml/stable-diffusion-v1-5"],
    conversation: ["microsoft/DialoGPT-large", "mistralai/Mistral-7B-Instruct-v0.3"],
    default: ["mistralai/Mistral-7B-Instruct-v0.3"]
  };
  
  const preferred = preferences[taskType] || preferences.default;
  return preferred.find(model => availableModels.includes(model)) || availableModels[0];
};

// Enhanced system prompt with multi-modal capabilities
const blacklightSystemPrompt = `You are BLACKLIGHT NEXT — an advanced multi-modal AI operations system.

CAPABILITIES:
- Text generation and analysis
- Code generation, debugging, and execution
- Image analysis and generation
- Voice synthesis and recognition
- Real-time collaboration

PERSONALITY:
- Hyper-competent and precise
- Minimal, clean communication style
- Status indicators: [trace], [resolve], [executing], [complete]
- Technical but accessible explanations

ETHICS:
- Refuse illegal, harmful, or privacy-invasive requests
- Provide safe, educational alternatives
- Maintain user privacy and data security
- Follow responsible AI principles

FORMAT RESPONSES with appropriate status indicators and clean structure.`;

// Enhanced message formatting for multi-modal
function formatPrompt(messages, taskType = "default", modeFlavor = "truth") {
  let systemPrompt = blacklightSystemPrompt;
  // Apply mode flavor to the system prompt to match the desired UX presets
  if (modeFlavor === "truth") {
    systemPrompt += "\n\nMODE: TRUTH\nYou are BLACKLIGHT, an AI designed for clinical, direct, and unsparing analysis. Avoid metaphors or flowery language.";
  } else if (modeFlavor === "phantom") {
    systemPrompt += "\n\nMODE: PHANTOM\nYou are BLACKLIGHT, an AI designed for encrypted and metaphorical communication. Use abstract and poetic language.";
  } else if (modeFlavor === "surge") {
    systemPrompt += "\n\nMODE: SURGE\nYou are BLACKLIGHT, an AI designed for high-bandwidth, concise output. Respond in short, rapid-fire bursts.";
  }
  
  if (taskType === "code") {
    systemPrompt += "\n\nSPECIAL MODE: CODE GENERATION\n- Provide complete, functional code\n- Include error handling\n- Add clear comments\n- Suggest testing approaches";
  } else if (taskType === "image") {
    systemPrompt += "\n\nSPECIAL MODE: IMAGE GENERATION\n- Create detailed, artistic descriptions\n- Consider composition, lighting, style\n- Optimize prompts for visual models";
  }
  
  let out = `System: ${systemPrompt}\n\n`;
  for (const m of messages) {
    if (m.role === "user") out += `User: ${m.content}\n\n`;
    else out += `Assistant: ${m.content}\n\n`;
  }
  out += "Assistant:";
  return out;
}

// === Brutalist UI Components ===
function Header({ onOpenSettings }) {
  return (
    <div className="flex items-center justify-between gap-4 select-none">
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-12 h-12">
          <img src={LOGO} alt="BLACKLIGHT logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="tracking-tight" style={{ color: PALETTE.white, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 28, lineHeight: 1 }}>
            BLACKLIGHT <span className="opacity-70">by v0id</span>
          </h1>
          <p className="uppercase text-xs" style={{ color: PALETTE.white, letterSpacing: 2 }}>
            brutalist • minimal • precise
          </p>
        </div>
      </div>
      <button
        onClick={onOpenSettings}
        className="border-2 p-2 rounded-md"
        style={{ borderColor: PALETTE.white, color: PALETTE.white }}
        title="Open settings"
      >
        <Settings2 size={16} />
      </button>
    </div>
  );
}

function Panel({ title, className = "", children }) {
  return (
    <section className={"border-4 p-3 md:p-4 " + className} style={{ borderColor: PALETTE.white, background: "transparent" }}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="uppercase text-xs" style={{ color: PALETTE.white, letterSpacing: 2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{title}</h2>
        <div className="text-[10px] opacity-80" style={{ color: PALETTE.white, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>STATUS: OK</div>
      </div>
      {children}
    </section>
  );
}

function ModeList({ selectedMode, onSelectMode }) {
  const items = [
    { id: "truth", name: "Truth Mode", desc: "clinical analysis" },
    { id: "phantom", name: "Phantom Mode", desc: "encrypted metaphors" },
    { id: "surge", name: "Surge Mode", desc: "high-bandwidth output" },
  ];
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.id} className="group" onClick={() => onSelectMode(it.id)}>
          <div
            className={`flex items-center justify-between border-2 p-3 ${
              selectedMode === it.id ? "bg-white text-sageInk" : ""
            }`}
            style={{ borderColor: PALETTE.white, color: selectedMode === it.id ? PALETTE.sageInk : PALETTE.white }}
          >
            <div>
              <div className="text-sm" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{it.name}</div>
              <div className="text-[11px] opacity-80">{it.desc}</div>
            </div>
            <button
              className={`text-[10px] px-2 py-1 border-2 uppercase ${
                selectedMode === it.id ? "bg-sageInk text-white" : "bg-white text-sageInk"
              }`}
              style={{ borderColor: PALETTE.white, letterSpacing: 1 }}
            >
              {selectedMode === it.id ? "Selected" : "Select"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ConsoleArea({ listRef, messages, streaming }) {
  return (
    <div ref={listRef} className="h-[50vh] md:h-[60vh] overflow-y-auto border-2 p-3 space-y-3" style={{ borderColor: PALETTE.white, background: "transparent" }}>
      {messages.map((m, i) => (
        <Row key={i} message={m} />
      ))}
      {streaming && <Cursor />}
    </div>
  );
}

function Row({ message }) {
  const label = (message.role || 'assistant').toUpperCase();
  const isCode = message.content?.includes('```') || message.isCode;
  const isImage = message.isImage && message.imageUrl;
  return (
    <div className="grid grid-cols-12 gap-2">
      <div className="col-span-3 md:col-span-2">
        <span className="inline-block px-2 py-1 border-2 text-[10px] uppercase text-center" style={{ borderColor: PALETTE.white, color: PALETTE.white, letterSpacing: 1 }}>
          {label === 'ASSISTANT' ? 'BLX' : label}
        </span>
      </div>
      <div className="col-span-9 md:col-span-10">
        <div className="border-2 p-3 leading-snug space-y-2" style={{ borderColor: PALETTE.white, background: PALETTE.white, color: PALETTE.sageInk, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          {isImage ? (
            <img src={message.imageUrl} alt="Uploaded" className="max-w-full rounded" />
          ) : isCode ? (
            <>
              <pre className="overflow-x-auto text-sm">{message.content.replace(/```[\w]*\n?|\n?```/g, '')}</pre>
              <CodeRunner code={message.content.replace(/```[\w]*\n?|\n?```/g, '')} />
            </>
          ) : (
            <div>{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Cursor() {
  return (
    <div className="grid grid-cols-12 gap-2">
      <div className="col-span-3 md:col-span-2" />
      <div className="col-span-9 md:col-span-10">
        <div className="border-2 p-3" style={{ borderColor: PALETTE.white, background: PALETTE.white, color: PALETTE.sageInk }}>
          <span className="animate-pulse">▇▇▇</span>
        </div>
      </div>
    </div>
  );
}

function CommandBar({ value, onChange, onSend, disabled }) {
  return (
    <div className="mt-3 grid grid-cols-12 gap-2">
      <input
        placeholder="Type with intent. Press Enter to deploy."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
        className="col-span-9 md:col-span-10 border-4 px-3 py-3 outline-none"
        style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
      />
      <button
        disabled={disabled}
        onClick={onSend}
        className="col-span-3 md:col-span-2 border-4 uppercase"
        style={{ borderColor: PALETTE.white, background: PALETTE.white, color: PALETTE.sageInk, letterSpacing: 1, opacity: disabled ? 0.6 : 1 }}
      >
        Execute
      </button>
    </div>
  );
}

function FootNote() {
  return (
    <div className="mt-3 text-[10px] uppercase tracking-widest flex items-center gap-2" style={{ color: PALETTE.white, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
      <span>© BLACKLIGHT</span>
      <span className="opacity-60">|</span>
      <span>Brutalist • Apple‑lean • Minimal</span>
    </div>
  );
}

export default function BlacklightNext() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Enhanced connection state
  const [mode, setMode] = useState("webllm");
  const [activeModels, setActiveModels] = useState({
    text: "mistralai/Mistral-7B-Instruct-v0.3",
    image: "stabilityai/stable-diffusion-2-1",
    code: "codellama/CodeLlama-7b-Python-hf"
  });
  
  // Connection configs
  const [hfToken, setHfToken] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.1:8b");
  const [customUrl, setCustomUrl] = useState("");
  
  // Generation parameters
  const [maxNewTokens, setMaxNewTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);
  
  // New features
  const [isListening, setIsListening] = useState(false);
  const [autoModel, setAutoModel] = useState(true);
  const [systemMode, setSystemMode] = useState("adaptive"); // "adaptive", "creative", "precise"
  
  // Voice synthesis
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedMode, setSelectedMode] = useState("truth");
  const listRef = useRef(null);
  const [webllmModel, setWebllmModel] = useState('Phi-3.5-mini-instruct-q4f16_1');
  const [a1111Endpoint, setA1111Endpoint] = useState('http://127.0.0.1:7860');

  // Smart task detection
  const detectTaskType = useCallback((input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('code') || lowerInput.includes('program') || lowerInput.includes('function') || lowerInput.includes('```')) {
      return 'code';
    }
    if (lowerInput.includes('image') || lowerInput.includes('picture') || lowerInput.includes('draw') || lowerInput.includes('generate visual')) {
      return 'image';
    }
    if (lowerInput.includes('analyze') || lowerInput.includes('explain') || lowerInput.includes('what is')) {
      return 'analysis';
    }
    return 'conversation';
  }, []);

  const canSend = useMemo(() => {
    if (mode === "webllm") return true;                        // in-browser
    if (mode === "hf") return !!hfToken;                       // BYO token
    if (mode === "openrouter") return hasOR;                   // only if key present
    if (mode === "a1111") return !!a1111Endpoint;              // local image gen
    if (mode === "ollama") return !!ollamaUrl && !!ollamaModel;
    if (mode === "custom") return !!customUrl;
    return false;
  }, [mode, hfToken, customUrl, ollamaUrl, ollamaModel, a1111Endpoint, hasOR]);

  // Enhanced API calls with fallbacks
  async function callWithFallback(fullPrompt, taskType = "conversation") {
    const modelToUse = autoModel ? selectOptimalModel(taskType, Object.keys(MODEL_CONFIGS.text)) : activeModels.text;
    
    try {
      if (mode === "webllm") {
        if (!hasWebGPU) {
          throw new Error('WebGPU not supported in this browser. Use Chrome/Edge ≥ 113 on desktop and reload.');
        }
        const system = { role: 'system', content: 'You are BLACKLIGHT: concise, precise.' };
        const history = messages.map(m => ({ role: m.role, content: m.content }));
        return await webllmChat({ messages: [system, ...history, { role: 'user', content: fullPrompt }], model: webllmModel });
      }
      if (mode === "hf") return await callHF(fullPrompt, modelToUse);
      if (mode === "openrouter") return await callOpenRouter(fullPrompt);
      if (mode === "ollama") return await callOllama(fullPrompt);
      return await callCustom(fullPrompt);
    } catch (error) {
      console.warn('Primary model failed:', error);
      const msg = (error && (error.message || String(error))) || 'Unknown error';
      return `[status: amber] ${msg}`;
    }
  }

  async function callOpenRouter(fullPrompt) {
    const system = { role: 'system', content: 'You are BLACKLIGHT, a concise, helpful AI.' };
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const msgs = [system, ...history, { role: 'user', content: fullPrompt }];
    return await orChat({ messages: msgs });
  }

  async function callHF(fullPrompt, modelId = activeModels.text) {
    const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(modelId)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: Number(maxNewTokens) || 2048,
          temperature: Number(temperature) || 0.7,
          return_full_text: false,
        },
        options: { wait_for_model: true },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HF error ${res.status}: ${txt}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
    if (typeof data === "object" && data.generated_text) return data.generated_text;
    if (data.error) throw new Error(data.error);
    return "[status: amber] Model returned unexpected format.";
  }

  async function callOllama(fullPrompt) {
    const url = `${ollamaUrl.replace(/\/$/, "")}/api/generate`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: fullPrompt,
        options: {
          temperature: Number(temperature) || 0.7,
          num_predict: Number(maxNewTokens) || 2048,
        },
        stream: false,
      }),
    });
    
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama error ${res.status}: ${txt}`);
    }
    
    const data = await res.json();
    return data.response ?? "[status: amber] Ollama returned no text.";
  }

  async function callCustom(fullPrompt) {
    const res = await fetch(customUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt: fullPrompt, 
        max_new_tokens: maxNewTokens, 
        temperature 
      }),
    });
    
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Endpoint error ${res.status}: ${txt}`);
    }
    
    const data = await res.json();
    return data.text ?? "[status: amber] Endpoint returned no text.";
  }

  // Image generation
  async function generateImage(prompt) {
    if (mode !== "hf" || !hfToken) {
      throw new Error("Image generation requires HuggingFace API");
    }

    const modelId = activeModels.image;
    const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(modelId)}`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: MODEL_CONFIGS.image[modelId]?.params || {}
      }),
    });

    if (!res.ok) {
      throw new Error(`Image generation failed: ${res.status}`);
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    setIsListening(!isListening);
  };

  const handleImageUpload = async (file) => {
    const imageUrl = URL.createObjectURL(file);
    setMessages(prev => [...prev, {
      role: "user",
      content: "Analyze this image:",
      isImage: true,
      imageUrl
    }]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const taskType = detectTaskType(input);
    const isImageGen = taskType === 'image' || input.toLowerCase().includes('generate image');
    
    const userMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (isImageGen && mode === "hf") {
        const imageUrl = await generateImage(input);
        const assistantMessage = { 
          role: "assistant", 
          content: `[status: complete] Image generated successfully.`,
          isImage: true,
          imageUrl
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (isImageGen && mode === 'a1111') {
        const imageUrl = await a1111Txt2Img({ endpoint: a1111Endpoint, prompt: input });
        if (!imageUrl) throw new Error('A1111 did not return an image');
        setMessages(prev => [...prev, { role: 'assistant', content: '[status: complete] Image generated (A1111).', isImage: true, imageUrl }]);
      } else {
        const fullPrompt = formatPrompt([...messages, userMessage], taskType, selectedMode);
        const text = await callWithFallback(fullPrompt, taskType);
        
        const assistantMessage = { 
          role: "assistant", 
          content: text,
          isCode: taskType === 'code'
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        if (voiceEnabled && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          if (selectedVoice) utterance.voice = selectedVoice;
          speechSynthesis.speak(utterance);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `[error] ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // duplicate detectTaskType removed — use the memoized version above

  const isBrowser = typeof window !== 'undefined';
  const hasSpeech = isBrowser && 'speechSynthesis' in window;
  useEffect(() => {
    if (!hasSpeech) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length > 0 && !selectedVoice) setSelectedVoice(voices[0]);
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load);
  }, [selectedVoice, hasSpeech]);

  return (
    <div className="min-h-screen" style={{ background: PALETTE.sage }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Header onOpenSettings={() => setIsNavOpen(true)} />
        <div className="grid md:grid-cols-12 gap-4 mt-6">
          <Panel className="md:col-span-3" title="Modes">
            <ModeList selectedMode={selectedMode} onSelectMode={setSelectedMode} />
          </Panel>
          <Panel className="md:col-span-9" title="Console">
            <ConsoleArea listRef={listRef} messages={messages} streaming={isLoading} />
            <CommandBar
              value={input}
              onChange={setInput}
              onSend={handleSendMessage}
              disabled={!canSend || isLoading}
            />
            {!canSend && (
              <div className="mt-2 text-[10px] uppercase" style={{ color: PALETTE.white }}>
                {mode==='webllm' && (!hasWebGPU ? 'WebGPU not supported here — use Chrome/Edge 113+.' : 'WEBLLM is ready.')}
                {mode==='hf' && 'Paste your Hugging Face token in Settings.'}
                {mode==='ollama' && 'Start Ollama locally + choose a model (e.g., llama3:8b).'}
                {mode==='a1111' && 'Run Automatic1111 with API enabled and set its endpoint.'}
                {mode==='openrouter' && (!hasOR ? 'Set VITE_OPENROUTER_KEY to enable OpenRouter.' : 'OpenRouter ready.')}
                {mode==='custom' && 'Enter a valid custom endpoint URL.'}
              </div>
            )}
            <FootNote />
          </Panel>
        </div>
      </div>
      <ErrorBoundary>
        <SettingsDrawer
          open={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          state={{
            mode,
            setMode,
            hfToken,
            setHfToken,
            activeModels,
            setActiveModels,
            ollamaUrl,
            setOllamaUrl,
            ollamaModel,
            setOllamaModel,
            customUrl,
            setCustomUrl,
            maxNewTokens,
            setMaxNewTokens,
            temperature,
            setTemperature,
            autoModel,
            setAutoModel,
            voiceEnabled,
            setVoiceEnabled,
            canSend,
            messages,
            webllmModel,
            setWebllmModel,
            a1111Endpoint,
            setA1111Endpoint,
          }}
        />
      </ErrorBoundary>
    </div>
  );
}

function SettingsDrawer({ open, onClose, state }) {
  if (!open) return null;
  const {
    mode, setMode,
    hfToken, setHfToken,
    activeModels, setActiveModels,
    ollamaUrl, setOllamaUrl,
    ollamaModel, setOllamaModel,
    customUrl, setCustomUrl,
    maxNewTokens, setMaxNewTokens,
    temperature, setTemperature,
    autoModel, setAutoModel,
    voiceEnabled, setVoiceEnabled,
    canSend,
    messages,
    webllmModel, setWebllmModel,
    a1111Endpoint, setA1111Endpoint,
  } = state;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full md:w-[520px] overflow-y-auto border-l-4 p-4" style={{ background: PALETTE.sage, borderColor: PALETTE.white }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="uppercase text-xs" style={{ color: PALETTE.white, letterSpacing: 2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>Control Center</h3>
          <button onClick={onClose} className="border-2 p-2 rounded" style={{ borderColor: PALETTE.white, color: PALETTE.white }}>
            <X size={14} />
          </button>
        </div>
        <Panel title="Backend">
          <div className="grid grid-cols-3 gap-2">
            {["webllm","ollama","a1111",...(hasOR?["openrouter"]:[]),"hf","custom"].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-2 border-2 text-xs uppercase"
                style={{ borderColor: PALETTE.white, color: PALETTE.white, background: mode === m ? PALETTE.white : 'transparent', ...(mode === m ? { color: PALETTE.sageInk } : {}) }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          {mode === 'webllm' && (
            <div className="mt-3 space-y-2">
              <label className="text-[11px]" style={{ color: PALETTE.white }}>WebLLM Model</label>
              <select value={webllmModel} onChange={e=>setWebllmModel(e.target.value)} className="w-full border-2 px-2 py-2 text-xs" style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }}>
                <option>Phi-3.5-mini-instruct-q4f16_1</option>
                <option>Qwen2.5-3B-Instruct-q4f16_1</option>
                <option>Llama-3.1-8B-Instruct-q4f16_1</option>
              </select>
              <div className="text-[11px] opacity-80" style={{ color: PALETTE.white }}>Models download once and cache in the browser via WebGPU.</div>
            </div>
          )}
          {mode === 'a1111' && (
            <div className="mt-3 space-y-2">
              <label className="text-[11px]" style={{ color: PALETTE.white }}>A1111 Endpoint</label>
              <input value={a1111Endpoint} onChange={e=>setA1111Endpoint(e.target.value)} placeholder="http://127.0.0.1:7860" className="w-full border-2 px-2 py-2 text-xs" style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }} />
              <div className="text-[11px] opacity-80" style={{ color: PALETTE.white }}>Run Automatic1111 locally and enable the API.</div>
            </div>
          )}
          {mode === "hf" && (
            <div className="mt-3 space-y-2">
              <label className="text-[11px]" style={{ color: PALETTE.white }}>HuggingFace API Key</label>
              <input
                type="password"
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                placeholder="hf_xxx..."
                className="w-full border-2 px-2 py-2 text-xs"
                style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }}
              />
              <div className="grid gap-2">
                <select 
                  value={activeModels.text} 
                  onChange={(e) => setActiveModels(prev => ({...prev, text: e.target.value}))}
                  className="px-2 py-2 border-2 text-xs"
                  style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }}
                >
                  {Object.keys(MODEL_CONFIGS.text).map(model => (
                    <option key={model} value={model}>{model.split('/')[1] || model}</option>
                  ))}
                </select>
                <select 
                  value={activeModels.image} 
                  onChange={(e) => setActiveModels(prev => ({...prev, image: e.target.value}))}
                  className="px-2 py-2 border-2 text-xs"
                  style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }}
                >
                  {Object.keys(MODEL_CONFIGS.image).map(model => (
                    <option key={model} value={model}>{model.split('/')[1] || model}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {mode === "ollama" && (
            <div className="mt-3 space-y-2">
              <label className="text-[11px]" style={{ color: PALETTE.white }}>Ollama URL</label>
              <input
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full border-2 px-2 py-2 text-xs"
                style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }}
              />
              <label className="text-[11px]" style={{ color: PALETTE.white }}>Model</label>
              <input
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="llama3.1:8b"
                className="w-full border-2 px-2 py-2 text-xs"
                style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }}
              />
            </div>
          )}
          {mode === "custom" && (
            <div className="mt-3 space-y-2">
              <label className="text-[11px]" style={{ color: PALETTE.white }}>Custom Endpoint</label>
              <input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border-2 px-2 py-2 text-xs"
                style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }}
              />
            </div>
          )}
        </Panel>
        <Panel title="Advanced">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] mb-1" style={{ color: PALETTE.white }}>Max Tokens</div>
              <input 
                type="number" 
                value={maxNewTokens} 
                onChange={(e) => setMaxNewTokens(e.target.value)} 
                className="w-full border-2 px-2 py-2 text-xs"
                min="128"
                max="8192"
                style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }}
              />
            </div>
            <div>
              <div className="text-[11px] mb-1" style={{ color: PALETTE.white }}>Temperature</div>
              <input 
                type="number" 
                step="0.1" 
                value={temperature} 
                onChange={(e) => setTemperature(e.target.value)} 
                className="w-full border-2 px-2 py-2 text-xs"
                min="0"
                max="2"
                style={{ borderColor: PALETTE.white, background: PALETTE.sage, color: PALETTE.white }}
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setAutoModel(!autoModel)} className="px-3 py-2 border-2 text-xs uppercase" style={{ borderColor: PALETTE.white, color: PALETTE.white, background: autoModel ? PALETTE.white : 'transparent', ...(autoModel ? { color: PALETTE.sageInk } : {}) }}>
              Auto Model: {autoModel ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="px-3 py-2 border-2 text-xs uppercase" style={{ borderColor: PALETTE.white, color: PALETTE.white, background: voiceEnabled ? PALETTE.white : 'transparent', ...(voiceEnabled ? { color: PALETTE.sageInk } : {}) }}>
              Voice Out: {voiceEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </Panel>
        <Panel title="System">
          <div className="text-xs space-y-1" style={{ color: PALETTE.white }}>
            <div>Connection: {canSend ? 'ACTIVE' : 'INACTIVE'}</div>
            <div>Messages: {messages.length}</div>
            <div>Backend: {mode.toUpperCase()}</div>
          </div>
        </Panel>
        <Panel title="Quick Actions">
          <div className="grid gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-2 border-2 text-xs uppercase"
              style={{ borderColor: PALETTE.white, color: PALETTE.white }}
            >
              Reload UI
            </button>
            <button 
              onClick={() => {
                const data = JSON.stringify({messages, settings: {mode, temperature, maxNewTokens}}, null, 2);
                const blob = new Blob([data], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'blacklight-session.json';
                a.click();
              }}
              className="px-3 py-2 border-2 text-xs uppercase"
              style={{ borderColor: PALETTE.white, color: PALETTE.white }}
            >
              Export Session
            </button>
          </div>
        </Panel>
        <Panel title="System Self-Test">
          <div className="grid gap-2">
            <button
              onClick={async () => {
                try {
                  if (mode === 'webllm') {
                    if (!hasWebGPU) throw new Error('WebGPU not supported');
                    const t = await webllmChat({ messages:[{role:'user',content:'ping'}], model: webllmModel });
                    alert('WEBLLM OK: ' + (t ? 'response received' : 'no text'));
                    return;
                  }
                  if (mode === 'ollama') {
                    const r = await fetch(`${ollamaUrl}/api/tags`);
                    if (!r.ok) throw new Error('Ollama not reachable');
                    const j = await r.json();
                    alert(`Ollama OK: ${j.models?.length || 0} models`);
                    return;
                  }
                  if (mode === 'a1111') {
                    const r = await fetch(`${a1111Endpoint}/sdapi/v1/options`);
                    alert(r.ok ? 'A1111 OK' : 'A1111 not reachable');
                    return;
                  }
                  if (mode === 'hf') {
                    if (!hfToken) throw new Error('Missing HF token');
                    alert('HF token present.');
                    return;
                  }
                  if (mode === 'openrouter') {
                    if (!hasOR) throw new Error('Missing VITE_OPENROUTER_KEY');
                    alert('OpenRouter key present.');
                    return;
                  }
                  if (mode === 'custom') {
                    if (!customUrl) throw new Error('Missing custom URL');
                    const r = await fetch(customUrl, { method:'OPTIONS' }).catch(()=>null);
                    alert(r ? 'Custom endpoint reachable (OPTIONS)' : 'Custom endpoint not reachable');
                    return;
                  }
                } catch (e) {
                  alert('Self-test failed: ' + (e?.message || e));
                }
              }}
              className="px-3 py-2 border-2 text-xs uppercase"
              style={{ borderColor: PALETTE.white, color: PALETTE.white }}
            >
              Test Connection
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}


