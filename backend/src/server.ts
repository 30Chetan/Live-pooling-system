import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import connectDB from './config/db';
import { initializePollSocket } from './modules/poll/poll.socket';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const PORT = process.env.PORT || 5002;

const startServer = async () => {
    try {
        console.log('🚀 Starting server...');

        await connectDB();

        // Mongoose connection error listener (post-connect failures)
        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });

        const server = http.createServer(app);

        const io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        initializePollSocket(io);

        server.listen(PORT, () => {
            console.log(`🌍 Server is running on port ${PORT}`);
        });

        // Graceful error handling for server.listen
        server.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use.`);
            } else {
                console.error('❌ Server error:', err);
            }
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason: unknown) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

startServer();
