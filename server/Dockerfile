FROM node:20-alpine

WORKDIR /app

# Install openssl for prisma engine
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
