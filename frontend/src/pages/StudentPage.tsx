import React, { useState, useEffect } from 'react';
import { usePoll } from '../context/PollContext';
import { useSocket } from '../hooks/useSocket';
import { usePollTimer } from '../hooks/usePollTimer';
import { usePollRecovery } from '../hooks/usePollRecovery';
import Toast from '../components/Toast';

const StudentPage: React.FC = () => {
    const { poll, setRemainingTime } = usePoll();
    const { emit, isConnected } = useSocket();
    const { recoverPoll } = usePollRecovery();
    const timerRemaining = usePollTimer(poll?.startTime, poll?.duration || 0);

    const [studentId, setStudentId] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

    // Sync remaining time to context
    useEffect(() => {
        setRemainingTime(timerRemaining);
    }, [timerRemaining, setRemainingTime]);

    // Handle active poll recovery
    useEffect(() => {
        recoverPoll();
    }, [recoverPoll]);

    // Check if user already voted
    useEffect(() => {
        if (poll && studentId) {
            const alreadyVoted = poll.voters?.some((voter) => voter.studentId === studentId);
            setHasVoted(!!alreadyVoted);
        }
    }, [poll, studentId]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConnected) {
            setToast({ message: 'Waiting for server connection...', type: 'error' });
            return;
        }
        if (studentId.trim()) {
            setIsJoined(true);
            emit('student:join');
            setToast({ message: 'Welcome! Waiting for polls...', type: 'info' });
        }
    };

    const handleVote = (optionIndex: number) => {
        if (!isConnected) {
            setToast({ message: 'Lost connection to server. Please wait...', type: 'error' });
            return;
        }
        if (poll && !hasVoted && timerRemaining > 0 && poll.status === 'active') {
            try {
                emit('student:vote', { pollId: poll._id, studentId, optionIndex });
                setHasVoted(true);
                setToast({ message: 'Vote submitted successfully!', type: 'success' });
            } catch (err) {
                setToast({ message: 'Failed to submit vote. Try again.', type: 'error' });
            }
        }
    };

    const getTotalVotes = () => poll?.options?.reduce((sum, opt) => sum + opt.votes, 0) || 0;
    const isPollEnded = !poll || poll.status === 'completed' || Math.ceil(timerRemaining) <= 0;

    return (
        <div className="container">
            {!isConnected && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%',
                    backgroundColor: '#FFFBEB', color: '#92400E', padding: '8px',
                    textAlign: 'center', fontSize: '14px', fontWeight: 600, zIndex: 1001
                }}>
                    ⚠️ Reconnecting to server...
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {!isJoined ? (
                <div className="card">
                    <h1>Student Participant</h1>
                    <p className="subtitle">Enter your Student ID to join the live session</p>
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
                        <button type="submit" className="btn btn-primary" disabled={!isConnected}>
                            {isConnected ? 'Join Room' : 'Connecting...'}
                        </button>
                    </form>
                </div>
            ) : isPollEnded ? (
                <div className="card">
                    <div className="voted-badge" style={{ background: '#FEF2F2', color: '#991B1B', marginBottom: '20px' }}>🔒 Poll has ended</div>
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
                    ) : <p className="subtitle">No active poll right now.</p>}
                    <button className="btn btn-outline" style={{ marginTop: '24px' }} onClick={() => setIsJoined(false)}>Leave Room</button>
                </div>
            ) : (
                <div className="card">
                    <div className="timer-badge">
                        <span>⏱️</span>
                        <span>{Math.ceil(timerRemaining)}s remaining</span>
                    </div>
                    <h2 className="poll-question">{poll.question}</h2>
                    <div style={{ marginBottom: '12px', textAlign: 'right', fontSize: '14px', color: '#64748B' }}>Total Votes: {getTotalVotes()}</div>
                    <div className="poll-options">
                        {poll?.options?.map((option, index) => {
                            const total = getTotalVotes();
                            const percentage = total > 0 ? (option.votes / total) * 100 : 0;
                            return (
                                <button
                                    key={index}
                                    className="option-btn"
                                    disabled={hasVoted || !isConnected}
                                    onClick={() => handleVote(index)}
                                >
                                    {hasVoted && <div className="progress-bg" style={{ width: `${percentage}%` }}></div>}
                                    <div className="option-content">
                                        <span className="option-text">{option.text}</span>
                                        {hasVoted && <span className="option-votes">{option.votes} votes</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {hasVoted && <div className="voted-badge">✅ Your vote has been recorded!</div>}
                </div>
            )}
        </div>
    );
};

export default StudentPage;
