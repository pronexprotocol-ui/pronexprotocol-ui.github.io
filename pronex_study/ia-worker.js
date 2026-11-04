/* Pronex_Study · tutor Nex no próprio dispositivo (WebLLM, modelo Qwen3.5, licença Apache-2.0).
   Corre num worker para a app não encravar enquanto o modelo pensa. */
import { WebWorkerMLCEngineHandler } from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm';
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
