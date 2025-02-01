## Stage 1 (base)
# This stage installs all dependencies and builds the application if needed
FROM node:22.13.1-alpine AS base

ARG PANDOC_VERSION=3.1.1
ARG TARGETPLATFORM

EXPOSE 8080

ENV NODE_ENV=production
ENV NODE_PATH=/usr/src/app/app

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Install necessary packages for Puppeteer, the git client, image processing
RUN apk add --no-cache git curl chromium nss freetype harfbuzz ca-certificates ttf-freefont

# Set the Puppeteer executable path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install Pandoc
RUN ARCH=$(echo ${TARGETPLATFORM} | sed -nE 's/^linux\/(amd64|arm64)$/\1/p') \
  && if [ -z "$ARCH" ]; then echo "Unsupported architecture: $TARGETPLATFORM" && exit 1; fi \
  && curl -L https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-linux-${ARCH}.tar.gz | tar xvz \
  && mv pandoc-${PANDOC_VERSION}/bin/pandoc /usr/local/bin/pandoc \
  && chmod +x /usr/local/bin/pandoc \
  && rm -r pandoc-${PANDOC_VERSION}

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (args from https://sharp.pixelplumbing.com/install#cross-platform)
RUN npm install --maxsockets 1 --os=linux --libc=musl --cpu=${TARGETPLATFORM} && npm cache clean --force

## Stage 2 (development)
# This stage is for development and testing purposes
# It doesn't include the source code, so it's faster to build
# but you need to use docker bind mounts to get the source code in
# at runtime. 
FROM base AS dev

ENV NODE_ENV=development
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

RUN npm install

# Configure git so the git client doesn't complain
RUN git config --global --add safe.directory /usr/src/app && git config --global user.email "you@example.com" && git config --global user.name "Your Name"

## Stage 3 (copy in source)
# This gets our source code into builder for use in next two stages
# It gets its own stage so we don't have to copy twice
# this stage starts from the first one and skips the last two
FROM base AS source

WORKDIR /usr/src/app

# Copy files and set ownership for non-root user
COPY ./scripts ./scripts
COPY ./config ./config
COPY ./notes ./notes
COPY ./app ./app
COPY ./todo.txt ./todo.txt

## Stage 4 (default, production)
# The final production stage
FROM source AS prod

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl --fail http://localhost:8080/health || exit 1

# Ensure the logfile directory exists with proper permissions
RUN mkdir -p /usr/src/app/data/logs/docker && chmod -R 0755 /usr/src/app/data/logs/docker

# Give the non-root user ownership of the app directory
RUN chown -R 1000:1000 /usr/src/app/app

# Change to the non-root user for the rest of the Dockerfile (ec2-user)
USER 1000

# Re-configuring git for the non-root user
RUN git config --global user.email "you@example.com" && git config --global user.name "Your Name"

# 1048.00 MB max memory default is 75% of the 1.5gb limit for the container
CMD ["sh", "-c", "node  /usr/src/app/app/index.js >> /usr/src/app/data/logs/docker/app.log 2>&1"]