import express, { Express } from 'express';
import session from 'express-session';

const app: Express = express();
const port = 3000;

// What we can access these in our sessions
// declare module 'express-session' {
//     interface Session {
//         email: string;
//         ownerGroup: string;
//     }
// }

app.use(express.json());
app.use(session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: true,
    saveUninitialized: true
}));

app.post('/api/user/register', register());
app.post('/api/user/login', login());

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});