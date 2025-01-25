## Stage 0 (builder)
# This stage installs all dependencies and builds the application if needed
FROM node:16.13.0-alpine AS builder

ARG PANDOC_VERSION=3.1.1

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Install build dependencies for npm packages
RUN apk add --no-cache --virtual .build-deps \
        python3 \
        make \
        g++ \
        autoconf \
        automake \
        libtool \
        nasm \
        libpng-dev \
        git \
        curl \
        tar

# Install Pandoc
ARG TARGETPLATFORM
RUN ARCH=$(echo ${TARGETPLATFORM} | sed -nE 's/^linux\/(amd64|arm64)$/\1/p') \
    && if [ -z "$ARCH" ]; then echo "Unsupported architecture: $TARGETPLATFORM" && exit 1; fi \
    && curl -L https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-linux-${ARCH}.tar.gz | tar xvz \
    && mv pandoc-${PANDOC_VERSION}/bin/pandoc /usr/local/bin/pandoc \
    && chmod +x /usr/local/bin/pandoc \
    && rm -r pandoc-${PANDOC_VERSION}

# Set environment variables
ENV NODE_ENV=production

# Copy package files
COPY package.json .
COPY package-lock.json .

# Install all dependencies including devDependencies
RUN npm config list \
    && npm ci \
    && npm cache clean --force

# Remove build dependencies
RUN apk del .build-deps

## Stage 1 (production base)
# This stage prepares the production environment
FROM node:16.13.0-alpine AS base

EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV NODE_PATH=/usr/src/app/app

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app .
COPY --from=builder /usr/local/bin/pandoc /usr/local/bin/pandoc

# Install git for good since the git client requires it
RUN apk add --no-cache git

# Install curl for good since the health check requires it
RUN apk add --no-cache curl

# configure git 
RUN git config --global user.email "you@example.com"
RUN git config --global user.name "Your Name"
# neccessary for the git client to work in the docker container
# the issue is possibly related to the ownership of the git data
# directory, and the root user running the git client
# todo: work out how to fix this
RUN git config --global --add safe.directory '*'

# Install necessary packages for Puppeteer
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Set the Puppeteer executable path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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

COPY ./app ./app
COPY ./scripts ./scripts
COPY ./config ./config
COPY ./notes ./notes
COPY ./todo.txt ./todo.txt

## Stage 4 (testing)
# This stage is used for running tests in CI
FROM source AS test

WORKDIR /usr/src/app
ENV NODE_ENV=test

# this copies all dependencies (prod+dev)
COPY --from=dev /usr/src/app/node_modules ./node_modules

# this copies the tests
COPY ./tests ./tests

# copy in the git repository so the news page can be generated
# inside the container, this is a bit of a hack and should be
# replaced with a better solution in the future
COPY .git .git

## Stage 5 (default, production)
# The final production stage
FROM source AS prod

# build the brochure static site and exit (i.e. dont watch for changes)
RUN node ./app/documentation/build/index.js --no-watch

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:8080/health || exit 1

# Use an environment variable for flexibility
ENV LOG_PATH=/app/data/logs/docker/app.log

# Ensure the logfile directory exists with proper permissions
RUN mkdir -p /app/data/logs/docker && chmod -R 0755 /app/data/logs/docker

# Redirect logs to a file
CMD ["sh", "-c", "node /app/index.js >> $LOG_PATH 2>&1"]