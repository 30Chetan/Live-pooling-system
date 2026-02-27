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
    const [isHistoryView, setIsHistoryView] = useState(false);

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
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="badge-pill" style={{ alignSelf: 'flex-start', marginBottom: '32px' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                    Intervue Poll
                </div>
                <h1 style={{ fontSize: '36px', color: '#000000', marginBottom: '8px', letterSpacing: '-0.02em', fontWeight: 500 }}>
                    Let's <span style={{ fontWeight: 700 }}>Get Started</span>
                </h1>
                <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.5', fontWeight: 500, marginBottom: '48px', maxWidth: '600px' }}>
                    you'll have the ability to create and manage polls, ask questions, and monitor<br />your students' responses in real-time.
                </p>

                <form onSubmit={handleCreatePoll} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

                    {/* Header for text area */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <label style={{ fontSize: '18px', fontWeight: 700, color: '#000000' }}>Enter your question</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                style={{ padding: '8px 32px 8px 16px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#373737', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                            >
                                <option value={10}>10 seconds</option>
                                <option value={30}>30 seconds</option>
                                <option value={60}>60 seconds</option>
                                <option value={90}>90 seconds</option>
                            </select>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#5767D0' }}>
                                <path d="M7 10l5 5 5-5z"></path>
                            </svg>
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '40px' }}>
                        <textarea
                            style={{ width: '100%', height: '140px', background: '#F3F4F6', border: 'none', borderRadius: '4px', padding: '24px', fontSize: '16px', color: '#373737', resize: 'none', outline: 'none' }}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Rahul Bajaj"
                            maxLength={100}
                            required
                        />
                        <span style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '12px', color: '#000000', fontWeight: 600 }}>{question.length}/100</span>
                    </div>

                    <div style={{ display: 'flex', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '15px', fontWeight: 700, color: '#000000' }}>Edit Options</label>
                        </div>
                        <div style={{ width: '180px' }}>
                            <label style={{ fontSize: '15px', fontWeight: 700, color: '#000000' }}>Is it Correct?</label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        {options.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6D67E4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                                        {i + 1}
                                    </div>
                                    <input
                                        type="text"
                                        style={{ flex: 1, background: '#F3F4F6', border: 'none', padding: '16px 20px', borderRadius: '4px', fontSize: '15px', color: '#373737', outline: 'none' }}
                                        value={opt}
                                        onChange={(e) => handleOptionChange(i, e.target.value)}
                                        placeholder="Rahul Bajaj"
                                        required
                                    />
                                </div>
                                <div style={{ width: '180px', display: 'flex', alignItems: 'center', gap: '24px', paddingLeft: '24px' }}>
                                    {/* Yes Radio visually */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: i === 0 ? '5px solid #6D67E4' : '1px solid #D1D5DB', background: i === 0 ? 'white' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#000000' }}>Yes</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: i !== 0 ? '5px solid #6D67E4' : '1px solid #D1D5DB', background: i !== 0 ? 'white' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#000000' }}>No</span>
                                    </div>
                                </div>
                                {options.length > 2 ? (
                                    <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: '8px', marginLeft: '8px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                    </button>
                                ) : (
                                    <div style={{ width: '36px', marginLeft: '8px' }}></div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div>
                        <button
                            type="button"
                            style={{ background: 'transparent', border: '1px solid #A5B4FC', color: '#6D67E4', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: '10px 20px', borderRadius: '8px' }}
                            onClick={() => setOptions([...options, ''])}
                        >
                            + Add More option
                        </button>
                    </div>

                    {/* Fixed Footer */}
                    <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'white', borderTop: '1px solid #E2E8F0', padding: '20px 40px', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !isConnected}
                            style={{ padding: '14px 40px', borderRadius: '32px', opacity: (loading || !isConnected) ? 0.6 : 1, cursor: (loading || !isConnected) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '15px' }}
                        >
                            {loading ? 'Creating...' : 'Ask Question'}
                        </button>
                    </div>
                </form>
                <div style={{ height: '80px' }}></div>
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

            {!isHistoryView && (
                <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 100 }}>
                    <button
                        onClick={() => setIsHistoryView(true)}
                        style={{
                            background: '#917FFA',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '32px',
                            fontWeight: 600,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(109, 103, 228, 0.2)'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Poll history
                    </button>
                </div>
            )}

            <div className={`card-wrapper ${isHistoryView ? 'history-mode' : ''}`} style={{ width: '100%', maxWidth: isHistoryView ? '800px' : (!poll ? '800px' : '480px'), marginTop: isHistoryView ? '60px' : '0' }}>
                {isHistoryView ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                        <PollHistorySection polls={allPolls} />
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginTop: '24px' }}>
                            <button
                                onClick={() => setIsHistoryView(false)}
                                style={{
                                    background: '#6D67E4',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '32px',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                + Ask a new question
                            </button>
                        </div>
                    </div>
                ) : (
                    renderContent()
                )}
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
