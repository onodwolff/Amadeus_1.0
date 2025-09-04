FROM node:20-alpine
WORKDIR /app
COPY . ./
EXPOSE 4400
CMD ["sh", "-lc", "npm ci && npx ng serve --host 0.0.0.0 --port 4400"]
