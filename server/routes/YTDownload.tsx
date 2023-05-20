import { Request, Response } from 'express';
import { downloadMp3 } from '../services/YTDownload';
import { deleteFile, fileExists } from '../services/file';
import { copyFile } from '../services/file';
import { addAlbumArt, addMetadata } from '../services/metadata';
import crypto from 'crypto';
import { WebSocket } from 'ws';

export const download = (clients: Map<string, WebSocket>) => {
    return async (req: Request, res: Response) => {
        const videoURL: string = req.query.url + '';
        const { title, artist, album, uuid, artid } = req.query;
        const wsClient = clients.get(`${uuid}`);

        const downloadFilename = `download-filename.mp3`;

        const videoID = videoURL.substring(videoURL.indexOf('?v=') + 3, videoURL.indexOf('?v=') + 14);

        const serveFile = (outputFilePath: string) => {
            const tempMetaFilePath = `/app/tmp/${crypto.randomUUID()}.mp3`;

            addMetadata(
                {
                    inputFilePath: outputFilePath,
                    outputFilePath: tempMetaFilePath,
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
                        // If we did not get an art path, download the file here
                        if (artid === '') {
                            res.download(tempMetaFilePath, downloadFilename, (err) => {
                                // Cleanup
                                deleteFile(tempMetaFilePath);
                            });
                        }

                        const tempArtFilePath = `/app/tmp/${crypto.randomUUID()}.mp3`;

                        addAlbumArt({
                            inputFilePath: tempMetaFilePath,
                            outputFilePath: tempArtFilePath,
                            artFilePath: String(artid || ''),
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
                                // Download the final file
                                res.download(tempArtFilePath, 'download.mp3', (err) => {
                                    // Cleanup
                                    deleteFile(tempArtFilePath);
                                    deleteFile(tempMetaFilePath);
                                });
                            },
                            ffmpegExitFailure: (errorMessage: string) => {
                                console.log(errorMessage);
                                wsClient?.send(errorMessage);
                            },
                        });
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