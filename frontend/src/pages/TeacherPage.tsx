import React, { useState, useEffect } from 'react';
import { usePoll } from '../context/PollContext';
import { useSocket } from '../hooks/useSocket';

const TeacherPage: React.FC = () => {
    const { poll, remainingTime, setPoll, setRemainingTime } = usePoll();
    const { emit } = useSocket();

    // Form State
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [duration, setDuration] = useState(60);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch active poll on mount
    useEffect(() => {
        const fetchActivePoll = async () => {
            try {
                const response = await fetch('http://localhost:5002/api/polls');
                const polls = await response.json();
                const active = polls.find((p: any) => p.status === 'active');
                if (active) {
                    setPoll(active);
                }
            } catch (err) {
                console.error('Failed to fetch polls');
            }
        };

        if (!poll) {
            fetchActivePoll();
        }
    }, [poll, setPoll]);

    // Local timer effect
    useEffect(() => {
        if (remainingTime > 0) {
            const timer = setInterval(() => {
                setRemainingTime((prev) => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [remainingTime, setRemainingTime]);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => setOptions([...options, '']);
    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const filteredOptions = options.filter(opt => opt.trim() !== '');
        if (filteredOptions.length < 2) {
            setError('Please provide at least 2 options');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5002/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, options: filteredOptions, duration })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create poll');

            setPoll(data);
            setQuestion('');
            setOptions(['', '']);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPoll = () => {
        if (poll) {
            emit('teacher:start_poll', poll._id);
        }
    };

    const getTotalVotes = () => {
        if (!poll) return 0;
        return poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    };

    const displayTime = Math.ceil(remainingTime);

    // 1. If poll is active (Live or Completed)
    if (poll && (poll.status === 'active' || poll.status === 'completed') && poll.startTime) {
        const isEnded = poll.status === 'completed' || displayTime <= 0;

        return (
            <div className="container">
                <div className="card">
                    {!isEnded ? (
                        <div className="timer-badge">
                            <span>⏱️</span>
                            <span>{displayTime}s remaining</span>
                        </div>
                    ) : (
                        <div className="voted-badge" style={{ background: '#FEF2F2', color: '#991B1B', marginBottom: '20px' }}>
                            🔒 Poll has ended
                        </div>
                    )}

                    <h1>{isEnded ? 'Final Results' : 'Live Results'}</h1>
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

                    {isEnded && (
                        <button className="btn btn-outline" style={{ marginTop: '24px' }} onClick={() => setPoll(null)}>
                            Create New Poll
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // 2. If poll is created but not started
    if (poll && (poll.status === 'active' && !poll.startTime)) {
        return (
            <div className="container">
                <div className="card">
                    <h1>Poll Ready</h1>
                    <p className="subtitle">Your poll is created and waiting to be started.</p>
                    <div style={{ textAlign: 'left', marginBottom: '24px', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Question:</strong> {poll.question}</p>
                        <p style={{ marginBottom: '8px' }}><strong>Duration:</strong> {poll.duration} seconds</p>
                        <p><strong>Options:</strong> {poll.options.length}</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleStartPoll}>
                        🚀 Start Poll Now
                    </button>
                    <button className="btn btn-outline" style={{ marginTop: '12px' }} onClick={() => setPoll(null)}>
                        Discard and Create New
                    </button>
                </div>
            </div>
        );
    }

    // 3. Show Creation Form
    return (
        <div className="container">
            <div className="card">
                <h1>Create Live Poll</h1>
                <p className="subtitle">Engage your students with a real-time question</p>

                {error && <div className="voted-badge" style={{ background: '#FEF2F2', color: '#991B1B', marginBottom: '20px' }}>{error}</div>}

                <form onSubmit={handleCreatePoll}>
                    <div className="input-group">
                        <label>Poll Question</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter your question here"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Options</label>
                        {options.map((opt, index) => (
                            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={`Option ${index + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    required
                                />
                                {options.length > 2 && (
                                    <button type="button" onClick={() => removeOption(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="btn btn-outline" style={{ padding: '8px', fontSize: '14px', marginTop: '8px' }} onClick={addOption}>
                            + Add Option
                        </button>
                    </div>

                    <div className="input-group">
                        <label>Duration (seconds)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            min="10"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Poll'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TeacherPage;
