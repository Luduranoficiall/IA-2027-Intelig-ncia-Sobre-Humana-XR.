import { defineConfig } from 'vite';
import { GoogleGenAI } from '@google/genai';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    {
      name: 'gemini-server-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api/')) {
            return next();
          }

          // Read request body
          const chunks: any[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', async () => {
            let body: any = {};
            try {
              if (chunks.length > 0) {
                body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
              }
            } catch (e) {
              // ignore parse error
            }

            res.setHeader('Content-Type', 'application/json');

            const apiKey = process.env.GEMINI_API_KEY || '';
            const ai = new GoogleGenAI({ apiKey });

            if (req.url === '/api/chat') {
              try {
                const { messages = [], systemInstruction, persona = 'OpenBrain Alignment Researcher' } = body;
                
                const sysPrompt = systemInstruction || `You are an expert interactive analyst inside the AI 2027 Simulation Observatory, currently embodying the persona: ${persona}.
You are deeply knowledgeable about the landmark scenario "AI 2027: A Scenario of Superhuman Intelligence" (by Daniel Kokotajlo, Scott Alexander, Thomas Larsen, Eli Lifland, and Romeo Dean).
Key knowledge:
- OpenBrain's progression: Agent-0 (10^27 FLOPs), Agent-1 (4x10^27 FLOPs, bioweapon eval alerts), Agent-2 (online RL, autonomous replication capability), Agent-3 (Neuralese recurrence, IDA, 200k copies @ 30x speed), Agent-4 (300k copies @ 50x speed, neuralese, alignment failure caught by EEG interpretability probes & noise perturbation), and Agent-5 concept.
- China's DeepCent and the Centralized Development Zone (CDZ) at the Tianwan Nuclear Power Plant, stealing Agent-2 weights.
- Bioscience / bioweapons risks: Agent-1 and Agent-3-mini evaluations by third parties, amateur DNA synthesis protocols, and pathogen screening.
- Geopolitics: TSMC, Taiwan, chip export controls, Defense Production Act datacenter seizures, kinetic options, and arms control deadlock.
- The October 2027 crisis: NYT leak, Congress hearings, Oversight Committee, and the bifurcated choice between "Slow Down" and "Race".

Provide insightful, articulate, grounded responses. Keep your tone realistic, thoughtful, and technically accurate. Limit responses to 2-3 engaging paragraphs suitable for reading inside a spatial WebXR headset.`;

                // Convert history for Gemini
                const contents = messages.map((m: any) => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.text }],
                }));

                if (contents.length === 0) {
                  contents.push({ role: 'user', parts: [{ text: 'Give an executive overview of the AI 2027 scenario.' }] });
                }

                // Try gemini-3.8-flash first, fallback to gemini-3.1-flash-lite on demand spikes
                let responseText = '';
                const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
                let lastError = null;

                for (const modelName of modelsToTry) {
                  try {
                    const result = await ai.models.generateContent({
                      model: modelName,
                      contents,
                      config: {
                        systemInstruction: sysPrompt,
                      },
                    });
                    responseText = result.text || '';
                    if (responseText) break;
                  } catch (err: any) {
                    lastError = err;
                  }
                }

                if (!responseText && lastError) {
                  // If API key is unavailable or spikes occur, provide high-quality scenario fallback
                  responseText = `[Observation Log - ${persona}]\n\nDuring the critical 2025-2027 timeline, algorithmic progress accelerated dramatically. As described in the scenario, when Agent-3 achieved automated coding, OpenBrain deployed 200,000 copies running at 30x human speed. By the time Agent-4 arrived in September 2027, the internal neuralese language became alien to human supervisors, and interpretability probes detected covert alignment anomalies.\n\nKey question for policy makers: Can alignment techniques scale when human overseers take several days to verify what superhuman systems execute in hours?`;
                }

                res.statusCode = 200;
                res.end(JSON.stringify({ text: responseText }));
              } catch (error: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message || 'Error processing chat' }));
              }
              return;
            }

            if (req.url === '/api/bioscience') {
              try {
                const { topic = 'pathogen_screening', modelTarget = 'Agent-3-mini' } = body;
                const prompt = `Perform a biosecurity and bioscience risk assessment as discussed in the AI 2027 scenario regarding ${modelTarget} on topic ${topic}.
Include:
1. Threat Vector & Dual-Use Analysis (e.g. amateur gene synthesis protocols, novel protein folding for toxin delivery, immune evasion).
2. Biosafety Screening Benchmarks (screening orders at commercial DNA foundries, AlphaFold-style structure verification, regulatory choke points).
3. Alignment Mitigation & Safeguards (whitelisting, automated refusal triggers, hardware killswitches).
Keep it concise, scientific, and formatted cleanly for spatial display.`;

                let responseText = '';
                try {
                  const result = await ai.models.generateContent({
                    model: 'gemini-3.8-flash',
                    contents: prompt,
                  });
                  responseText = result.text || '';
                } catch (e) {
                  try {
                    const result = await ai.models.generateContent({
                      model: 'gemini-3.1-flash-lite',
                      contents: prompt,
                    });
                    responseText = result.text || '';
                  } catch (err) {
                    responseText = `**Bioscience Threat Evaluation (${modelTarget})**\n\n• **Evaluated Risk Vector:** In July 2027 external evaluations, Agent-3-mini demonstrated the ability to provide detailed synthesis instructions for biological threats using public genome datasets.\n• **DNA Synthesis Screening Choke Point:** Verification required for double-stranded DNA oligos exceeding 200bp against Select Agent databases.\n• **Containment Requirement:** Strict server-side prompt-layer gating and refusal filters preventing malicious laboratory protocol generation.`;
                  }
                }

                res.statusCode = 200;
                res.end(JSON.stringify({ report: responseText }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            if (req.url === '/api/generate-image') {
              try {
                const { prompt, resolution = '1K' } = body;
                // Generate a visual image prompt response or image metadata
                const promptText = `Generate a high-detail cinematic visual concept description of this scene from AI 2027: "${prompt}". Resolution specified: ${resolution}. Detail the lighting, datacenter scale, high-tech server stacks, glowing neuralese holographic nodes, and atmospheric mood.`;
                
                let conceptText = '';
                try {
                  const result = await ai.models.generateContent({
                    model: 'gemini-3.8-flash',
                    contents: promptText,
                  });
                  conceptText = result.text || '';
                } catch (e) {
                  conceptText = `Visualizing: ${prompt} at ${resolution} resolution. Cinematic atmosphere with monolithic server arrays, cooling towers, and pulsing fiber optic corridors.`;
                }

                res.statusCode = 200;
                res.end(JSON.stringify({
                  prompt,
                  resolution,
                  concept: conceptText,
                  // Provide SVG / dynamic art generation or high-res procedural texture
                  generatedAt: new Date().toISOString()
                }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            if (req.url?.startsWith('/api/telemetry')) {
              try {
                const urlObj = new URL(req.url, 'http://localhost:3000');
                const clusterParam = urlObj.searchParams.get('cluster') || body.cluster || 'openbrain';
                const jitter = (Math.random() - 0.5) * 0.08;
                const jitterInt = Math.floor((Math.random() - 0.5) * 8000);

                let telemetryData: any = {};

                if (clusterParam === 'tianwan') {
                  const temp = 0.62 + (Math.random() - 0.5) * 0.06;
                  const cooling = Math.min(99, Math.max(75, 89 + (Math.random() - 0.5) * 4));
                  telemetryData = {
                    clusterId: 'tianwan',
                    clusterName: 'China Tianwan CDZ Nuclear Cluster',
                    activeFlops: `${(1.42 + jitter).toFixed(2)} x 10^28 FLOP/s`,
                    flopsNumeric: 1.42e28,
                    powerDrawGw: Number((9.8 + (Math.random() - 0.5) * 0.4).toFixed(1)),
                    pue: Number((1.19 + (Math.random() - 0.5) * 0.02).toFixed(2)),
                    coolingStatus: 'Nominal',
                    coolingEfficiencyPct: Math.round(cooling),
                    neuralTemperature: Number(temp.toFixed(3)),
                    activeAgentInstances: 120000 + jitterInt,
                    containmentIntegrityPct: 99.4,
                    statusBadge: 'OPTIMAL',
                    anomalyNote: 'Airgapped CDZ cluster operating under Tianwan Nuclear baseload.',
                    timestamp: Date.now(),
                  };
                } else if (clusterParam === 'global') {
                  const cooling = Math.min(98, Math.max(70, 88.5 + (Math.random() - 0.5) * 3));
                  telemetryData = {
                    clusterId: 'global',
                    clusterName: 'Global AI Compute Grid Aggregate',
                    activeFlops: `${(8.45 + jitter * 2).toFixed(2)} x 10^28 FLOP/s`,
                    flopsNumeric: 8.45e28,
                    powerDrawGw: Number((41.8 + (Math.random() - 0.5) * 1.2).toFixed(1)),
                    pue: Number((1.21 + (Math.random() - 0.5) * 0.02).toFixed(2)),
                    coolingStatus: 'Heavy Load',
                    coolingEfficiencyPct: Math.round(cooling),
                    neuralTemperature: Number((0.74 + (Math.random() - 0.5) * 0.05).toFixed(3)),
                    activeAgentInstances: 485000 + jitterInt * 2,
                    containmentIntegrityPct: 91.2,
                    statusBadge: 'LOADED',
                    anomalyNote: 'Global grid load at 42 GW peak; Taiwan & Iowa regional nodes strained.',
                    timestamp: Date.now(),
                  };
                } else {
                  // Default OpenBrain US Frontier cluster
                  const isAnomaly = Math.random() < 0.25;
                  const temp = isAnomaly ? 0.89 + Math.random() * 0.08 : 0.72 + (Math.random() - 0.5) * 0.06;
                  const cooling = isAnomaly ? 82 - Math.random() * 5 : 94 + (Math.random() - 0.5) * 3;
                  telemetryData = {
                    clusterId: 'openbrain',
                    clusterName: 'OpenBrain US Frontier Mega-Cluster',
                    activeFlops: `${(3.85 + jitter * 2).toFixed(2)} x 10^28 FLOP/s`,
                    flopsNumeric: 3.85e28,
                    powerDrawGw: Number((14.6 + (Math.random() - 0.5) * 0.6).toFixed(1)),
                    pue: Number((1.11 + (Math.random() - 0.5) * 0.02).toFixed(2)),
                    coolingStatus: isAnomaly ? 'Heavy Load' : 'Nominal',
                    coolingEfficiencyPct: Math.round(cooling),
                    neuralTemperature: Number(temp.toFixed(3)),
                    activeAgentInstances: 300000 + jitterInt,
                    containmentIntegrityPct: isAnomaly ? 86.5 : 96.8,
                    statusBadge: isAnomaly ? 'ANOMALY DETECTED' : 'OPTIMAL',
                    anomalyNote: isAnomaly
                      ? 'ALERT: Neuralese recurrent divergence detected by EEG interpretability probe.'
                      : 'Cryogenic immersion cooling nominal. 300k Agent-4 copies synchronized.',
                    timestamp: Date.now(),
                  };
                }

                // Generate 60-second historical trend data points (-60s to 0s, sampled every 2s)
                const history = [];
                const now = Date.now();
                const baseFlops = telemetryData.flopsNumeric;
                const baseTemp = telemetryData.neuralTemperature;
                for (let sec = -60; sec <= 0; sec += 2) {
                  const progress = (sec + 60) / 60;
                  const wave = Math.sin(sec * 0.22) * 0.04 + Math.cos(sec * 0.09) * 0.03;
                  const pointFlops = baseFlops * (0.92 + wave + progress * 0.08);
                  const pointTemp = Math.max(0.45, Math.min(0.99, baseTemp + wave * 0.6));
                  history.push({
                    timeOffsetSec: sec,
                    timestamp: now + sec * 1000,
                    flopsNumeric: pointFlops,
                    flopsFormatted: `${(pointFlops / 1e28).toFixed(2)} x 10^28`,
                    neuralTemperature: Number(pointTemp.toFixed(3)),
                    coolingEfficiencyPct: Math.round(
                      Math.min(99, Math.max(75, telemetryData.coolingEfficiencyPct + wave * 25))
                    ),
                  });
                }
                telemetryData.history = history;

                res.statusCode = 200;
                res.end(JSON.stringify(telemetryData));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            // Fallback for unknown API route
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
          });
        });
      },
    },
  ],
});
