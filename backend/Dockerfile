# Use Node 20 slim as base
FROM node:20-slim

# Install openssl (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Copy prisma folder early (needed for prisma generate in postinstall)
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Expose your backend port (adjust if needed)
EXPOSE 5500

# Start the app
CMD ["npm", "run", "dev"]
