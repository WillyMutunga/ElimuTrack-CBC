import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetUsername, setResetUsername] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } catch (err) {
            const detail = err?.response?.data?.detail;
            if (detail && detail.includes('pending verification')) {
                setError(detail);
            } else {
                setError('Invalid credentials. Please try again.');
            }
        }
        setIsLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetMessage('');
        try {
            await api.post('request-reset/', { username: resetUsername });
            setResetMessage('✅ Your request has been sent to the administrator. They will contact you with a new password shortly.');
            setResetUsername('');
        } catch (err) {
            setResetMessage('❌ No account found with that username.');
        }
    };

    return (
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="text-center mb-4">
                    <h2 className="text-gradient">ElimuTrack</h2>
                    <p className="text-secondary">CBC Management System</p>
                </div>

                {!showForgotPassword ? (
                    <>
                        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center', padding: '10px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Username</label>
                                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>
                        <div className="text-center mt-4">
                            <button
                                onClick={() => setShowForgotPassword(true)}
                                style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                            >
                                Forgot Password?
                            </button>
                        </div>
                        <p className="text-center mt-2" style={{ fontSize: '0.85rem' }}>
                            Are you a Parent? <Link to="/parent-login" style={{ color: 'var(--accent-primary)' }}>Parent Portal</Link>
                        </p>
                        <p className="text-center mt-1" style={{ fontSize: '0.85rem' }}>
                            New student? <Link to="/register" style={{ color: 'var(--accent-primary)' }}>Register Here</Link>
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="text-center mb-2">Password Reset Request</h3>
                        <p className="text-secondary text-center mb-4" style={{ fontSize: '0.85rem' }}>
                            Enter your username and we'll notify the administrator to reset your password.
                        </p>
                        {resetMessage && (
                            <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', background: resetMessage.startsWith('✅') ? 'rgba(0,200,100,0.1)' : 'rgba(255,0,0,0.1)', color: resetMessage.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>
                                {resetMessage}
                            </div>
                        )}
                        <form onSubmit={handleForgotPassword}>
                            <div className="input-group">
                                <label>Your Username</label>
                                <input type="text" required value={resetUsername} onChange={(e) => setResetUsername(e.target.value)} placeholder="Enter your username" />
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-4">Send Reset Request</button>
                        </form>
                        <div className="text-center mt-4">
                            <button
                                onClick={() => { setShowForgotPassword(false); setResetMessage(''); }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                            >
                                ← Back to Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
