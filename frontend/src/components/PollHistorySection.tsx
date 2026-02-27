import React, { useState } from 'react';
import { IPoll } from '../types/poll';

interface PollHistorySectionProps {
    polls: IPoll[];
}

const PollHistorySection: React.FC<PollHistorySectionProps> = ({ polls }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const completedPolls = polls.filter(p => p.status === 'completed');

    if (completedPolls.length === 0) {
        return (
            <div style={{ marginTop: '40px', textAlign: 'left' }}>
                <h3 style={{ marginBottom: '16px', color: '#1E293B' }}>Poll History</h3>
                <p style={{ color: '#64748B', fontSize: '14px' }}>No past polls recorded yet.</p>
            </div>
        );
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const calculateTotal = (poll: IPoll) => {
        return poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    };

    return (
        <div style={{ marginTop: '40px', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '16px', color: '#1E293B' }}>Poll History</h3>
            <div style={{ display: 'flex', flexdirection: 'column', gap: '12px' }}>
                {completedPolls.map((poll) => {
                    const isExpanded = expandedId === poll._id;
                    const totalVotes = calculateTotal(poll);

                    return (
                        <div
                            key={poll._id}
                            className="card"
                            style={{
                                padding: '20px',
                                marginBottom: '12px',
                                textAlign: 'left',
                                maxWidth: '100%',
                                cursor: 'pointer',
                                border: isExpanded ? '1px solid #2563EB' : '1px solid #E2E8F0',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => toggleExpand(poll._id)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '16px', color: '#1E293B', marginBottom: '4px' }}>{poll.question}</p>
                                    <p style={{ color: '#64748B', fontSize: '13px' }}>
                                        Total Votes: {totalVotes} • {new Date(poll.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                    ▼
                                </span>
                            </div>

                            {isExpanded && (
                                <div style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease-out' }}>
                                    <div className="poll-options">
                                        {poll.options.map((option, idx) => {
                                            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                                            return (
                                                <div key={idx} className="option-btn" style={{ cursor: 'default', padding: '12px' }}>
                                                    <div className="progress-bg" style={{ width: `${percentage}%` }}></div>
                                                    <div className="option-content">
                                                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{option.text}</span>
                                                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                                                            {option.votes} votes ({percentage.toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PollHistorySection;
