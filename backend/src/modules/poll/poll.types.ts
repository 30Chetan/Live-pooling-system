import { Document } from 'mongoose';

export interface IOption {
    text: string;
    votes: number;
}

export interface IVoter {
    studentId: string;
    optionIndex: number;
}

export interface IPoll extends Document {
    question: string;
    options: IOption[];
    duration: number; // in seconds
    startTime: Date;
    status: 'active' | 'completed';
    voters: IVoter[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IPollCreateRequest {
    question: string;
    options: string[];
    duration: number;
}
