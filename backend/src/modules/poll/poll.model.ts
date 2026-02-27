import mongoose, { Schema } from 'mongoose';
import { IPoll } from './poll.types';

const PollSchema: Schema = new Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true,
        },
        options: [
            {
                text: {
                    type: String,
                    required: true,
                },
                votes: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        duration: {
            type: Number,
            required: true,
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
            index: true,
        },
        voters: [
            {
                studentId: {
                    type: String,
                    required: true,
                },
                selectedOptionIndex: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// We can add a unique constraint via code logic in service, 
// but we'll define it in the schema if we wanted unique studentId per poll document.
// Since voters is an array inside a document, we handle uniqueness in the service update logic.

export default mongoose.model<IPoll>('Poll', PollSchema);
