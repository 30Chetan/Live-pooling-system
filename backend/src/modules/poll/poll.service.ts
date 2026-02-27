import Poll from './poll.model';
import { IPollCreateRequest, IPoll } from './poll.types';

export class PollService {
    async getAllPolls(): Promise<IPoll[]> {
        return await Poll.find().sort({ createdAt: -1 });
    }

    async getPollById(id: string): Promise<IPoll | null> {
        return await Poll.findById(id);
    }

    private isExpired(poll: IPoll): boolean {
        if (!poll.startTime) return false;

        const now = new Date();
        const elapsed = (now.getTime() - poll.startTime.getTime()) / 1000;

        return elapsed > poll.duration;
    }

    async getActivePoll(): Promise<IPoll | null> {
        const poll = await Poll.findOne({ status: 'active' }).sort({ createdAt: -1 });

        if (!poll) return null;

        if (this.isExpired(poll)) {
            poll.status = 'completed';
            await poll.save();
            return null;
        }

        return poll;
    }

    async createPoll(data: IPollCreateRequest): Promise<IPoll> {
        // STEP 1 — Enforce Single Active Poll
        const existingActive = await Poll.findOne({ status: 'active' });
        if (existingActive) {
            throw new Error('Another poll is already active');
        }

        const formattedOptions = data.options.map((text) => ({ text, votes: 0 }));
        const poll = new Poll({
            question: data.question,
            options: formattedOptions,
            duration: data.duration,
            status: 'active',
            startTime: null,
        });
        return await poll.save();
    }

    async startPoll(pollId: string): Promise<IPoll> {
        const poll = await Poll.findById(pollId);
        if (!poll) {
            throw new Error('Poll not found');
        }

        // STEP 2 — Prevent Restarting Poll
        if (poll.startTime) {
            throw new Error('Poll already started');
        }

        poll.startTime = new Date();
        poll.status = 'active';
        return await poll.save();
    }

    async vote(pollId: string, studentId: string, optionIndex: number): Promise<IPoll> {
        // Initial fetch
        const poll = await Poll.findById(pollId);
        if (!poll) {
            throw new Error('Poll not found');
        }

        if (poll.status !== 'active') {
            throw new Error('Poll is not active');
        }

        if (!poll.startTime) {
            throw new Error('Poll has not started yet');
        }

        // STEP 5 — Make vote() Expiry-Safe
        if (this.isExpired(poll)) {
            poll.status = 'completed';
            await poll.save();
            throw new Error('Poll expired');
        }

        // Validate optionIndex BEFORE updateOne
        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            throw new Error('Invalid option index');
        }

        // Atomic update logic
        const result = await Poll.updateOne(
            {
                _id: pollId,
                status: 'active',
                'voters.studentId': { $ne: studentId },
            },
            {
                $inc: { [`options.${optionIndex}.votes`]: 1 },
                $push: { voters: { studentId, selectedOptionIndex: optionIndex } },
            }
        );

        if (result.modifiedCount === 0) {
            throw new Error('Already voted or poll inactive');
        }

        const updatedPoll = await Poll.findById(pollId);
        if (!updatedPoll) {
            throw new Error('Poll lost after update');
        }
        return updatedPoll;
    }

    async completePoll(pollId: string): Promise<IPoll> {
        const poll = await Poll.findById(pollId);
        if (!poll) {
            throw new Error('Poll not found');
        }

        if (poll.status === 'completed') {
            return poll;
        }

        poll.status = 'completed';
        return await poll.save();
    }
}

export default new PollService();
