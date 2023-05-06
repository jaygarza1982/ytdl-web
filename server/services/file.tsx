import fs from 'fs';

const copyFile = (from: string, to: string) => {
    fs.copyFileSync(from, to);
}

const fileExists = (path: string) => {
    return fs.existsSync(path);
}

export { copyFile, fileExists }
