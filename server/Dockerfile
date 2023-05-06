FROM node:20-buster

RUN mkdir -p /app/tmp
RUN mkdir -p /app/archive

RUN apt-get update -qq

# Install deps such as ffmpeg, youtube dl
RUN apt-get install -y ffmpeg curl && \
     curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /usr/local/bin/yt-dlp && \
     chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm i

COPY . .

RUN npx tsc

CMD ["npm", "run", "start"]