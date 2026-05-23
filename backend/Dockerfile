FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema early for postinstall
COPY prisma ./prisma

# Install all dependencies (need dev for prisma CLI)
RUN npm install

# Copy rest of source
COPY . .

# Generate prisma client
RUN npx prisma generate

# Expose correct port
EXPOSE 8080

# Start server
CMD ["node", "src/server.js"]