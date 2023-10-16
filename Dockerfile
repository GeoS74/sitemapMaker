FROM node

WORKDIR /sitemap-maker

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3150

CMD ["node", "./dist/index"]