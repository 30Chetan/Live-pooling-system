import { Server, Socket } from 'socket.io';
import pollService from './poll.service';
import { IPoll } from './poll.types';

const calculateRemainingTime = (poll: IPoll): number => {
    if (!poll.startTime || poll.status !== 'active') return poll.duration;
    const now = new Date();
    const elapsed = (now.getTime() - poll.startTime.getTime()) / 1000;
    const remaining = poll.duration - elapsed;
    return Math.max(0, remaining);
};

export const initializePollSocket = (io: Server) => {
    const LIVE_ROOM = 'live_poll';
    const participants = new Map<string, { socketId: string; name: string; role: string }>();

    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        // Automatically join the live room
        socket.join(LIVE_ROOM);

        socket.on('user:join', (data: { name: string; role: string }) => {
            participants.set(socket.id, { socketId: socket.id, name: data.name, role: data.role });
            io.to(LIVE_ROOM).emit('participants:update', Array.from(participants.values()));
        });

        socket.on('teacher:kick', (socketIdToKick: string) => {
            io.to(socketIdToKick).emit('kicked');
            participants.delete(socketIdToKick);
            const s = io.sockets.sockets.get(socketIdToKick);
            if (s) {
                s.leave(LIVE_ROOM);
            }
            io.to(LIVE_ROOM).emit('participants:update', Array.from(participants.values()));
        });

        // A) "student:join"
        socket.on('student:join', async () => {
            try {
                const activePoll = await pollService.getActivePoll();
                if (activePoll) {
                    socket.emit('poll:state', {
                        poll: activePoll,
                        remainingTime: calculateRemainingTime(activePoll),
                    });
                }
            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        // B) "teacher:start_poll"
        socket.on('teacher:start_poll', async (pollId: string) => {
            try {
                const startedPoll = await pollService.startPoll(pollId);
                const remainingTime = calculateRemainingTime(startedPoll);

                io.to(LIVE_ROOM).emit('poll:started', {
                    poll: startedPoll,
                    remainingTime,
                });

                // D) Auto-expire logic (setTimeout)
                setTimeout(async () => {
                    try {
                        const completedPoll = await pollService.completePoll(pollId);
                        io.to(LIVE_ROOM).emit('poll:ended', completedPoll);
                    } catch (error) {
                        console.error('Auto-expire error:', error);
                    }
                }, remainingTime * 1000);

            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        // C) "student:vote"
        socket.on('student:vote', async (data: { pollId: string; studentId: string; optionIndex: number }) => {
            const { pollId, studentId, optionIndex } = data;
            try {
                const updatedPoll = await pollService.vote(pollId, studentId, optionIndex);
                io.to(LIVE_ROOM).emit('poll:update', updatedPoll);
            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        // Chat functionality
        socket.on('chat:send', (data: { sender: string; text: string; timestamp: string }) => {
            io.to(LIVE_ROOM).emit('chat:message', data);
        });


        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            if (participants.has(socket.id)) {
                participants.delete(socket.id);
                io.to(LIVE_ROOM).emit('participants:update', Array.from(participants.values()));
            }
        });
    });
};
