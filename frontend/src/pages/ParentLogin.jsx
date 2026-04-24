import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

const ParentLogin = () => {
    const [first_name, setFirstName] = useState('');
    const [phone_number, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithToken } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await api.post('parent-login/', { first_name, phone_number });
            loginWithToken(res.data.access, res.data.refresh);
            navigate('/dashboard');
        } catch (error) {
            setError('Invalid credentials or no associated student found.');
        }
        setIsLoading(false);
    };

    return (
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="text-center mb-4">
                    <h2 className="text-gradient">Parent Portal Login</h2>
                    <p className="text-secondary">Track your child's progress.</p>
                </div>
                
                {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Your First Name</label>
                        <input type="text" required value={first_name} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label>Your Phone Number</label>
                        <input type="text" required value={phone_number} onChange={(e) => setPhoneNumber(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Access Portal'}
                    </button>
                </form>

                <p className="text-center mt-4" style={{ fontSize: '0.85rem' }}>
                    Student or Teacher? <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Standard Login</Link>
                </p>
            </div>
        </div>
    );
};

export default ParentLogin;
