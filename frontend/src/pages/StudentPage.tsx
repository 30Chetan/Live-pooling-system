import React, { useState, useEffect } from 'react';
import { usePoll } from '../context/PollContext';
import { useSocket } from '../hooks/useSocket';

const StudentPage: React.FC = () => {
    const { poll, remainingTime, setRemainingTime } = usePoll();
    const { emit } = useSocket();

    const [studentId, setStudentId] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

    // Local timer effect - Polished
    useEffect(() => {
        if (remainingTime > 0) {
            const timer = setInterval(() => {
                setRemainingTime((prev) => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [remainingTime, setRemainingTime]);

    // Check if user already voted in this poll
    useEffect(() => {
        if (poll && studentId) {
            const alreadyVoted = poll.voters.some((voter) => voter.studentId === studentId);
            setHasVoted(alreadyVoted);
        }
    }, [poll, studentId]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (studentId.trim()) {
            setIsJoined(true);
            emit('student:join');
        }
    };

    const handleVote = (optionIndex: number) => {
        if (poll && !hasVoted && remainingTime > 0 && poll.status === 'active') {
            emit('student:vote', {
                pollId: poll._id,
                studentId,
                optionIndex
            });
            setHasVoted(true);
        }
    };

    const getTotalVotes = () => {
        if (!poll) return 0;
        return poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    };

    if (!isJoined) {
        return (
            <div className="container">
                <div className="card">
                    <h1>Student Registration</h1>
                    <p className="subtitle">Enter your Student ID to participate in live polls</p>
                    <form onSubmit={handleJoin}>
                        <div className="input-group">
                            <label htmlFor="studentId">Student ID</label>
                            <input
                                id="studentId"
                                type="text"
                                className="form-control"
                                placeholder="e.g. STU123"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Join Poll</button>
                    </form>
                </div>
            </div>
        );
    }

    const isPollEnded = !poll || poll.status === 'completed' || Math.ceil(remainingTime) <= 0;

    if (isPollEnded) {
        return (
            <div className="container">
                <div className="card">
                    <div className="voted-badge" style={{ background: '#FEF2F2', color: '#991B1B', marginBottom: '20px' }}>
                        🔒 Poll has ended
                    </div>
                    <h1>Final Results</h1>
                    {poll ? (
                        <div className="poll-results">
                            <h2 className="poll-question">{poll.question}</h2>
                            <div style={{ marginBottom: '12px', textAlign: 'right', fontSize: '14px', color: '#64748B' }}>
                                Total Votes: {getTotalVotes()}
                            </div>
                            <div className="poll-options">
                                {poll.options.map((option, index) => {
                                    const total = getTotalVotes();
                                    const percentage = total > 0 ? (option.votes / total) * 100 : 0;
                                    return (
                                        <div key={index} className="option-btn" style={{ cursor: 'default' }}>
                                            <div className="progress-bg" style={{ width: `${percentage}%` }}></div>
                                            <div className="option-content">
                                                <span className="option-text">{option.text}</span>
                                                <span className="option-votes">{option.votes} votes ({percentage.toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="subtitle">There is no active poll at the moment.</p>
                    )}
                    <button className="btn btn-outline" style={{ marginTop: '24px' }} onClick={() => setIsJoined(false)}>
                        Leave Room
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card">
                <div className="timer-badge">
                    <span>⏱️</span>
                    <span>{Math.ceil(remainingTime)}s remaining</span>
                </div>

                <h2 className="poll-question">{poll.question}</h2>

                <div style={{ marginBottom: '12px', textAlign: 'right', fontSize: '14px', color: '#64748B' }}>
                    Total Votes: {getTotalVotes()}
                </div>

                <div className="poll-options">
                    {poll.options.map((option, index) => {
                        const total = getTotalVotes();
                        const percentage = total > 0 ? (option.votes / total) * 100 : 0;

                        return (
                            <button
                                key={index}
                                className="option-btn"
                                disabled={hasVoted}
                                onClick={() => handleVote(index)}
                            >
                                {hasVoted && (
                                    <div className="progress-bg" style={{ width: `${percentage}%` }}></div>
                                )}
                                <div className="option-content">
                                    <span className="option-text">{option.text}</span>
                                    {hasVoted && (
                                        <span className="option-votes">{option.votes} votes</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {hasVoted && (
                    <div className="voted-badge">
                        ✅ Your vote has been recorded!
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPage;
