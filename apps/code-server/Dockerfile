FROM codercom/code-server:4.96.4

USER root
RUN apt-get update \
    && apt-get install -y curl wget sudo git build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Revert to the code-server default user
USER coder

# Expose code-server and Node.js worker ports
EXPOSE 8080 8081

# Clone and copy projects
RUN git clone https://github.com/code100x/mobile-magic.git /tmp/bolty-worker
RUN cp -r /tmp/bolty-worker/expo-base-app /tmp/mobile-app
RUN cp -r /tmp/bolty-worker/nextjs-base-app /tmp/next-app
RUN cp -r /tmp/bolty-worker/react-base-app /tmp/react-app

# Install npm dependencies
RUN cd /tmp/mobile-app && npm install
RUN cd /tmp/next-app && npm install
RUN cd /tmp/react-app && npm install

WORKDIR /app

# Install code-server extension
RUN wget https://github.com/code100x/mobile-magic/raw/refs/heads/main/ext/bolty-listener-0.0.1.vsix
RUN code-server --install-extension bolty-listener-0.0.1.vsix

# Fix permissions
RUN sudo chown -R coder /tmp/bolty-worker /tmp/mobile-app /tmp/next-app /tmp/react-app /app

# Set default theme to dark
RUN mkdir -p /home/coder/.local/share/code-server/User
RUN echo '{"workbench.colorTheme": "Dark+", "workbench.preferredDarkColorTheme": "Dark+"}' > /home/coder/.local/share/code-server/User/settings.json

# Start code-server on container launch
CMD ["code-server", "--auth", "none", "--bind-addr", "0.0.0.0:8080", "--disable-telemetry", "/app"]
