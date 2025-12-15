export class ArtifactProcessor {
    public currentArtifact: string;
    private onFileContent: (filePath: string, fileContent: string) => void;
    private onShellCommand: (shellCommand: string) => void;
  
    constructor(
      currentArtifact: string,
      onFileContent: (filePath: string, fileContent: string) => void,
      onShellCommand: (shellCommand: string) => void
    ) {
      this.currentArtifact = currentArtifact;
      this.onFileContent = onFileContent;
      this.onShellCommand = onShellCommand;
    }
  
    append(artifact: string) {
      this.currentArtifact += artifact;
      this.parse(); // parse whenever new artifact comes
    }
  
    parse() {
      const actionRegex = /<boltAction\s+type="(shell|file)"(?:\s+filePath="([^"]+)")?>([\s\S]*?)<\/boltAction>/g;
      let match;
      while ((match = actionRegex.exec(this.currentArtifact)) !== null) {
        const [fullMatch, type, filePath, content] = match;
        if (type === "shell") {
          const command = content.trim();
          if (command) this.onShellCommand(command);
        } else if (type === "file" && filePath) {
          const fileContent = content.trim();
          this.onFileContent(filePath, fileContent);
        }
        this.currentArtifact = this.currentArtifact.replace(fullMatch, "");
      }
    }
  }
  