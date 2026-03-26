# Use Node.js 18 Alpine
FROM node:18-alpine

# Install libc6-compat for Next.js
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Clean up dev dependencies
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set the correct permissions for Next.js
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose default Next.js port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
