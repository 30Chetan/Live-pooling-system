import React from 'react';
import { IPoll } from '../types/poll';

interface PollHistorySectionProps {
    polls: IPoll[];
}

const PollHistorySection: React.FC<PollHistorySectionProps> = ({ polls }) => {
    const completedPolls = polls.filter(p => p.status === 'completed');

    if (completedPolls.length === 0) {
        return (
            <div style={{ marginTop: '24px', width: '100%' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#000000', marginBottom: '16px' }}>Question</h2>
                <div style={{ color: '#64748B' }}>No poll history available.</div>
            </div>
        );
    }

    const calculateTotal = (poll: IPoll) => {
        return poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    };

    return (
        <div style={{ marginTop: '24px', width: '100%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#000000', marginBottom: '16px' }}>Question</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {completedPolls.map((poll) => {
                    const totalVotes = calculateTotal(poll);

                    return (
                        <div key={poll._id} style={{ display: 'flex', flexDirection: 'column' }}>
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

                                        return (
                                            <div key={idx} style={{
                                                position: 'relative',
                                                border: '1px solid #E5E7EB',
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
                                                        color: '#000000'
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
                    );
                })}
            </div>
        </div>
    );
};

export default PollHistorySection;
