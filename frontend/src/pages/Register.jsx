import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { fetchTracks } from '../api/curriculum';

const Register = () => {
    const [formData, setFormData] = useState({ 
        username: '', email: '', password: '', full_name: '', 
        grade_level: 'Junior School',
        parent_first_name: '', parent_phone_number: '' 
    });
    const [selectedTracks, setSelectedTracks] = useState([]);
    const [availableTracks, setAvailableTracks] = useState([]);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadTracks = async () => {
            try {
                setAvailableTracks(await fetchTracks());
            } catch (err) {
                console.error("Failed to fetch tracks", err);
            }
        };
        loadTracks();
    }, []);

    const handleTrackToggle = (trackId) => {
        if (formData.grade_level === 'Senior School') {
            setSelectedTracks([trackId]); // Single select for Senior School
        } else {
            setSelectedTracks(prev => 
                prev.includes(trackId) 
                    ? prev.filter(id => id !== trackId) 
                    : [...prev, trackId]
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (file) data.append('verification_document', file);
        
        // Append tracks
        selectedTracks.forEach(id => data.append('track_ids', id));

        try {
            await api.post('register/', data, { 
                headers: { 'Content-Type': 'multipart/form-data' } 
            });
            alert('Registration successful! Your account is pending verification. You cannot log in until approved.');
            navigate('/login');
        } catch (error) {
            const msg = error.response?.data?.non_field_errors?.[0] || 
                      Object.values(error.response?.data || {})[0] || 
                      'Registration failed. Please check your details.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
        setIsLoading(false);
    };

    return (
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                <div className="text-center mb-4">
                    <h2 className="text-gradient">Student Registration</h2>
                    <p className="text-secondary">Join ElimuTrack today. Verification required.</p>
                </div>
                
                {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
                    <div className="input-group">
                        <label>Full Name</label>
                        <input type="text" required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="input-group">
                            <label>Username</label>
                            <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Grade Level</label>
                            <select value={formData.grade_level} onChange={(e) => {
                                setFormData({...formData, grade_level: e.target.value});
                                if (e.target.value === 'Senior School') setSelectedTracks([]); // Reset if changing to Senior
                            }}>
                                <option value="Junior School">Junior School (Grade 7-9)</option>
                                <option value="Senior School">Senior School (Grade 10-12)</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    
                    <h4 style={{ marginTop: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px' }}>Parent Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="input-group">
                            <label>Parent First Name</label>
                            <input type="text" required value={formData.parent_first_name} onChange={(e) => setFormData({...formData, parent_first_name: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Parent Phone Number</label>
                            <input type="text" required value={formData.parent_phone_number} onChange={(e) => setFormData({...formData, parent_phone_number: e.target.value})} />
                        </div>
                    </div>

                    <h4 style={{ marginTop: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px' }}>Track Selection</h4>
                    <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Select all tracks that apply to you.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '12px' }}>
                        {availableTracks.map(track => (
                            <label key={track.id} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px',
                                transition: 'background 0.2s',
                                margin: 0
                            }}
                            className="hover-bg-glass"
                            >
                                <input 
                                    type={formData.grade_level === 'Senior School' ? 'radio' : 'checkbox'}
                                    name="track_selection"
                                    checked={selectedTracks.includes(track.id)} 
                                    onChange={() => handleTrackToggle(track.id)}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                                />
                                <span style={{ fontSize: '0.85rem' }}>{track.name}</span>
                            </label>
                        ))}
                    </div>

                    <h4 style={{ marginTop: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px' }}>Academic Verification</h4>
                    <div className="input-group">
                        <label>Upload Academic Script (PDF/Doc)</label>
                        <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ padding: '8px' }} />
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
                        {isLoading ? 'Registering...' : 'Submit Application'}
                    </button>
                </form>

                <p className="text-center mt-4" style={{ fontSize: '0.85rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
