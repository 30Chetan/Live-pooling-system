import React, { createContext, useContext, useState, ReactNode } from 'react';
import { IPoll, UserRole } from '../types/poll';

interface PollContextType {
    poll: IPoll | null;
    remainingTime: number;
    role: UserRole;
    setPoll: (poll: IPoll | null) => void;
    setRemainingTime: (time: number | ((prev: number) => number)) => void;
    setRole: (role: UserRole) => void;
}

const PollContext = createContext<PollContextType | undefined>(undefined);

export const PollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [poll, setPoll] = useState<IPoll | null>(null);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [role, setRole] = useState<UserRole>(null);

    return (
        <PollContext.Provider value={{
            poll,
            remainingTime,
            role,
            setPoll,
            setRemainingTime,
            setRole
        }}>
            {children}
        </PollContext.Provider>
    );
};

export const usePoll = () => {
    const context = useContext(PollContext);
    if (context === undefined) {
        throw new Error('usePoll must be used within a PollProvider');
    }
    return context;
};
