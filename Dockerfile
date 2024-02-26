# Build arguments for versions
ARG PANDOC_VERSION=3.1.1

# Stage 1: Build and test stage with node 
FROM node:16-alpine

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
        git

# Install dependencies for fetching and extracting Pandoc
RUN apk --no-cache add curl tar

# Install Pandoc
ARG PANDOC_VERSION

# Download and install the Pandoc binary
RUN curl -L https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-linux-amd64.tar.gz | tar xvz \
    && mv pandoc-${PANDOC_VERSION}/bin/pandoc /usr/local/bin/pandoc \
    && chmod +x /usr/local/bin/pandoc \
    && rm -r pandoc-${PANDOC_VERSION}

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV NODE_PATH=/usr/src/app/app
ENV npm_config_build_from_source=true

# Install your application's dependencies including dev dependencies 
RUN npm ci 

# Copy the contents of your application into the container
COPY . .

EXPOSE 8080

CMD ["node", "app/index.js"]