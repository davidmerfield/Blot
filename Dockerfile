## Stage 0 (builder)
# This stage installs all dependencies and builds the application if needed
FROM node:16.13.0-alpine as builder

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
RUN curl -L https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-linux-amd64.tar.gz | tar xvz \
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
FROM node:16.13.0-alpine as base

EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV NODE_PATH=/usr/src/app/app

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app .
COPY --from=builder /usr/local/bin/pandoc /usr/local/bin/pandoc

## Stage 2 (development)
# This stage is for development purposes
FROM base as dev

ENV NODE_ENV=development
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

RUN npm install

## Stage 3 (copy in source)
# This gets our source code into builder for use in next two stages
# It gets its own stage so we don't have to copy twice
# this stage starts from the first one and skips the last two
FROM base as source

WORKDIR /usr/src/app

COPY ./app ./app
COPY ./config ./config
COPY ./notes ./notes

## Stage 4 (testing)
# This stage is used for running tests in CI
FROM source as test

WORKDIR /usr/src/app

# this copies all dependencies (prod+dev)
COPY --from=dev /usr/src/app/node_modules ./node_modules

# this copies the tests
COPY ./tests ./tests

# Run linters and tests
# RUN eslint . 

RUN npx depcheck --ignores=nodemon,blessed-contrib,twit,fontkit,text-to-svg --skip-missing

CMD npm test

# CMD ["npm", "run", "int-test"] could be used for integration tests

## Stage 5 (default, production)
# The final production stage
FROM source as prod

# Set healthcheck using curl to check the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "./app/index.js"]