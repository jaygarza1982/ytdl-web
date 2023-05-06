import { spawn } from 'child_process';
import crypto from 'crypto';

interface IDownloadMp3Params {
    videoURL: string;
    ytdlOut: (msg: string) => void;
    ytdlError: (msg: string) => void;
    ytdlExitSuccess: (outputFilename: string) => void;
    ytdlExitFailure: (errorMessage: string) => void;
}

const downloadMp3 = (params: IDownloadMp3Params) => {
    const { videoURL, ytdlOut, ytdlError, ytdlExitSuccess, ytdlExitFailure } = params;

    const videoID = videoURL.substring(videoURL.indexOf('?v=') + 3, videoURL.indexOf('?v=') + 14);

    // Random filename for processing
    const fileUUID = crypto.randomUUID();
    const outputFilePath = `/app/tmp/${videoID}-${fileUUID}-out.mp3`;
    
    const command = 'yt-dlp';
    const args: string[] = [
        '--extract-audio',
        '--audio-format',
        'mp3',
        '--audio-quality',
        '0',
        '-o',
        outputFilePath,
        videoURL,
    ]

    const youtubeDlProcess = spawn(command, args);

    youtubeDlProcess.stdout.on('data', (data) => {
        ytdlOut(data.toString());
    });

    youtubeDlProcess.stderr.on('data', (data) => {
        ytdlError(data.toString());
    });

    youtubeDlProcess.on('close', async (code) => {
        if (code === 0) {
            console.log(`Successfully downloaded ${videoID}`);
            return ytdlExitSuccess(outputFilePath);
        }

        ytdlExitFailure(`Download of ${videoURL} failed with code ${code}`);
    });
}

export { downloadMp3 }