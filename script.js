// ✅ Import from the global CDN module (same version you used)
import { FilesetResolver, LlmInference } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.25/genai_bundle.mjs';

let llmInference = null;

// Small helper
function updateStatus(message) {
  document.getElementById('status').textContent = `Status: ${message}`;
}

window.addEventListener('DOMContentLoaded', async () => {
  updateStatus('Initializing LLM...');

  try {
    // 1) Load WASM
    const genai = await FilesetResolver.forGenAiTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.25/wasm'
    );

    // 2) Create the LLM with multimodal enabled
    llmInference = await LlmInference.createFromOptions(genai, {
      baseOptions: {
        modelAssetPath: 'https://huggingface.co/google/gemma-3n-E4B-it-litert-lm/resolve/main/gemma-3n-E4B-it-int4-Web.litertlm'
      },
      maxTokens: 1000,
      topK: 40,
      temperature: 0.8,
      randomSeed: 101,

      // 🔑 Enable multimodal
      maxNumImages: 5,      // allow up to 5 images in a single prompt
      supportAudio: true,   // enable audio input support
    });

    updateStatus('✅ LLM Ready! Type a prompt and click "Generate Response"');
  } catch (e) {
    updateStatus(`❌ Error initializing LLM: ${e.message}`);
    console.error(e);
  }
});

document.getElementById('generate').addEventListener('click', async () => {
  const promptText = document.getElementById('prompt').value.trim();
  const outputDiv  = document.getElementById('output');
  const imageFile  = document.getElementById('imageInput')?.files?.[0] || null;
  const audioFile  = document.getElementById('audioInput')?.files?.[0] || null;

  if (!promptText) {
    alert('Please enter a prompt!');
    return;
  }
  if (!llmInference) {
    alert('LLM is still loading. Please wait.');
    return;
  }

  // Build the correct prompt payload.
  // If image/audio provided -> use an ARRAY with Gemma-3n control tokens.
  // If text-only -> pass a plain string (keeps your original behavior).
  let promptPayload = promptText;

  if (imageFile || audioFile) {
    const items = [];
    items.push('<ctrl99>user\n');     // Gemma-3n instruction start
    items.push(promptText);

    if (imageFile) {
      const imageUrl = URL.createObjectURL(imageFile);
      // The API supports { imageSource: <url|Image|Canvas|Video> }
      items.push('\n');
      items.push({ imageSource: imageUrl });
    }

    if (audioFile) {
      const audioUrl = URL.createObjectURL(audioFile);
      // For audio, mono-channel file URLs are supported
      items.push('\n');
      items.push({ audioSource: audioUrl });
    }

    // Close user turn, open model turn
    items.push('\n<ctrl100>\n<ctrl99>model\n');

    promptPayload = items; // 👈 switch to multimodal array prompt
  }

  outputDiv.textContent = '';
  updateStatus('⏳ Generating response...');

  try {
    // Stream token-by-token (same signature you already used)
    await llmInference.generateResponse(
      promptPayload,
      (partialResult, done) => {
        // MediaPipe typically delivers a string; append as-is
        outputDiv.textContent += (typeof partialResult === 'string')
          ? partialResult
          : (partialResult?.partialResult || '');

        if (done) updateStatus('✅ Response complete.');
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
