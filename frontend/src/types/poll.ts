export interface IOption {
    text: string;
    votes: number;
}

export interface IVoter {
    studentId: string;
    optionIndex: number;
}

export interface IPoll {
    _id: string;
    question: string;
    options: IOption[];
    duration: number;
    startTime: string | Date;
    status: 'active' | 'completed';
    voters: IVoter[];
    createdAt: string;
    updatedAt: string;
}

export type UserRole = 'teacher' | 'student' | null;
