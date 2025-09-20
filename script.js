// ✅ Import from the global CDN module
import { FilesetResolver, LlmInference } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.25/genai_bundle.mjs';

let llmInference = null;

// Initialize the LLM when page loads
window.addEventListener('DOMContentLoaded', async () => {
  updateStatus('Initializing LLM...');

  try {
    // 1. Load WASM files for MediaPipe GenAI
    const genai = await FilesetResolver.forGenAiTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.25/wasm"
    );

    // 2. Create LLM Inference instance
    llmInference = await LlmInference.createFromOptions(genai, {
      baseOptions: {
        modelAssetPath: 'https://huggingface.co/google/gemma-3n-E4B-it-litert-lm/resolve/main/gemma-3n-E4B-it-int4-Web.litertlm'
      },
      maxTokens: 1000,
      topK: 40,
      temperature: 0.8,
      randomSeed: 101,
    });

    updateStatus('✅ LLM Ready! Type a prompt and click "Generate Response"');
  } catch (e) {
    updateStatus(`❌ Error initializing LLM: ${e.message}`);
    console.error(e);
  }
});

// Handle Generate button click
document.getElementById('generate').addEventListener('click', async () => {
  const inputPrompt = document.getElementById('prompt').value.trim();
  const outputDiv = document.getElementById('output');

  if (!inputPrompt) {
    alert('Please enter a prompt!');
    return;
  }

  if (!llmInference) {
    alert('LLM is still loading. Please wait.');
    return;
  }

  outputDiv.textContent = ''; // Clear previous output
  updateStatus('⏳ Generating response...');

  try {
    // Stream the response token by token
    await llmInference.generateResponse(
      inputPrompt,
      (partialResult, done) => {
        outputDiv.textContent += partialResult;
        if (done) {
          updateStatus('✅ Response complete.');
        }
      }
    );
  } catch (e) {
    updateStatus(`❌ Error during generation: ${e.message}`);
    console.error(e);
  }
});

// Helper to update status text
function updateStatus(message) {
  document.getElementById('status').textContent = `Status: ${message}`;

}
