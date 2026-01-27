FROM 851725282348.dkr.ecr.us-east-1.amazonaws.com/ebc-registry:node-20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

FROM node:20-alpine
WORKDIR /app

COPY --from=build /app ./

RUN apk add --no-cache dumb-init

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "index.js"]
