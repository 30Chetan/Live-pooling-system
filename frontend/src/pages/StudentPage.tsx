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

    const renderJoinedContent = () => {
        if (!poll) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '40px 0' }}>
                    <div className="loading-spinner"></div>
                    <h1 style={{ fontSize: '32px', color: '#000000', margin: 0, fontWeight: 700 }}>
                        Wait for the teacher to ask a new question..
                    </h1>
                </div>
            );
        }

        const isEnded = poll.status === 'completed' || Math.ceil(timerRemaining) <= 0;
        const displayTime = Math.ceil(timerRemaining);
        const totalVotes = getTotalVotes();
        const myVote = poll.voters?.find(v => v.studentId === studentId)?.optionIndex;

        if (!hasVoted && !isEnded && poll.status === 'active') {
            return (
                <div className="card">
                    <div className="timer-badge">
                        <span>⏱️</span>
                        <span>{displayTime}s remaining</span>
                    </div>
                    <h2 className="poll-question">{poll.question}</h2>
                    <div style={{ marginBottom: '12px', textAlign: 'right', fontSize: '14px', color: '#64748B' }}>Total Votes: {totalVotes}</div>
                    <div className="poll-options">
                        {poll?.options?.map((option, index) => (
                            <button
                                key={index}
                                className="option-btn"
                                disabled={!isConnected}
                                onClick={() => handleVote(index)}
                            >
                                <div className="option-content">
                                    <span className="option-text">{option.text}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div style={{ width: '100%', maxWidth: '640px', margin: '40px auto 0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#000000' }}>Question 1</h2>
                    {!isEnded && (
                        <div style={{ color: '#D93025', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            {String(Math.floor(displayTime / 60)).padStart(2, '0')}:{String(displayTime % 60).padStart(2, '0')}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Dark Header */}
                    <div style={{
                        background: '#5E5E5E',
                        padding: '16px 20px',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '16px'
                    }}>
                        {poll.question}
                    </div>

                    {/* Body */}
                    <div style={{
                        background: '#FFFFFF',
                        borderLeft: '1px solid #D1D5DB',
                        borderRight: '1px solid #D1D5DB',
                        borderBottom: '1px solid #D1D5DB',
                        borderBottomLeftRadius: '8px',
                        borderBottomRightRadius: '8px',
                        padding: '16px 20px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {poll.options.map((option, idx) => {
                                const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                                const isHighPercentage = percentage >= 15;
                                const isSelected = myVote === idx;

                                return (
                                    <div key={idx} style={{
                                        position: 'relative',
                                        border: isSelected ? '2px solid #0084FF' : '1px solid #E5E7EB',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        background: '#F9FAFB',
                                        height: '48px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        {/* Purple Progress Fill */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            height: '100%',
                                            width: `${Math.max(percentage, 5)}%`,
                                            background: '#6D67E4',
                                            zIndex: 1,
                                            transition: 'width 0.5s ease'
                                        }}></div>

                                        {/* Content Overlay */}
                                        <div style={{
                                            position: 'relative',
                                            zIndex: 2,
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0 16px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {/* Number Badge */}
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: '#FFFFFF',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    color: '#6D67E4'
                                                }}>
                                                    {idx + 1}
                                                </div>
                                                {/* Option Text */}
                                                <span style={{
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                    color: isHighPercentage ? '#FFFFFF' : '#373737'
                                                }}>
                                                    {option.text}
                                                </span>
                                            </div>

                                            {/* Percentage Text */}
                                            <span style={{
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#000000',
                                                border: isSelected ? '1px dashed #0084FF' : 'none',
                                                padding: isSelected ? '2px 4px' : '0'
                                            }}>
                                                {Math.round(percentage)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#000000' }}>
                        Wait for the teacher to ask a new question..
                    </p>
                </div>
            </div>
        );
    };

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
            ) : (
                renderJoinedContent()
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
