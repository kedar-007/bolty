import { prisma } from "@bolt/db";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { RelayWebsocket } from "./ws";

function getBaseWorkerDir(type: "NEXTJS" | "REACT_NATIVE") {
  return type === "NEXTJS" ? "/tmp/next-app" : "/tmp/mobile-app";
}

/* =========================
   FILE UPDATE (REAL WRITE)
========================= */
export async function onFileUpdate(
  filePath: string,
  fileContent: string,
  projectId: string,
  promptId: string,
  type: "NEXTJS" | "REACT_NATIVE"
) {
  const baseDir = getBaseWorkerDir(type);
  const absolutePath = path.join(baseDir, filePath);
  const dir = path.dirname(absolutePath);

  // 1️⃣ ensure directory exists
  await fs.mkdir(dir, { recursive: true });

  // 2️⃣ write file to disk
  await fs.writeFile(absolutePath, fileContent, "utf-8");

  // 3️⃣ log to DB
  await prisma.action.create({
    data: {
      projectId,
      promptId,
      content: `Updated file ${filePath}`,
    },
  });

  // 4️⃣ notify UI
  RelayWebsocket.getInstance().send(
    JSON.stringify({
      event: "admin",
      data: {
        type: "update-file",
        path: absolutePath,
      },
    })
  );

  console.log(`[FS] File written → ${absolutePath}`);
}

/* =========================
   SHELL COMMAND
========================= */
export async function onShellCommand(
  shellCommand: string,
  projectId: string,
  promptId: string
) {
  const ws = RelayWebsocket.getInstance();

  await prisma.action.create({
    data: { projectId, promptId, content: `Ran command: ${shellCommand}` },
  });

  console.log(`[OS] Running: ${shellCommand}`);

  return new Promise<void>((resolve, reject) => {
    const child = spawn("/bin/sh", ["-c", shellCommand], {
      cwd: "/tmp/next-app",
      env: process.env,
    });

    child.stdout.on("data", (d) => {
      ws.send(
        JSON.stringify({
          event: "admin",
          data: { type: "command-output", output: d.toString() },
        })
      );
    });

    child.stderr.on("data", (d) => {
      ws.send(
        JSON.stringify({
          event: "admin",
          data: { type: "command-error", error: d.toString() },
        })
      );
    });

    child.on("close", (code) => {
      ws.send(
        JSON.stringify({
          event: "admin",
          data: { type: "command-end", code },
        })
      );

      code === 0 ? resolve() : reject();
    });
  });
}

/* =========================
   PROMPT END
========================= */
export function onPromptEnd(promptId: string) {
  RelayWebsocket.getInstance().send(
    JSON.stringify({
      event: "admin",
      data: { type: "prompt-end", promptId },
    })
  );
}
