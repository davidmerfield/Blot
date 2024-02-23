# Stage 1: Build and test stage with node 
FROM node:16-alpine AS builder

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

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
RUN apk --no-cache add \
    curl \
    tar

# Download and install the Pandoc binary
ENV PANDOC_VERSION=3.1.1
RUN curl -L https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-linux-amd64.tar.gz | tar xvz \
    && mv pandoc-${PANDOC_VERSION}/bin/pandoc /usr/local/bin/pandoc \
    && chmod +x /usr/local/bin/pandoc \
    && rm -r pandoc-${PANDOC_VERSION}

# Set environment variables
ENV NODE_PATH=/usr/src/app/app
ENV npm_config_build_from_source=true

# Install your application's dependencies including 'devDependencies' in the Docker container
RUN npm install 

# Copy the contents of your application into the container
COPY . .

# Stage 2: Production stage
FROM node:16-alpine AS production

# Set environment variables
# these are not inherited from the builder stage
# so we need to set them again
ENV NODE_ENV=production
ENV NODE_PATH=/usr/src/app/app
ENV npm_config_build_from_source=true

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy build artifacts from the builder stage
COPY --from=builder /usr/src/app/app ./app
COPY --from=builder /usr/src/app/notes ./notes 
COPY --from=builder /usr/src/app/config ./config
# Note: We do not copy the tests directory or any development dependencies to the production image

# Your application probably listens on a certain port, so you'll use the EXPOSE instruction to have it mapped by the docker daemon.
EXPOSE 8080

# Define the command to run your application. This could be npm start, node app.js, or similar, depending on how you usually start your application.
CMD ["node", "app/index.js"]