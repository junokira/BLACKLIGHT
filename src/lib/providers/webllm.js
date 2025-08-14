// Runs models entirely in the browser using WebGPU via WebLLM.
// Note: First load downloads model weights; requires a modern browser with WebGPU.
import * as webllm from "https://esm.run/@mlc-ai/web-llm@0.2.92";

let engine = null;
let currentModel = null;

export async function initWebLLM(model = "Phi-3.5-mini-instruct-q4f16_1", onProgress) {
  if (engine && currentModel === model) return engine;
  if (engine && currentModel !== model) {
    await engine.reload(model);
    currentModel = model;
    return engine;
  }
  engine = await webllm.CreateMLCEngine(model, {
    appConfig: webllm.prebuiltAppConfig,
    initProgressCallback: (p) => onProgress?.(p),
  });
  currentModel = model;
  return engine;
}

export async function webllmChat({ messages, model }) {
  const eng = await initWebLLM(model);
  const out = await eng.chat.completions.create({
    messages,
    stream: false,
    temperature: 0.7,
  });
  return out?.choices?.[0]?.message?.content ?? "";
}


