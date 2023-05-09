import fs from 'fs';

const copyFile = (from: string, to: string) => {
    try {
        fs.copyFileSync(from, to);
    } catch (error) {
        console.log(`Could not copy from ${from} to ${to} because ${error}`);
    }
}

const fileExists = (path: string) => {
    try {
        return fs.existsSync(path);
    } catch (error) {
        console.log(`Could not check if file ${path} exists because ${error}`);
    }
}

const writeToFile = (path: string, contents: string) => {
    fs.writeFileSync(path, contents);
}

export { copyFile, fileExists, writeToFile }
