# Build React
FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Copias solo el build final
COPY --from=build /app/dist ./dist

# Instalas el servidor estático minimalista
RUN npm install -g serve

EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
