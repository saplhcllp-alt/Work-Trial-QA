FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Dev server (Vite) for the trial — hot reload, easy to inspect.
CMD ["npm", "run", "dev"]
