import React, { useState, useEffect } from 'react';
import { usePoll } from '../context/PollContext';
import { useSocket } from '../hooks/useSocket';
import { usePollTimer } from '../hooks/usePollTimer';
import { usePollRecovery } from '../hooks/usePollRecovery';
import { IPoll } from '../types/poll';
import PollHistorySection from '../components/PollHistorySection';
import Toast from '../components/Toast';

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
    const [error, setError] = useState<string | null>(null);
    const [allPolls, setAllPolls] = useState<IPoll[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

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
        setError(null);
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
            setError(err.message);
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
                <div className="card">
                    {!isEnded ? (
                        <div className="timer-badge">⏱️ {displayTime}s remaining</div>
                    ) : (
                        <div className="voted-badge" style={{ background: '#FEF2F2', color: '#991B1B', marginBottom: '20px' }}>🔒 Poll has ended</div>
                    )}
                    <h1>{isEnded ? 'Final Results' : 'Live Results'}</h1>
                    <h2 className="poll-question">{poll.question}</h2>
                    <div style={{ marginBottom: '12px', textAlign: 'right', fontSize: '14px', color: '#64748B' }}>Total Votes: {getTotalVotes(poll)}</div>
                    <div className="poll-options">
                        {poll?.options?.map((opt, i) => {
                            const total = getTotalVotes(poll);
                            const pct = total > 0 ? (opt.votes / total) * 100 : 0;
                            return (
                                <div key={i} className="option-btn" style={{ cursor: 'default' }}>
                                    <div className="progress-bg" style={{ width: `${pct}%` }}></div>
                                    <div className="option-content">
                                        <span className="option-text">{opt.text}</span>
                                        <span className="option-votes">{opt.votes} votes ({pct.toFixed(1)}%)</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {isEnded && <button className="btn btn-outline" style={{ marginTop: '24px' }} onClick={() => setPoll(null)}>Create New Poll</button>}
                </div>
            );
        }

        if (poll && poll.status === 'active' && !poll.startTime) {
            return (
                <div className="card">
                    <h1>Poll Ready</h1>
                    <p className="subtitle">Your poll is created and waiting to be started.</p>
                    <div style={{ textAlign: 'left', marginBottom: '24px', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Question:</strong> {poll.question}</p>
                        <p><strong>Duration:</strong> {poll.duration}s</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleStartPoll} disabled={!isConnected}>
                        {isConnected ? '🚀 Start Poll Now' : 'Connecting...'}
                    </button>
                    <button className="btn btn-outline" style={{ marginTop: '12px' }} onClick={() => setPoll(null)}>Discard</button>
                </div>
            );
        }

        return (
            <div className="card">
                <h1>Teacher Dashboard</h1>
                <p className="subtitle">Create a poll to start engaging your audience</p>
                <form onSubmit={handleCreatePoll}>
                    <div className="input-group">
                        <label>Poll Question</label>
                        <input type="text" className="form-control" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What is your favorite language?" required />
                    </div>
                    <div className="input-group">
                        <label>Options</label>
                        {options.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input type="text" className="form-control" value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} placeholder={`Option ${i + 1}`} required />
                                {options.length > 2 && (
                                    <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="btn btn-outline" style={{ padding: '8px', fontSize: '14px', marginTop: '8px' }} onClick={() => setOptions([...options, ''])}>+ Add Option</button>
                    </div>
                    <div className="input-group">
                        <label>Duration (s)</label>
                        <input type="number" className="form-control" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} min="10" required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading || !isConnected}>
                        {loading ? 'Creating...' : isConnected ? 'Create Poll' : 'Connecting...'}
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
        </div>
    );
};

export default TeacherPage;
