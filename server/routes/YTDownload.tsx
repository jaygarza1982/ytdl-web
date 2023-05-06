import { Request, Response } from 'express';
import { spawn } from 'child_process';
import crypto from 'crypto';

// https://www.youtube.com/watch?v=P7iPkiyG2jQ&list=RDHuqagqnaDmY&index=4&pp=8AUB&ab_channel=ZZTop-Topic
// http://localhost:8050/api/download?url=https://www.youtube.com/watch?v=P7iPkiyG2jQ&list=RDHuqagqnaDmY&index=4&pp=8AUB&ab_channel=ZZTop-Topic
export const download = () => {
    return async (req: Request, res: Response) => {
        // TODO: Use replace-in-metadata for metadata mods
        const videoUrl: string = req.query.url + '';
        const downloadFilename = `filename.mp3`;
        const format = `mp3`;

        // Random filename for processing
        const outPath = `/tmp/${crypto.randomUUID()}-out.mp3`;
        
        const command = 'yt-dlp';
        const args: string[] = [
            '--extract-audio',
            '--audio-format',
            format,
            '--audio-quality',
            '0',
            '-o',
            outPath,
            videoUrl,
        ]

        const youtubeDlProcess = spawn(command, args);

        youtubeDlProcess.stdout.on('data', (data) => {
            const outMsg = `YTDL OUT: ${data.toString()}`;
            console.log(outMsg);
        });

        youtubeDlProcess.stderr.on('data', (data) => {
            console.error('YTDL ERR: ', data.toString());
        });

        youtubeDlProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`Download of ${videoUrl} completed successfully`);
                return res.download(outPath, downloadFilename);
            }

            console.error(`Download of ${videoUrl} failed with code ${code}`);
            res.status(500).send('Error');
        });
    }
}