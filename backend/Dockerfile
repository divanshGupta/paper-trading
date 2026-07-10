FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema early for postinstall
COPY prisma ./prisma

# Install all dependencies (need dev for prisma CLI)
RUN npm install
RUN npx prisma generate
RUN npm prune --production

# Copy rest of source
COPY . .

# Generate prisma client
RUN npx prisma generate

# Expose correct port
EXPOSE 8080

# Start server
CMD ["node", "src/server.js"]