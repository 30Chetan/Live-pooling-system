import React, { useState, useEffect } from 'react';
import { usePoll } from '../context/PollContext';
import { useSocket } from '../hooks/useSocket';
import { usePollTimer } from '../hooks/usePollTimer';
import { usePollRecovery } from '../hooks/usePollRecovery';
import { IPoll } from '../types/poll';
import PollHistorySection from '../components/PollHistorySection';
import Toast from '../components/Toast';
import ChatBox from '../components/ChatBox';

const TeacherPage: React.FC = () => {
    const { poll, setPoll, setRemainingTime } = usePoll();
    const { emit, isConnected } = useSocket();
    const { recoverPoll } = usePollRecovery();
    const timerRemaining = usePollTimer(poll?.startTime, poll?.duration || 0);

    // Form State
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [duration, setDuration] = useState(60);
    const [loading, setLoading] = useState(false);
    const [allPolls, setAllPolls] = useState<IPoll[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Register as Teacher on connect
    useEffect(() => {
        if (isConnected) {
            emit('user:join', { name: 'Teacher', role: 'teacher' });
        }
    }, [isConnected, emit]);

    // Sync timer
    useEffect(() => {
        setRemainingTime(timerRemaining);
    }, [timerRemaining, setRemainingTime]);

    // Initial load
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch('http://localhost:5002/api/polls');
                if (!response.ok) throw new Error('Could not load history');
                const list = await response.json();
                setAllPolls(list);
            } catch (err) {
                console.error(err);
            }
        };

        const fetchAndRecover = async () => {
            await recoverPoll();
            await fetchHistory();
        };
        fetchAndRecover();
    }, [recoverPoll]);

    const handleOptionChange = (idx: number, val: string) => {
        const next = [...options];
        next[idx] = val;
        setOptions(next);
    };

    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConnected) {
            setToast({ message: 'Waiting for server connection...', type: 'error' });
            return;
        }

        setLoading(true);
        const filtered = options.filter(o => o.trim() !== '');

        if (filtered.length < 2) {
            setToast({ message: 'Please add at least 2 options', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5002/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, options: filtered, duration })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Poll creation failed');

            setPoll(data);
            setQuestion('');
            setOptions(['', '']);
            setToast({ message: 'Poll created successfully!', type: 'success' });

            // Refresh history
            const res2 = await fetch('http://localhost:5002/api/polls');
            if (res2.ok) setAllPolls(await res2.json());
        } catch (err: any) {
            setToast({ message: err.message || 'Connection error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStartPoll = () => {
        if (!isConnected) {
            setToast({ message: 'No connection to server', type: 'error' });
            return;
        }
        if (poll) {
            emit('teacher:start_poll', poll._id);
            setToast({ message: 'Poll started! Students can now vote.', type: 'success' });
        }
    };

    const getTotalVotes = (p: IPoll | null) => p?.options?.reduce((s, o) => s + o.votes, 0) || 0;
    const displayTime = Math.ceil(timerRemaining);

    const renderContent = () => {
        if (poll && (poll.status === 'active' || poll.status === 'completed') && poll.startTime) {
            const isEnded = poll.status === 'completed' || displayTime <= 0;
            return (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="badge-pill">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                        Intervue Poll
                    </div>

                    {!isEnded && (
                        <div style={{ background: '#FEF2F2', padding: '10px 20px', borderRadius: '32px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D93025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span style={{ color: '#D93025', fontWeight: 700, fontSize: '24px', fontVariantNumeric: 'tabular-nums' }}>
                                {String(Math.floor(displayTime / 60)).padStart(2, '0')}:{String(displayTime % 60).padStart(2, '0')}
                            </span>
                        </div>
                    )}

                    <h1 style={{ fontSize: '36px', color: '#000000', marginBottom: '12px', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center' }}>
                        {isEnded ? 'Final Results' : 'Live Results'}
                    </h1>
                    <p className="subtitle" style={{ textAlign: 'center', marginBottom: '40px' }}>
                        {isEnded ? 'Here is how everyone answered this question.' : 'Watch the results update in real-time as students vote.'}
                    </p>

                    <div className="poll-results" style={{ width: '100%', textAlign: 'left' }}>
                        <h2 className="poll-question" style={{ fontSize: '24px', fontWeight: 600, color: '#373737' }}>{poll.question}</h2>
                        <div style={{ marginBottom: '24px', textAlign: 'right', fontSize: '14px', color: '#64748B' }}>
                            Total Votes: {getTotalVotes(poll)}
                        </div>
                        <div className="poll-options">
                            {poll?.options?.map((opt, i) => {
                                const total = getTotalVotes(poll);
                                const pct = total > 0 ? (opt.votes / total) * 100 : 0;
                                return (
                                    <div key={i} className="option-btn" style={{ cursor: 'default', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
                                        <div className="progress-bg" style={{ width: `${pct}%`, position: 'absolute', top: 0, left: 0, height: '100%', background: '#8C99E0', opacity: 0.2, zIndex: 1, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                                        <div className="option-content" style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="option-text" style={{ fontWeight: 600, fontSize: '16px', color: '#373737' }}>{opt.text}</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                <span className="option-votes" style={{ fontWeight: 700, color: '#5767D0', fontSize: '16px' }}>{pct.toFixed(0)}%</span>
                                                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{opt.votes} votes</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {isEnded && (
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '32px', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 600 }}
                            onClick={() => setPoll(null)}
                        >
                            Create New Poll
                        </button>
                    )}
                </div>
            );
        }

        if (poll && poll.status === 'active' && !poll.startTime) {
            return (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="badge-pill">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                        Intervue Poll
                    </div>
                    <h1 style={{ fontSize: '36px', color: '#000000', marginBottom: '12px', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center' }}>
                        Poll Ready
                    </h1>
                    <p className="subtitle" style={{ textAlign: 'center', marginBottom: '40px' }}>
                        Your poll is created and waiting to be started.
                    </p>
                    <div style={{ textAlign: 'left', marginBottom: '32px', padding: '24px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', width: '100%' }}>
                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px', fontWeight: 600 }}>Question</p>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#373737', marginBottom: '16px' }}>{poll.question}</p>
                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px', fontWeight: 600 }}>Duration</p>
                        <p style={{ fontSize: '16px', fontWeight: 500, color: '#373737' }}>{poll.duration} seconds</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleStartPoll}
                        disabled={!isConnected}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 600 }}
                    >
                        {isConnected ? '🚀 Start Poll Now' : 'Connecting...'}
                    </button>
                    <button
                        className="btn btn-outline"
                        style={{ marginTop: '16px', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 600 }}
                        onClick={() => setPoll(null)}
                    >
                        Discard
                    </button>
                </div>
            );
        }

        return (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="badge-pill">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                    Intervue Poll
                </div>
                <h1 style={{ fontSize: '36px', color: '#000000', marginBottom: '12px', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center' }}>
                    Create a Poll
                </h1>
                <p className="subtitle" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    Enter your question and options to start.
                </p>
                <form onSubmit={handleCreatePoll} style={{ width: '100%', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <label htmlFor="pollQuestion">Poll Question</label>
                        <input
                            id="pollQuestion"
                            type="text"
                            className="form-control"
                            style={{ padding: '14px 18px', fontSize: '16px' }}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. Which planet is known as the Red Planet?"
                            required
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <label>Options</label>
                        {options.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ padding: '14px 18px', fontSize: '16px', flex: 1 }}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                    required
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: '8px' }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            style={{ background: 'transparent', border: 'none', color: '#5767D0', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 0', marginTop: '4px' }}
                            onClick={() => setOptions([...options, ''])}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add Option
                        </button>
                    </div>
                    <div className="input-group" style={{ marginBottom: '40px' }}>
                        <label htmlFor="pollDuration">Duration (s)</label>
                        <input
                            id="pollDuration"
                            type="number"
                            className="form-control"
                            style={{ padding: '14px 18px', fontSize: '16px' }}
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            min="10"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !isConnected}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', opacity: (loading || !isConnected) ? 0.6 : 1, cursor: (loading || !isConnected) ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                    >
                        {loading ? 'Creating...' : isConnected ? 'Ask Question' : 'Connecting...'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="container" style={{ flexDirection: 'column', padding: '40px 20px', alignItems: 'center' }}>
            {!isConnected && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%',
                    backgroundColor: '#FFFBEB', color: '#92400E', padding: '8px',
                    textAlign: 'center', fontSize: '14px', fontWeight: 600, zIndex: 1001
                }}>
                    ⚠️ Connection lost. Attempting to reconnect...
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="card-wrapper" style={{ width: '100%', maxWidth: '480px' }}>
                {renderContent()}
                <PollHistorySection polls={allPolls} />
            </div>

            <div className="chat-floating" onClick={() => setIsChatOpen(true)} style={{ display: isChatOpen ? 'none' : 'flex' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </div>
            <ChatBox
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                userName="Teacher"
                isTeacher={true}
            />
        </div>
    );
};

export default TeacherPage;
