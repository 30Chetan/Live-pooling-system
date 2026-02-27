import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoll } from '../context/PollContext';

const RoleSelectPage: React.FC = () => {
    const navigate = useNavigate();
    const { setRole } = usePoll();

    const handleSelectRole = (role: 'teacher' | 'student') => {
        setRole(role);
        navigate(`/${role}`);
    };

    return (
        <div className="container">
            <div className="card">
                <h1>Live Poll System</h1>
                <p className="subtitle">Choose your role to continue</p>
                <div className="button-group">
                    <button
                        className="btn btn-primary"
                        onClick={() => handleSelectRole('teacher')}
                    >
                        Continue as Teacher
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => handleSelectRole('student')}
                    >
                        Continue as Student
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleSelectPage;
