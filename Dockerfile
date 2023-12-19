FROM --platform=linux/amd64/v2 node:16-alpine

ADD . /frontend
WORKDIR /frontend
RUN npm install --silent

CMD ["npm", "start"]