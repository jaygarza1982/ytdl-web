import express, { Express } from 'express';
import session from 'express-session';
import { test } from './routes/test';
import { download } from './routes/YTDownload';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import multer from 'multer';

const app: Express = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/app/tmp')
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}`);
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
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    res.send();
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});