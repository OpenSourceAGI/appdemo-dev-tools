FROM codercom/code-server:ubuntu

# Run as root to install system packages and configure FUSE
USER root

# Install tools + FUSE3 support
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    build-essential \
    fuse3 \
    && rm -rf /var/lib/apt/lists/*

# Install geesefs — an S3/R2-compatible FUSE filesystem with local caching and live sync
RUN curl -L https://github.com/yandex-cloud/geesefs/releases/latest/download/geesefs-linux-amd64 \
    -o /usr/local/bin/geesefs && chmod +x /usr/local/bin/geesefs

# Allow non-root users to mount FUSE filesystems
RUN echo "user_allow_other" >> /etc/fuse.conf

# Install Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Create workspace mount point owned by coder
RUN mkdir -p /home/coder/workspace && chown -R coder:coder /home/coder

# Switch back to coder user
USER coder

WORKDIR /home/coder

COPY --chown=coder:coder entrypoint.sh /home/coder/entrypoint.sh
RUN chmod +x /home/coder/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/home/coder/entrypoint.sh"]
