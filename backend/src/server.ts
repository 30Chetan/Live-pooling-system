console.log("🚀 SERVER FILE LOADED");
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import connectDB from './config/db';
import { initializePollSocket } from './modules/poll/poll.socket';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5002;

const startServer = async () => {
    try {
        console.log("🚀 Starting server...");
        console.log("ENV MONGO_URI:", process.env.MONGO_URI);

        await connectDB();

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

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
