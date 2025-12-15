import fs from "fs/promises"; // preferred in modern Node.js

await fs.writeFile("/tmp/next-app/WORKER_MARKER.txt", "hello");
