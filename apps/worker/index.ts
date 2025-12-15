import cors from "cors";
import express from "express";
import { prisma } from "@bolt/db";
import { GoogleGenAI } from "@google/genai";
import { systemPrompt } from "./systemPrompt";
import { ArtifactProcessor } from "./parser";
import { onFileUpdate, onPromptEnd, onShellCommand } from "./os";
import { RelayWebsocket } from "./ws";

const app = express();
app.use(cors());
app.use(express.json());

console.log("[SERVER] Initializing Gemini client");
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// --- List available models ---
(async () => {
  try {
    console.log("[GEMINI] Fetching available models...");
    const modelsPager = await ai.models.list();
    const modelsArray = [];
    for await (const model of modelsPager) modelsArray.push(model);
    console.log("[GEMINI] Available models:", modelsArray.map((m) => m.name));
  } catch (err) {
    console.error("[GEMINI] Failed to list models:", err);
  }
})();

app.post("/prompt", async (req, res) => {
  console.log("[API] /prompt called");
  const { prompt, projectId } = req.body;

  console.log("[API] Payload:", { prompt, projectId });

  // --- Fetch project ---
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: "Project not found" });
  console.log(`[DB] Project fetched: ID=${project.id}, Type=${project.type}`);

  // --- Create USER prompt record ---
  const promptDb = await prisma.prompt.create({
    data: { content: prompt, projectId, type: "USER" },
  });
  console.log(`[DB] USER prompt created: ID=${promptDb.id}`);

  // --- Send WS admin event ---
  RelayWebsocket.getInstance()
    .sendAndAwaitResponse({ event: "admin", data: { type: "prompt-start" } }, promptDb.id)
    .then(async ({ diff }) => {
      if (diff) {
        console.log("[DB] Saving user diff prompt");
        await prisma.prompt.create({
          data: { content: `<bolt-user-diff>${diff}</bolt-user-diff>\n\n$`, projectId, type: "USER" },
        });
      }
    })
    .catch((err) => console.error("[WS] sendAndAwaitResponse failed:", err));

  // --- Fetch all prompts ---
  const allPrompts = await prisma.prompt.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
  console.log(`[DB] Fetched ${allPrompts.length} prompts for history`);

  // --- Artifact processor ---
  const artifactProcessor = new ArtifactProcessor(
    "",
    (filePath, fileContent) => {
      console.log(`[ARTIFACT] 📄 FILE_UPDATE: ${filePath}`);
      onFileUpdate(filePath, fileContent, projectId, promptDb.id, project.type);
    },
    async (shellCommand) => {
      console.log(`[ARTIFACT] ⚙️ SHELL_COMMAND: "${shellCommand.trim()}"`);
      await onShellCommand(shellCommand, projectId, promptDb.id);
    }
  );

  const modelName = "gemini-2.5-flash";
  console.log(`[GEMINI] Using model: ${modelName}`);

  const chatHistory = allPrompts.map((p) => ({
    role: p.type === "USER" ? "user" : "model",
    parts: [{ text: p.content }],
  }));

  // --- Stream response from Gemini ---
  (async () => {
    let artifact = "";
    try {
      console.log("[GEMINI] Starting streaming response...");
      const stream = await ai.models.generateContentStream({
        model: modelName,
        contents: chatHistory,
        config: { systemInstruction: systemPrompt(project.type), maxOutputTokens: 8000 },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (!text) continue;

        console.log(`[GEMINI] ⚡️ STREAM_CHUNK: ${text.slice(0, 50).replace(/\n/g, "\\n")}...`);
        artifactProcessor.append(text);
        artifact += text;
      }
    } catch (err) {
      console.error("[GEMINI] Streaming failed:", err);
    }

    // --- Save SYSTEM prompt ---
    if (artifact) {
      const systemPromptDb = await prisma.prompt.create({
        data: { content: artifact, projectId, type: "SYSTEM" },
      });
      console.log(`[DB] SYSTEM prompt created: ID=${systemPromptDb.id}, length=${artifact.length}`);
    }

    // --- Create final action ---
    await prisma.action.create({ data: { content: "Done!", projectId, promptId: promptDb.id } });
    onPromptEnd(promptDb.id);
  })();

  res.json({ status: "streaming-started" });
});

app.listen(9091, () => console.log("[SERVER] Running on port 9091"));
