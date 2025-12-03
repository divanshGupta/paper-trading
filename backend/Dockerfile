# --- Base Image ---
FROM node:20

# --- Set work directory ---
WORKDIR /app

# --- Copy package files first for caching ---
COPY package*.json ./

# --- Copy prisma early so postinstall works ---
COPY prisma ./prisma

# --- Install dependencies (production only) ---
# prisma generate runs in postinstall and works because schema exists
RUN npm install --omit=dev

# --- Copy rest of the backend ---
COPY . .

# --- Expose backend port ---
EXPOSE 5500

# --- Start server ---
CMD ["node", "-r", "dotenv/config", "src/server.js"]
