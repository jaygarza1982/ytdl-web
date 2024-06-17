import express, { Express } from 'express';
import session from 'express-session';
import { test } from './routes/test';
import { download, downloadVideo } from './routes/YTDownload';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import multer from 'multer';
import { updateYTDL } from './services/YTDLUpdater';
import { Client } from 'pg';

// Initial DB setup
// TODO: Figure out how to pass client to routes like we do with clients map
const { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD } = process.env;
const dbConfig = {
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    host: 'ytdl-web-postgres',
    port: 5432,
    database: POSTGRES_DB,
};
(async () => {
    try {
        const client: Client = new Client(dbConfig);
        await client.connect()

        console.log('SQL client connected successfully');

    } catch (error) {
        console.log('Could not do DB setup', error);
    }
})();

// Update YTDL binary every 10 min
setInterval(() => {
    updateYTDL({
        updateOut: (msg: string) => {
            console.log(`YTDL update out: ${msg}`);
        },
        updateError: (msg: string) => {
            console.log(`YTDL update error: ${msg}`);
        },
        updateExitSuccess: () => {
            console.log(`Was able to update the YTDL binary successfully at ${new Date()}`);
        },
        updateExitFailure: (errorMessage: string) => {
            console.log(`YTDL exit failure: ${errorMessage}`);
        }
    });
}, 10 * 60 * 1000);

const app: Express = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/app/tmp');
    },
    filename: function (req, file, cb) {
        const { originalname } = file;
        const fileExt = originalname.split('.').pop();

        cb(null, `${crypto.randomUUID()}-art.${fileExt}`);
    }
});

const upload = multer({ storage: storage });
  
const clients = new Map<string, WebSocket>();

const wss = new WebSocketServer({
    port: 3001
});

wss.on('error', console.error);
wss.on('connection', (socket) => {
    const UUID = crypto.randomUUID();

    socket.on('error', console.error);
    socket.on('unexpected-response', console.error);
    socket.on('close', () => {
        console.log(`Closing socket ${UUID}`);

        clients.delete(UUID);
    });
    
    clients.set(UUID, socket);
    socket.send(UUID);
});

app.use(express.json());
app.use(session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: true,
    saveUninitialized: true
}));


app.get('/api', test());
app.get('/api/download', download(clients));
app.get('/api/download-video', downloadVideo(clients));
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    res.send(req.file?.path);
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});