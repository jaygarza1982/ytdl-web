import { spawn } from 'child_process';
import { deleteFile, writeToFile } from './file';
import crypto from 'crypto';

interface IUpdateParams {
    updateOut: (msg: string) => void;
    updateError: (msg: string) => void;
    updateExitSuccess: () => void;
    updateExitFailure: (errorMessage: string) => void;
}

const updateYTDL = (params: IUpdateParams) => {
    const { updateOut, updateError, updateExitSuccess, updateExitFailure } = params;

    let updateCommand = `curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /usr/local/bin/yt-dlp`;

    console.log(`Running update command "${updateCommand}"`);

    // We write to a shell script file instead of running the command directly
    const tempCommandFile = `/app/tmp/${crypto.randomUUID()}.sh`;
    try {
        writeToFile(tempCommandFile, updateCommand);
    } catch (error) {
        const failureMessage = `Could not update YTDL binary because the file ${tempCommandFile} could not be written. Reason ${error}`;
        return updateExitFailure(failureMessage);
    }

    const updateProcess = spawn('bash', [tempCommandFile]);

    updateProcess.stdout.on('data', (data) => {
        updateOut(data.toString());
    });

    updateProcess.stderr.on('data', (data) => {
        updateError(data.toString());
    });

    updateProcess.on('close', (code) => {

        if (code === 0) {
            deleteFile(tempCommandFile);
            return updateExitSuccess();
        }

        updateExitFailure(`Update command file ${tempCommandFile} failed with code ${code}`);
    });
}

export { updateYTDL }