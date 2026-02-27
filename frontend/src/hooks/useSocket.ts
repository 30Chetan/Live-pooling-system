import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePoll } from '../context/PollContext';
import { IPoll } from '../types/poll';

let socket: Socket | null = null;

export const useSocket = () => {
    const { setPoll, setRemainingTime } = usePoll();
    const [isConnected, setIsConnected] = useState(false);
    const [participants, setParticipants] = useState<{ socketId: string, name: string, role: string }[]>([]);
    const [isKicked, setIsKicked] = useState(false);

    useEffect(() => {
        if (!socket) {
            socket = io('http://localhost:5002');
        }

        const onConnect = () => {
            setIsConnected(true);
            socket?.emit('student:join'); // For backward compatibility before user:join
        };
        const onDisconnect = () => setIsConnected(false);
        const onPollState = (data: { poll: IPoll; remainingTime: number }) => {
            setPoll(data.poll);
            setRemainingTime(data.remainingTime);
        };
        const onPollStarted = (data: { poll: IPoll; remainingTime: number }) => {
            setPoll(data.poll);
            setRemainingTime(data.remainingTime);
        };
        const onPollUpdate = (updatedPoll: IPoll) => setPoll(updatedPoll);
        const onPollEnded = (finalPoll: IPoll) => {
            setPoll(finalPoll);
            setRemainingTime(0);
        };
        const onError = (error: { message: string }) => console.error('Socket error:', error.message);
        const onParticipantsUpdate = (list: any[]) => setParticipants(list);
        const onKicked = () => setIsKicked(true);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('poll:state', onPollState);
        socket.on('poll:started', onPollStarted);
        socket.on('poll:update', onPollUpdate);
        socket.on('poll:ended', onPollEnded);
        socket.on('error', onError);
        socket.on('participants:update', onParticipantsUpdate);
        socket.on('kicked', onKicked);

        // Set initial state if socket is already connected
        if (socket.connected) {
            setIsConnected(true);
        }

        return () => {
            if (socket) {
                socket.off('connect', onConnect);
                socket.off('disconnect', onDisconnect);
                socket.off('poll:state', onPollState);
                socket.off('poll:started', onPollStarted);
                socket.off('poll:update', onPollUpdate);
                socket.off('poll:ended', onPollEnded);
                socket.off('error', onError);
                socket.off('participants:update', onParticipantsUpdate);
                socket.off('kicked', onKicked);
            }
        };
    }, [setPoll, setRemainingTime]);

    const emit = (event: string, data?: any) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        }
    };

    return { socket, emit, isConnected, participants, isKicked };
};
