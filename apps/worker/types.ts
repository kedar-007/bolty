
export type MessagePayload = {
    event: "subscribe";
    data?: null;
} | {
    event: "admin";
    data: {
        type: "command" | "update-file" | "prompt-start" | "prompt-end"
        content: string;
        path?: string;
    };
    callbackId?: string;
}

export type VscodeMessagePayload = {
    event: "vscode_diff";
    diff: string;
    callbackId: string;
}