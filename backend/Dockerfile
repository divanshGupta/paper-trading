# ---- Base Node image ----
FROM node:20-alpine

# ---- Set working directory ----
WORKDIR /app

# ---- Copy package files ----
COPY package*.json ./

# ---- Install ONLY production dependencies ----
RUN npm install --production

# ---- Copy rest of the backend ----
COPY . .

# ---- Expose port Fly will route to ----
EXPOSE 5500

# ---- Run server (Fly injects env vars itself) ----
CMD ["node", "src/server.js"]
