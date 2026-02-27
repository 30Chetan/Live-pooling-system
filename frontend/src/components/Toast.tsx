import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'error' | 'success' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'error' ? '#FEF2F2' : type === 'success' ? '#F0FDF4' : '#EFF6FF';
    const textColor = type === 'error' ? '#991B1B' : type === 'success' ? '#166534' : '#1E40AF';
    const borderColor = type === 'error' ? '#FEE2E2' : type === 'success' ? '#DCFCE7' : '#DBEAFE';

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 20px',
            backgroundColor: bgColor,
            color: textColor,
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <span>{type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span style={{ fontWeight: 500 }}>{message}</span>
            <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: textColor }}
            >
                ✕
            </button>
        </div>
    );
};

export default Toast;
