## Stage 1 (base)
# This stage installs all dependencies and builds the application if needed
FROM node:21-alpine3.18 AS base

ARG PANDOC_VERSION=3.1.1
ARG TARGETPLATFORM

EXPOSE 8080

ENV NODE_ENV=production
ENV NODE_PATH=/usr/src/app/app

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Set environment variables
ENV NODE_ENV=production

# Install necessary packages for Puppeteer, the git client, image processing
RUN apk add --no-cache git curl chromium nss freetype harfbuzz ca-certificates ttf-freefont

# Install pngquant and its dependencies
RUN apk add --no-cache pngquant

# Set the pngquant binary path
ENV PNGQUANT_BIN=/usr/bin/pngquant

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
RUN npm install --os=linux --libc=musl --cpu=${TARGETPLATFORM} && npm cache clean --force

# Add a debugging step to verify pngquant-bin is using the correct binary
# Overwrite /usr/src/app/node_modules/pngquant-bin/vendor/pngquant with the system binary
RUN cp /usr/bin/pngquant /usr/src/app/node_modules/pngquant-bin/vendor/pngquant

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
COPY ./app ./app
COPY ./scripts ./scripts
COPY ./config ./config
COPY ./notes ./notes
COPY ./todo.txt ./todo.txt

# copy in the git repository so the news page can be generated
COPY  .git .git

# build the brochure static site and exit (i.e. dont watch for changes)
# remove the git repository so it doesn't get copied into the final image
RUN node ./app/documentation/build/index.js --no-watch --skip-zip && rm -rf .git

## Stage 4 (default, production)
# The final production stage
FROM source AS prod

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl --fail http://localhost:8080/health || exit 1

# Ensure the logfile directory exists with proper permissions
RUN mkdir -p /usr/src/app/data/logs/docker && chmod -R 0755 /usr/src/app/data/logs/docker

# Change to the non-root user for the rest of the Dockerfile
USER 1000

# Re-configuring git for the non-root user
RUN git config --global user.email "you@example.com" && git config --global user.name "Your Name"

# 1.5gb max memory is 75% of the 2gb limit for the container
CMD ["sh", "-c", "node --max-old-space-size=1536 /usr/src/app/app/index.js >> /usr/src/app/data/logs/docker/app.log 2>&1"]