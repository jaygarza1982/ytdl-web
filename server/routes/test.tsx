import { Request, Response } from 'express';

export const test = () => {
    return async (req: Request, res: Response) => {
        res.send('test route');
    }
}