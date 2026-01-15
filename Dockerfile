FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package*.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy all source code
COPY . .

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "dev"]
