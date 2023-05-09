import { spawn } from 'child_process';
import { writeToFile } from './file';
import crypto from 'crypto';

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

    let ffmpegCommand = `ffmpeg -i `;
    ffmpegCommand += `"${inputFilePath}" `;
    ffmpegCommand += `-c `;
    ffmpegCommand += `copy `;
    ffmpegCommand += `-metadata `;
    ffmpegCommand += `title="${title}" `;
    ffmpegCommand += `-metadata `;
    ffmpegCommand += `artist="${artist}" `;
    ffmpegCommand += `-metadata `;
    ffmpegCommand += `album="${album}" `;
    ffmpegCommand += `"${outputFilePath}" `;

    const tempCommandFile = `/app/tmp/${crypto.randomUUID()}.sh`;
    try {
        writeToFile(tempCommandFile, ffmpegCommand);
    } catch (error) {
        const failureMessage = `Could not write metadata because the file ${tempCommandFile} could not be written. Reason ${error}`;
        return ffmpegExitFailure(failureMessage);
    }

    const ffmpegProcess = spawn('bash', [tempCommandFile]);

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