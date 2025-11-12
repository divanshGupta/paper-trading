FROM node:20-alpine

WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Start Next.js in development mode with proper host configuration
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
