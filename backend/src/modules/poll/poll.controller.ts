import { Request, Response, NextFunction } from 'express';
import pollService from './poll.service';

export class PollController {
    async getPolls(req: Request, res: Response, next: NextFunction) {
        try {
            const polls = await pollService.getAllPolls();
            res.status(200).json(polls);
        } catch (error) {
            next(error);
        }
    }

    async getPoll(req: Request, res: Response, next: NextFunction) {
        try {
            const poll = await pollService.getPollById(req.params.id as string);
            if (!poll) {
                return res.status(404).json({ message: 'Poll not found' });
            }
            res.status(200).json(poll);
        } catch (error) {
            next(error);
        }
    }

    async createPoll(req: Request, res: Response, next: NextFunction) {
        try {
            const poll = await pollService.createPoll(req.body);
            res.status(201).json(poll);
        } catch (error) {
            next(error);
        }
    }
}

export default new PollController();
