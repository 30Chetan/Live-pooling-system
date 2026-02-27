import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoll } from '../context/PollContext';

const RoleSelectPage: React.FC = () => {
    const navigate = useNavigate();
    const { setRole } = usePoll();
    const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');

    const handleContinue = () => {
        setRole(selectedRole);
        navigate(`/${selectedRole}`);
    };

    return (
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FFFFFF' }}>
            <div style={{ textAlign: 'center', maxWidth: '700px', width: '100%', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="badge-pill" style={{ marginBottom: '24px' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
                    Intervue Poll
                </div>

                <h1 style={{ fontSize: '36px', color: '#000000', marginBottom: '12px', letterSpacing: '-0.02em', fontWeight: 500 }}>
                    Welcome to the <span style={{ fontWeight: 700 }}>Live Polling System</span>
                </h1>
                <p style={{ color: '#94A3B8', fontSize: '16px', lineHeight: '1.5', fontWeight: 500, marginBottom: '48px', maxWidth: '580px', marginInline: 'auto' }}>
                    Please select the role that best describes you to begin using the live polling<br />system
                </p>

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px', width: '100%', maxWidth: '640px' }}>
                    {/* Student Card */}
                    <div
                        onClick={() => setSelectedRole('student')}
                        style={{
                            flex: 1,
                            padding: '32px 24px',
                            textAlign: 'left',
                            background: '#FFFFFF',
                            border: selectedRole === 'student' ? '2px solid #5767D0' : '1px solid #E2E8F0',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedRole === 'student' ? '0 4px 14px rgba(87, 103, 208, 0.08)' : 'none'
                        }}
                    >
                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>I'm a Student</h3>
                        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', fontWeight: 500 }}>
                            Join active polling sessions, submit your votes, and participate alongside your classmates.
                        </p>
                    </div>

                    {/* Teacher Card */}
                    <div
                        onClick={() => setSelectedRole('teacher')}
                        style={{
                            flex: 1,
                            padding: '32px 24px',
                            textAlign: 'left',
                            background: '#FFFFFF',
                            border: selectedRole === 'teacher' ? '2px solid #5767D0' : '1px solid #E2E8F0',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedRole === 'teacher' ? '0 4px 14px rgba(87, 103, 208, 0.08)' : 'none'
                        }}
                    >
                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>I'm a Teacher</h3>
                        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', fontWeight: 500 }}>
                            Create new polls, manage active sessions, and monitor class voting analytics in real-time.
                        </p>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleContinue}
                    style={{ padding: '14px 48px', borderRadius: '32px', fontSize: '16px', fontWeight: 600, minWidth: '180px' }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default RoleSelectPage;
