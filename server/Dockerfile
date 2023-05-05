FROM node:16-bullseye

RUN apt-get update -qq
RUN apt-get install -y ffmpeg
RUN mkdir /s3-temp

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm i

COPY . .

RUN npx tsc

CMD ["npm", "run", "start"]