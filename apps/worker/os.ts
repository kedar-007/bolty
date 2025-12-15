import { prisma } from "@bolt/db";
import { exec } from "child_process";
import { RelayWebsocket } from "./ws";

function getBaseWorkerDir(type: "NEXTJS" | "REACT_NATIVE") {
  return type === "NEXTJS" ? "/tmp/next-app" : "/tmp/mobile-app";
}

export async function onFileUpdate(filePath: string, fileContent: string, projectId: string, promptId: string, type: "NEXTJS" | "REACT_NATIVE") {
  await prisma.action.create({
    data: { projectId, promptId, content: `Updated file ${filePath}` },
  });

  RelayWebsocket.getInstance().send(JSON.stringify({
    event: "admin",
    data: { type: "update-file", path: `${getBaseWorkerDir(type)}/${filePath}`, content: fileContent },
  }));
}

export async function onShellCommand(shellCommand: string, projectId: string, promptId: string) {
  await prisma.action.create({ data: { projectId, promptId, content: `Ran command: ${shellCommand}` } });

  // Actually execute command inside Node
  exec(shellCommand, { cwd: "/tmp/next-app" }, (error, stdout, stderr) => {
    if (error) console.error("[OS] Shell command error:", error);
    if (stdout) console.log("[OS] Shell command stdout:", stdout);
    if (stderr) console.error("[OS] Shell command stderr:", stderr);
  });

  // Send WS event
  RelayWebsocket.getInstance().send(JSON.stringify({
    event: "admin",
    data: { type: "command", content: shellCommand },
  }));
}

export function onPromptEnd(promptId: string) {
  RelayWebsocket.getInstance().send(JSON.stringify({
    event: "admin",
    data: { type: "prompt-end" },
  }));
}
