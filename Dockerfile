## Stage 0 (builder)
# This stage installs all dependencies and builds the application if needed
# n.b. if you update the node version for this stage, don't forget to change
# the image of the 'base' stage to match as well
FROM node:18.20-alpine AS builder

ARG PANDOC_VERSION=3.1.1
ARG TARGETPLATFORM

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Set environment variables
ENV NODE_ENV=production

# Install curl
RUN apk add --no-cache curl

# Install Pandoc
RUN ARCH=$(echo ${TARGETPLATFORM} | sed -nE 's/^linux\/(amd64|arm64)$/\1/p') \
  && if [ -z "$ARCH" ]; then echo "Unsupported architecture: $TARGETPLATFORM" && exit 1; fi \
  && curl -L https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-linux-${ARCH}.tar.gz | tar xvz \
  && mv pandoc-${PANDOC_VERSION}/bin/pandoc /usr/local/bin/pandoc \
  && chmod +x /usr/local/bin/pandoc \
  && rm -r pandoc-${PANDOC_VERSION}

# Copy package files
COPY package.json package-lock.json ./

# Install build dependencies
RUN apk add --no-cache --virtual .build-deps python3 make g++ autoconf automake libtool nasm libpng-dev git tar \
    && npm ci \
    && npm cache clean --force \
    && apk del .build-deps

## Stage 1 (production base)
# This stage prepares the production environment
FROM node:18.20-alpine AS base

EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV NODE_PATH=/usr/src/app/app

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Install necessary packages for Puppeteer and the git client
RUN apk add --no-cache git curl chromium nss freetype harfbuzz ca-certificates ttf-freefont

# Set the Puppeteer executable path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Change the ownership of the working directory
RUN chown -R 1000:1000 /usr/src/app

# Switch to a non-root user (ec2-user in production)
USER 1000:1000

# Copy the built application from the builder stage and set its ownership
COPY --from=builder --chown=1000:1000 /usr/src/app .
COPY --from=builder --chown=1000:1000 /usr/local/bin/pandoc /usr/local/bin/pandoc

# Configure git for the non-root user
RUN git config --global user.email "you@example.com" && git config --global user.name "Your Name"

## Stage 2 (development)
# This stage is for development purposes
FROM base AS dev

ENV NODE_ENV=development
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

RUN npm install

## Stage 3 (copy in source)
# This gets our source code into builder for use in next two stages
# It gets its own stage so we don't have to copy twice
# this stage starts from the first one and skips the last two
FROM base AS source

WORKDIR /usr/src/app

# Copy files and set ownership for non-root user
COPY --chown=1000:1000 ./app ./app
COPY --chown=1000:1000 ./scripts ./scripts
COPY --chown=1000:1000 ./config ./config
COPY --chown=1000:1000 ./notes ./notes
COPY --chown=1000:1000 ./todo.txt ./todo.txt

# copy in the git repository so the news page can be generated
COPY --chown=1000:1000  .git .git

# build the brochure static site and exit (i.e. dont watch for changes)
# remove the git repository so it doesn't get copied into the final image
RUN node ./app/documentation/build/index.js --no-watch --skip-zip && rm -rf .git

## Stage 4 (testing)
# This stage is used for running tests in CI
FROM source AS test

WORKDIR /usr/src/app
ENV NODE_ENV=test

COPY --from=dev --chown=1000:1000 /usr/src/app/node_modules ./node_modules

# this copies the tests
COPY --chown=1000:1000 ./tests ./tests

## Stage 5 (default, production)
# The final production stage
FROM source AS prod

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl --fail http://localhost:8080/health || exit 1

# 1.5gb max memory is 75% of the 2gb limit for the container
CMD ["sh", "-c", "node --max-old-space-size=1536 /usr/src/app/app/index.js >> /usr/src/app/data/logs/docker/app.log 2>&1"]