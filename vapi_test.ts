import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

async function run() {
  const apiKey = Deno.env.get('VAPI_API_KEY');
  if (!apiKey) {
    console.log("No API key");
    return;
  }
  
  // Create first
  console.log("Creating assistant...");
  const createRes = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Test Agent",
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: "You are a helpful assistant." }]
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM"
      }
    })
  });
  
  if (!createRes.ok) {
    console.log("Create failed:", createRes.status, await createRes.text());
    return;
  }
  
  const assistant = await createRes.json();
  console.log("Created successfully:", assistant.id);
  
  // Now update it
  console.log("Updating assistant...");
  const updateRes = await fetch(`https://api.vapi.ai/assistant/${assistant.id}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Test Agent Updated",
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: "You are a helpful assistant updated." }]
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
        model: "eleven_turbo_v2_5",
        stability: 0.5,
        similarityBoost: 0.5,
        optimizeStreamingLatency: 3
      },
      transcriber: {
        provider: "speechmatics",
        model: "default",
        language: "pt"
      },
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 3600,
      endCallPhrases: ["tchau"],
      voicemailDetection: {
        provider: "twilio",
        enabled: true,
        voicemailDetectionTypes: ["machine_end_beep", "machine_end_silence", "machine_end_other", "machine_start"]
      },
      firstMessage: "Hello",
      serverUrl: "https://example.com/webhook",
      serverMessages: ["end-of-call-report", "status-update", "hang", "function-call", "tool-calls"]
    })
  });
  
  if (!updateRes.ok) {
    console.log("Update failed:", updateRes.status, await updateRes.text());
  } else {
    console.log("Updated successfully:", await updateRes.json());
  }
  
  // Delete
  console.log("Deleting assistant...");
  await fetch(`https://api.vapi.ai/assistant/${assistant.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${apiKey}` } });
}

run();
