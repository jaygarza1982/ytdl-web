import { Request, Response } from 'express';
import { downloadMp3 } from '../services/YTDownload';
import { fileExists } from '../services/file';
import { copyFile } from '../services/file';
import { addMetadata } from '../services/metadata';
import crypto from 'crypto';
import { WebSocket } from 'ws';

// https://www.youtube.com/watch?v=P7iPkiyG2jQ&list=RDHuqagqnaDmY&index=4&pp=8AUB&ab_channel=ZZTop-Topic
// http://localhost:8050/api/download?url=https://www.youtube.com/watch?v=P7iPkiyG2jQ&list=RDHuqagqnaDmY&index=4&pp=8AUB&ab_channel=ZZTop-Topic
// http://localhost:8050/api/download?title=test%20title&artist=artiststring&url=https://www.youtube.com/watch?v=P7iPkiyG2jQ&list=RDHuqagqnaDmY&index=4&pp=8AUB&ab_channel=ZZTop-Topic
// http://localhost:8050/api/download?title=test%20title&artist=artiststring&album=album%20string%20here&url=https://www.youtube.com/watch?v=P7iPkiyG2jQ&list=RDHuqagqnaDmY&index=4&pp=8AUB&ab_channel=ZZTop-Topic
// http://localhost:8050/api/download?title=test%20title&artist=artiststring&album=&url=https://www.youtube.com/watch?v=P7iPkiyG2jQ&list=RDHuqagqnaDmY&index=4&pp=8AUB&ab_channel=ZZTop-Topic
export const download = (clients: Map<string, WebSocket>) => {
    return async (req: Request, res: Response) => {
        const videoURL: string = req.query.url + '';
        const { title, artist, album, uuid } = req.query;
        const wsClient = clients.get(`${uuid}`);

        const downloadFilename = `download-filename.mp3`;

        const videoID = videoURL.substring(videoURL.indexOf('?v=') + 3, videoURL.indexOf('?v=') + 14);

        const serveFile = (outputFilePath: string) => {
            const tempFilePath = `/app/tmp/${crypto.randomUUID()}.mp3`;

            addMetadata(
                {
                    inputFilePath: outputFilePath,
                    outputFilePath: tempFilePath,
                    metadata: {
                        title: String(title || ''),
                        album: String(album || ''),
                        artist: String(artist || '')
                    },
                    ffmpegOut: (msg: string) => {
                        const message = `FFMPEG META OUT: ${msg}`;
                        console.log(message);
                        wsClient?.send(message);
                    },
                    ffmpegError: (msg: string) => {
                        const message = `FFMPEG META ERR: ${msg}`;
                        console.log(message);
                        wsClient?.send(message);
                    },
                    ffmpegExitSuccess: () => {
                        res.download(tempFilePath, downloadFilename);
                    },
                    ffmpegExitFailure: (errorMessage: string) => {
                        console.log(errorMessage);
                        wsClient?.send(errorMessage);
                    }
                }
            );
        }

        // Check if video id already archived
        const archivePath = `/app/archive/${videoID}.mp3`;
        if (fileExists(archivePath)) {
            console.log(`Pulling file from archive ${archivePath}`);

            return serveFile(archivePath);
        }

        downloadMp3({
            videoURL,
            ytdlError: (msg: string) => {
                const message = `YTDL ERROR: ${msg}`;
                console.log(message);
                wsClient?.send(message);
            },
            ytdlOut: (msg: string) => {
                const message = `YTDL OUT: ${msg}`;
                console.log(message);
                wsClient?.send(message);
            },
            ytdlExitFailure: (errorMsg: string) => {
                const message = `Could not download ${videoURL}, ID: ${videoID} message: ${errorMsg}`;
                console.log(message);
                wsClient?.send(message);
                res.status(500).send(message);
            },
            ytdlExitSuccess: (outputFilename) => {
                // Archive video
                copyFile(outputFilename, archivePath);
                serveFile(outputFilename);
            }
        });
    }
}