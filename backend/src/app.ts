import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pollRoutes from './routes/poll.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/polls', pollRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Resource not found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        status: 'error',
        message,
    });
});

export default app;
