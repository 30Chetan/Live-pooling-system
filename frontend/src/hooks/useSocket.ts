import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePoll } from '../context/PollContext';
import { IPoll } from '../types/poll';

let socket: Socket;

export const useSocket = () => {
    const { setPoll, setRemainingTime } = usePoll();

    useEffect(() => {
        socket = io('http://localhost:5002');

        socket.on('connect', () => {
            socket.emit('student:join');
        });

        socket.on('poll:state', (data: { poll: IPoll; remainingTime: number }) => {
            setPoll(data.poll);
            setRemainingTime(data.remainingTime);
        });

        socket.on('poll:started', (data: { poll: IPoll; remainingTime: number }) => {
            setPoll(data.poll);
            setRemainingTime(data.remainingTime);
        });

        socket.on('poll:update', (updatedPoll: IPoll) => {
            setPoll(updatedPoll);
        });

        socket.on('poll:ended', (finalPoll: IPoll) => {
            setPoll(finalPoll);
            setRemainingTime(0);
        });

        socket.on('error', (error: { message: string }) => {
            console.error('Socket error:', error.message);
        });

        return () => {
            socket.disconnect();
        };
    }, [setPoll, setRemainingTime]);

    const emit = (event: string, data?: any) => {
        if (socket) {
            socket.emit(event, data);
        }
    };

    return { emit };
};
