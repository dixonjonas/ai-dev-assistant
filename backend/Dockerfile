FROM node:23-alpine
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN npm install --force
COPY . .
EXPOSE 3001
CMD [ "npm", "start" ]
