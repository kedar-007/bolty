import WebSocket from "ws";

export class RelayWebsocket {
  private static instance: RelayWebsocket;
  private ws!: WebSocket;
  private queue: any[] = [];
  private isOpen = false;

  private constructor() {
    this.ws = new WebSocket("ws://localhost:9093");
    this.ws.on("open", () => {
      this.isOpen = true;
      console.log("[WS] Connection OPEN");
      this.queue.forEach((msg) => this.ws.send(JSON.stringify(msg)));
      this.queue = [];
    });
    this.ws.on("message", (msg) => console.log("[WS] Received:", msg.toString()));
  }

  public static getInstance() {
    if (!RelayWebsocket.instance) {
      console.log("[WS] Creating singleton instance");
      RelayWebsocket.instance = new RelayWebsocket();
    }
    return RelayWebsocket.instance;
  }

  send(message: any) {
    if (this.isOpen) this.ws.send(JSON.stringify(message));
    else this.queue.push(message);
  }

  async sendAndAwaitResponse(message: any, callbackId: string): Promise<any> {
    this.send({ ...message, callbackId });
    return new Promise((resolve) => {
      const listener = (msg: string) => {
        const data = JSON.parse(msg);
        if (data.callbackId === callbackId) {
          this.ws.removeListener("message", listener);
          resolve(data);
        }
      };
      this.ws.on("message", listener);
    });
  }
}
