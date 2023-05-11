import express, { Express } from 'express';
import session from 'express-session';
import { test } from './routes/test';
import { download } from './routes/YTDownload';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';

const app: Express = express();
const port = 3000;

// What we can access these in our sessions
declare module 'express-session' {
    interface Session {
        email: string;
        ownerGroup: string;
    }
}

const clients = new Map<string, WebSocket>();

const wss = new WebSocketServer({
    port: 3001
});

wss.on('error', console.error);
wss.on('connection', (socket, request) => {
    // TODO: Destory sockets
    // TODO: Pass clients to download API so it can send as it console logs
    // TODO: Frontend will save UUID on first message received and pass download API

    const UUID = crypto.randomUUID();

    socket.on('error', console.error);
    socket.on('unexpected-response', console.error);

    socket.send(UUID);

    clients.set(UUID, socket);
});

app.use(express.json());
app.use(session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: true,
    saveUninitialized: true
}));


app.get('/api', test());
app.get('/api/download', download());

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});