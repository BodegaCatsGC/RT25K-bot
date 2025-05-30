# Use the official Node.js 18 image as the base
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./


# Install dependencies
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create directory for Google Auth credentials
RUN mkdir -p /root/.credentials

# Expose the port the app runs on (if needed)
# EXPOSE 3000

# Command to run the application
CMD [ "npm", "start" ]
