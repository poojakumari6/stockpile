# ---- Frontend Dockerfile (multi-stage, production-ready) ----

# Stage 1: build the static assets
FROM node:20-alpine AS build
WORKDIR /app

# The API URL is baked in at build time (Vite inlines VITE_* vars).
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: serve with a tiny nginx image
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
