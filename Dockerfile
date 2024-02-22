# Use the alpine image as a base image with node v16
FROM node:16-alpine

# Set environment variables
ENV NODE_PATH=/usr/src/app/app
ENV NODE_ENV=production

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install build dependencies for npm packages
RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        g++ \
        autoconf \
        automake \
        libtool \
        nasm \
        libpng-dev \
        git


# Install dependencies for fetching and extracting Pandoc, and then download and install the Pandoc binary
ENV PANDOC_VERSION=3.1.1
RUN apk --no-cache add \
    curl \
    tar \
    && curl -L https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-linux-amd64.tar.gz | tar xvz \
    && mv pandoc-${PANDOC_VERSION}/bin/pandoc /usr/local/bin/pandoc \
    && chmod +x /usr/local/bin/pandoc \
    && rm -r pandoc-${PANDOC_VERSION} \
    && apk del curl tar

# Install your application's dependencies
RUN npm install

# Remove build dependencies to reduce image size
RUN apk del .gyp

# Copy the contents of ./app from your host to /usr/src/app in the container
COPY ./app ./app
COPY ./config ./config

# Make the required directories
RUN mkdir -p /usr/src/app/data/blogs
RUN mkdir -p /usr/src/app/data/tmp
RUN mkdir -p /usr/src/app/data/static
RUN mkdir -p /usr/src/app/data/git

# Your application probably listens on a certain port, so you'll use the EXPOSE instruction to have it mapped by the docker daemon.
EXPOSE 8080

# Define the command to run your application. This could be npm start, node app.js, or similar, depending on how you usually start your application.
CMD ["node", "app/index.js"]