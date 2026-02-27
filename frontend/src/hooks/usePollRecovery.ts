import { useEffect, useCallback } from 'react';
import { usePoll } from '../context/PollContext';
import { IPoll } from '../types/poll';

export const usePollRecovery = () => {
    const { setPoll, poll } = usePoll();

    const recoverPoll = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5002/api/polls');
            const data = await response.json();

            // Find active poll
            const active = data.find((p: IPoll) => p.status === 'active');
            if (active) {
                setPoll(active);
                return active;
            }
            return null;
        } catch (err) {
            console.error('Failed to recover poll state:', err);
            return null;
        }
    }, [setPoll]);

    useEffect(() => {
        if (!poll) {
            recoverPoll();
        }
    }, [poll, recoverPoll]);

    return { recoverPoll };
};
