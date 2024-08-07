import { spawn } from 'child_process';
import { deleteFile, writeToFile } from './file';
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

interface IAddAlbumArtParams {
    inputFilePath: string;
    outputFilePath: string;
    artFilePath: string;
    ffmpegOut: (msg: string) => void;
    ffmpegError: (msg: string) => void;
    ffmpegExitSuccess: () => void;
    ffmpegExitFailure: (errorMessage: string) => void;
}

const addMetadata = (params: IAddMetadataParams) => {
    const { inputFilePath, outputFilePath, metadata, ffmpegOut, ffmpegError, ffmpegExitSuccess, ffmpegExitFailure } = params;
    const { title, artist, album } = metadata;

    let ffmpegCommand = `ffmpeg -hide_banner -i `;
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

    console.log(`Running meta command "${ffmpegCommand}"`);

    // We write to a shell script file instead of running the command directly because we cannot use quotes properly
    // In the metadata the quotes will appear without this method
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
        // Cleanup
        deleteFile(tempCommandFile);

        if (code === 0) {
            return ffmpegExitSuccess();
        }

        ffmpegExitFailure(`FFMPEG input ${inputFilePath} failed code ${code}`);
    });
}

const addAlbumArt = (params: IAddAlbumArtParams) => {
    const { inputFilePath, outputFilePath, artFilePath, ffmpegOut, ffmpegError, ffmpegExitSuccess, ffmpegExitFailure } = params;

    let ffmpegCommand = `ffmpeg -hide_banner -i `;
    ffmpegCommand += `"${inputFilePath}" `;
    ffmpegCommand += `-i `;
    ffmpegCommand += `"${artFilePath}" `;
    ffmpegCommand += `-c `;
    ffmpegCommand += `copy `;
    ffmpegCommand += `-map `;
    ffmpegCommand += `0 `;
    ffmpegCommand += `-map `;
    ffmpegCommand += `1 `;
    ffmpegCommand += `"${outputFilePath}" `;

    console.log(`Running album art command "${ffmpegCommand}"`);

    // We write to a shell script file instead of running the command directly because we cannot use quotes properly
    // In the metadata the quotes will appear without this method
    const tempCommandFile = `/app/tmp/${crypto.randomUUID()}.sh`;
    try {
        writeToFile(tempCommandFile, ffmpegCommand);
    } catch (error) {
        const failureMessage = `Could not write album art because the file ${tempCommandFile} could not be written. Reason ${error}`;
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
        // Cleanup
        deleteFile(tempCommandFile);
        deleteFile(artFilePath);

        if (code === 0) {
            return ffmpegExitSuccess();
        }

        ffmpegExitFailure(`FFMPEG input ${inputFilePath} failed code ${code}`);
    });
}

export { addMetadata, addAlbumArt }