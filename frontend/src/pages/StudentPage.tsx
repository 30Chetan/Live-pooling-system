import React, { useState, useEffect } from 'react';
import { usePoll } from '../context/PollContext';
import { useSocket } from '../hooks/useSocket';
import { usePollTimer } from '../hooks/usePollTimer';
import { usePollRecovery } from '../hooks/usePollRecovery';
import Toast from '../components/Toast';
import ChatBox from '../components/ChatBox';

const StudentPage: React.FC = () => {
    const { poll, setRemainingTime } = usePoll();
    const { emit, isConnected, isKicked } = useSocket();
    const { recoverPoll } = usePollRecovery();
    const timerRemaining = usePollTimer(poll?.startTime, poll?.duration || 0);

    const [studentId, setStudentId] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

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
            emit('user:join', { name: studentId.trim(), role: 'student' });
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

    if (isKicked) {
        return (
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FFFFFF' }}>
                <div style={{ textAlign: 'center', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="badge-pill" style={{ marginBottom: '32px' }}>
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                        Intervue Poll
                    </div>
                    <h1 style={{ fontSize: '36px', color: '#000000', marginBottom: '16px', fontWeight: 500, letterSpacing: '-0.02em' }}>
                        You've been Kicked out !
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '18px', lineHeight: '1.6', fontWeight: 500 }}>
                        Looks like the teacher had removed you from the poll system .Please<br />Try again sometime.
                    </p>
                </div>
            </div>
        );
    }

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
                    <div className="badge-pill">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                        Intervue Poll
                    </div>
                    <h1>Let’s Get Started</h1>
                    <p className="subtitle">
                        If you’re a student, you’ll be able to <span className="strong">submit your answers</span>, participate in live polls, and see how your responses compare with your classmates
                    </p>
                    <form onSubmit={handleJoin} style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                        <div className="input-group" style={{ marginBottom: '24px' }}>
                            <label htmlFor="studentId">Enter your Name</label>
                            <input
                                id="studentId"
                                type="text"
                                className="form-control"
                                placeholder="e.g. Rahul Bajaj"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                required
                                style={{ padding: '14px 18px', fontSize: '16px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!isConnected}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px' }}
                        >
                            {isConnected ? 'Continue' : 'Connecting...'}
                        </button>
                    </form>
                </div>
            ) : isPollEnded ? (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="badge-pill">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                        Intervue Poll
                    </div>

                    {poll ? (
                        <>
                            <h1 style={{ fontSize: '36px', color: '#000000', marginBottom: '12px', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center' }}>
                                Final Results
                            </h1>
                            <p className="subtitle" style={{ textAlign: 'center', marginBottom: '40px' }}>
                                Here is how everyone answered this question.
                            </p>

                            <div className="poll-results" style={{ width: '100%', textAlign: 'left' }}>
                                <h2 className="poll-question" style={{ fontSize: '24px', fontWeight: 600, color: '#373737' }}>{poll.question}</h2>
                                <div style={{ marginBottom: '24px', textAlign: 'right', fontSize: '14px', color: '#64748B' }}>
                                    Total Votes: {getTotalVotes()}
                                </div>
                                <div className="poll-options">
                                    {poll.options.map((option, index) => {
                                        const total = getTotalVotes();
                                        const percentage = total > 0 ? (option.votes / total) * 100 : 0;
                                        return (
                                            <div key={index} className="option-btn" style={{ cursor: 'default', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
                                                <div className="progress-bg" style={{ width: `${percentage}%`, position: 'absolute', top: 0, left: 0, height: '100%', background: '#8C99E0', opacity: 0.2, zIndex: 1 }}></div>
                                                <div className="option-content" style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span className="option-text" style={{ fontWeight: 600, fontSize: '16px', color: '#373737' }}>{option.text}</span>
                                                    <span className="option-votes" style={{ fontWeight: 700, color: '#5767D0', fontSize: '16px' }}>{percentage.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '32px', width: '100%', padding: '14px', borderRadius: '12px' }}
                                onClick={() => setIsJoined(false)}
                            >
                                Leave Room
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '40px 0' }}>
                            <div className="loading-spinner"></div>
                            <h1 style={{ fontSize: '32px', color: '#000000', margin: 0, fontWeight: 700 }}>
                                Wait for the teacher to ask questions..
                            </h1>
                        </div>
                    )}
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

            {isJoined && (
                <>
                    <div className="chat-floating" onClick={() => setIsChatOpen(true)} style={{ display: isChatOpen ? 'none' : 'flex' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <ChatBox
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                        userName={studentId}
                    />
                </>
            )}
        </div>
    );
};

export default StudentPage;
