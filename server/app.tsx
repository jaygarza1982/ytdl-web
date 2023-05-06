import express, { Express } from 'express';
import session from 'express-session';
import { test } from './routes/test';
import { download } from './routes/YTDownload';

const app: Express = express();
const port = 3000;


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