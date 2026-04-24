import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const ParentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [student, setStudent] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const studentId = user?.associated_student || user?.student_id;
            if (studentId) {
                try {
                    const studentRes = await api.get(`users/${studentId}/`);
                    setStudent(studentRes.data);
                    
                    const subRes = await api.get('assessment-submissions/');
                    // Filter submissions for this specific student
                    setResults(subRes.data.filter(s => s.status === 'PUBLISHED' && s.student === studentId));
                } catch (err) {
                    console.error("Failed to fetch parent portal data", err);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [user?.associated_student, user?.student_id]);

    if (loading) return <div className="app-container">Loading Portal...</div>;

    return (
        <div className="app-container animate-fade-in">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-gradient">Parent Portal</h1>
                    <p className="text-secondary">Welcome, {user?.full_name || user?.username}</p>
                </div>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
            </header>

            <div className="glass-panel mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h3>Child Overview: {student?.full_name || 'Associated Student'} ({student?.grade_level || 'N/A'})</h3>
                    <span style={{ background: 'var(--success)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', color: '#000', fontWeight: 'bold' }}>On Track</span>
                </div>
                
                <p className="text-secondary mb-4">
                    Your child is currently maintaining an average of "Meeting Expectations" (ME) across current modules.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <h4 className="mb-2">Recent Competency Observations</h4>
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            <li style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <strong>Science: Environment</strong> - Meeting Expectations (ME)
                            </li>
                            <li style={{ padding: '8px 0' }}>
                                <strong>Math: Addition</strong> - Exceeding Expectations (EE)
                            </li>
                        </ul>
                    </div>
                    
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <h4 className="mb-2">Published Grades</h4>
                        {results.length === 0 ? (
                            <p className="text-secondary text-center mt-4">No published exam grades available for viewing yet.</p>
                        ) : (
                            <ul style={{ listStyleType: 'none', padding: 0 }}>
                                {results.map(r => (
                                    <li key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{r.assessment_title}</span>
                                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{r.score}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
            
            <p className="text-secondary text-center" style={{ fontSize: '0.85rem' }}>
                Note: This is a read-only view. Please contact the class teacher for direct inquiries.
            </p>
        </div>
    );
};

export default ParentDashboard;
