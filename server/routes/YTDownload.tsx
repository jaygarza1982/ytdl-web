import { Request, Response } from 'express';
import { downloadMp3 } from '../services/YTDownload';
import { fileExists } from '../services/file';
import { copyFile } from '../services/file';

// https://www.youtube.com/watch?v=P7iPkiyG2jQ&list=RDHuqagqnaDmY&index=4&pp=8AUB&ab_channel=ZZTop-Topic
// http://localhost:8050/api/download?url=https://www.youtube.com/watch?v=P7iPkiyG2jQ&list=RDHuqagqnaDmY&index=4&pp=8AUB&ab_channel=ZZTop-Topic
export const download = () => {
    return async (req: Request, res: Response) => {
        const videoURL: string = req.query.url + '';
        const downloadFilename = `download-filename.mp3`;

        const videoID = videoURL.substring(videoURL.indexOf('?v=') + 3, videoURL.indexOf('?v=') + 14);

        const serveFile = (outputFilePath: string) => {
            // TODO: For metadata
            // TODO: ffmpeg -i test.mp3 -c copy -metadata title="title meta" -metadata artist="artist meta" -metadata album="album meta" output.mp3
            res.download(outputFilePath, downloadFilename);
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
                console.log('YTDL ERROR: ', msg);
            },
            ytdlOut: (msg: string) => {
                console.log('YTDL OUT: ', msg);
            },
            ytdlExitFailure: (errorMsg: string) => {
                const message = `Could not download ${videoURL}, ID: ${videoID} message: ${errorMsg}`;
                console.log(message);
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