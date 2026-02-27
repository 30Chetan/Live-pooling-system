import { useState, useEffect } from 'react';

export const usePollTimer = (startTime: string | Date | null | undefined, duration: number) => {
    const [remainingTime, setRemainingTime] = useState<number>(0);

    useEffect(() => {
        if (!startTime) {
            setRemainingTime(0);
            return;
        }

        const calculateRemaining = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            const elapsed = (now - start) / 1000;
            const remaining = Math.max(0, duration - elapsed);
            return remaining;
        };

        // Initial calculation
        setRemainingTime(calculateRemaining());

        const timer = setInterval(() => {
            const remaining = calculateRemaining();
            setRemainingTime(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, duration]);

    return remainingTime;
};
