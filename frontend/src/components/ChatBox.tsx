import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';

interface ChatMessage {
    sender: string;
    text: string;
    timestamp: string;
}

interface ChatBoxProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    isTeacher?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ isOpen, onClose, userName, isTeacher = false }) => {
    const { socket, emit, participants } = useSocket();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (message: ChatMessage) => {
            setMessages(prev => [...prev, message]);
        };

        socket.on('chat:message', handleMessage);

        return () => {
            socket.off('chat:message', handleMessage);
        };
    }, [socket]);

    useEffect(() => {
        if (activeTab === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, activeTab]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text) return;

        emit('chat:send', {
            sender: userName || 'Anonymous',
            text,
            timestamp: new Date().toISOString()
        });

        setInputText('');
    };

    const handleKick = (socketId: string) => {
        emit('teacher:kick', socketId);
    };

    return (
        <div className={`chat-container ${isOpen ? 'open' : ''}`} style={{ width: '400px' }}>
            <div className="chat-header" style={{ display: 'flex', flexDirection: 'column', padding: '0', background: 'white', color: 'black', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
                    <button onClick={onClose} className="chat-close-btn" style={{ color: '#64748B' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div style={{ display: 'flex', width: '100%' }}>
                    <div
                        onClick={() => setActiveTab('chat')}
                        style={{ flex: 1, padding: '12px 0', textAlign: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '14px', borderBottom: activeTab === 'chat' ? '2px solid #6D67E4' : '2px solid transparent', color: activeTab === 'chat' ? '#373737' : '#94A3B8' }}
                    >
                        Chat
                    </div>
                    <div
                        onClick={() => setActiveTab('participants')}
                        style={{ flex: 1, padding: '12px 0', textAlign: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '14px', borderBottom: activeTab === 'participants' ? '2px solid #6D67E4' : '2px solid transparent', color: activeTab === 'participants' ? '#373737' : '#94A3B8' }}
                    >
                        Participants
                    </div>
                </div>
            </div>

            {activeTab === 'chat' ? (
                <>
                    <div className="chat-messages" style={{ background: 'white' }}>
                        {messages.length === 0 ? (
                            <div className="chat-empty">No messages yet. Say hi!</div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = msg.sender === userName;
                                return (
                                    <div key={idx} className={`chat-bubble-wrapper ${isMe ? 'me' : 'them'}`}>
                                        {!isMe && <div className="chat-sender">{msg.sender}</div>}
                                        <div className="chat-bubble">{msg.text}</div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-wrapper" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="chat-input"
                        />
                        <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </form>
                </>
            ) : (
                <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>
                        <span>Name</span>
                        <span>Action</span>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                        {participants.filter(p => p.role === 'student').length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No students connected</div>
                        ) : (
                            participants.map((p, idx) => {
                                if (p.role === 'teacher') return null;
                                return (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#373737' }}>{p.name} {p.name === userName && '(You)'}</span>
                                        {isTeacher && (
                                            <span
                                                onClick={() => handleKick(p.socketId)}
                                                style={{ fontSize: '14px', fontWeight: 500, color: '#5767D0', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                Kick out
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBox;
