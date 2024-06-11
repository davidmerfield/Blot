# Use the smallest node image as the base image
FROM node:14-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the app
CMD ["npm", "start"]