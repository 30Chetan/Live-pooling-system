import React, { useState } from 'react';
import { IPoll } from '../types/poll';

interface PollHistorySectionProps {
    polls: IPoll[];
}

const PollHistorySection: React.FC<PollHistorySectionProps> = ({ polls }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const completedPolls = polls.filter(p => p.status === 'completed');

    if (completedPolls.length === 0) {
        return null;
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const calculateTotal = (poll: IPoll) => {
        return poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    };

    return (
        <div style={{ marginTop: '48px', width: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#000000', marginBottom: '24px', textAlign: 'center' }}>Poll History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {completedPolls.map((poll) => {
                    const isExpanded = expandedId === poll._id;
                    const totalVotes = calculateTotal(poll);

                    return (
                        <div
                            key={poll._id}
                            style={{
                                background: '#FFFFFF',
                                border: isExpanded ? '1px solid #5767D0' : '1px solid #E2E8F0',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                transition: 'all 0.2s ease',
                                boxShadow: isExpanded ? '0 4px 12px rgba(87, 103, 208, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div
                                style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? '#F8FAFC' : '#FFFFFF' }}
                                onClick={() => toggleExpand(poll._id)}
                            >
                                <div style={{ flex: 1, paddingRight: '16px' }}>
                                    <p style={{ fontWeight: 600, fontSize: '18px', color: '#373737', marginBottom: '8px', lineHeight: 1.4 }}>{poll.question}</p>
                                    <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>
                                        {new Date(poll.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {totalVotes} total votes
                                    </p>
                                </div>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: isExpanded ? '#E0E7FF' : '#F1F5F9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isExpanded ? '#5767D0' : '#64748B',
                                    transition: 'all 0.2s'
                                }}>
                                    <svg
                                        width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </div>

                            {isExpanded && (
                                <div style={{ padding: '0 24px 24px 24px', animation: 'fadeIn 0.3s ease-out' }}>
                                    <div style={{ height: '1px', background: '#E2E8F0', marginBottom: '24px' }}></div>
                                    <div className="poll-options">
                                        {poll.options.map((option, idx) => {
                                            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                                            return (
                                                <div key={idx} className="option-btn" style={{ cursor: 'default', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
                                                    <div className="progress-bg" style={{ width: `${percentage}%`, position: 'absolute', top: 0, left: 0, height: '100%', background: '#8C99E0', opacity: 0.2, zIndex: 1, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                                                    <div className="option-content" style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span className="option-text" style={{ fontWeight: 600, fontSize: '16px', color: '#373737' }}>{option.text}</span>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                            <span className="option-votes" style={{ fontWeight: 700, color: '#5767D0', fontSize: '16px' }}>{percentage.toFixed(0)}%</span>
                                                            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{option.votes} votes</span>
                                                        </div>
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
