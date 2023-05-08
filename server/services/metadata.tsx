import { spawn } from 'child_process';

interface IMetadata {
    title: string;
    artist: string;
    album: string;
}

interface IAddMetadataParams {
    inputFilePath: string;
    outputFilePath: string;
    metadata: IMetadata;
    ffmpegOut: (msg: string) => void;
    ffmpegError: (msg: string) => void;
    ffmpegExitSuccess: () => void;
    ffmpegExitFailure: (errorMessage: string) => void;
}

const addMetadata = (params: IAddMetadataParams) => {
    const { inputFilePath, outputFilePath, metadata, ffmpegOut, ffmpegError, ffmpegExitSuccess, ffmpegExitFailure } = params;
    const { title, artist, album } = metadata;
    
    const command = 'ffmpeg';
    const args: string[] = [
        `-i`,
        inputFilePath,
        `-c`,
        `copy`,
        `-metadata`,
        `title=\"${title}\"`,
        `-metadata`,
        `artist=\"${artist}\"`,
        `-metadata`,
        `album=\"${album}\"`,
        outputFilePath
    ]

    const ffmpegProcess = spawn(command, args);

    ffmpegProcess.stdout.on('data', (data) => {
        ffmpegOut(data.toString());
    });

    ffmpegProcess.stderr.on('data', (data) => {
        ffmpegError(data.toString());
    });

    ffmpegProcess.on('close', (code) => {
        if (code === 0) {
            return ffmpegExitSuccess();
        }

        ffmpegExitFailure(`FFMPEG input ${inputFilePath} failed code ${code}`);
    });
}

export { addMetadata }