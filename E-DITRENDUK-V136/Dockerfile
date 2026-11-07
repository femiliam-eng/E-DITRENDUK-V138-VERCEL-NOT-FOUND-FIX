FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY . .
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
 CMD node -e "fetch('http://127.0.0.1:3000/api/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","server-postgres.js"]
