import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [teacherUsername, setTeacherUsername] = useState('');
    const [teacherPassword, setTeacherPassword] = useState('');
    const [message, setMessage] = useState('');
    const [pendingExams, setPendingExams] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [resetRequests, setResetRequests] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const examsRes = await api.get('assessments/');
            setPendingExams(examsRes.data.filter(exam => !exam.is_authorized));
            
            const usersRes = await api.get('users/');
            setAllUsers(usersRes.data);
            setPendingStudents(usersRes.data.filter(u => u.role === 'STUDENT' && !u.is_verified));

            const subRes = await api.get('assessment-submissions/');
            setAllSubmissions(subRes.data);

            const rrRes = await api.get('reset-requests/?is_resolved=false');
            setResetRequests(rrRes.data.filter(r => !r.is_resolved));
        } catch (error) {
            console.error("Failed to load admin data", error);
        }
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        try {
            await api.post('create-teacher/', { username: teacherUsername, password: teacherPassword });
            setMessage(`Teacher ${teacherUsername} created successfully.`);
            setTeacherUsername('');
            setTeacherPassword('');
        } catch (error) {
            setMessage('Failed to create teacher.');
        }
    };

    const handleAuthorizeExam = async (examId) => {
        try {
            await api.patch(`assessments/${examId}/`, { is_authorized: true });
            setMessage(`Exam authorized successfully.`);
            loadData();
        } catch (error) {
            setMessage('Failed to authorize exam.');
        }
    };

    const handleVerifyStudent = async (studentId) => {
        try {
            await api.patch(`users/${studentId}/`, { is_verified: true });
            setMessage(`Student verified successfully.`);
            loadData();
        } catch (error) {
            setMessage('Failed to verify student.');
        }
    };

    const handleResetPassword = async (userId) => {
        if (!newPassword) { alert('Please enter a new password.'); return; }
        try {
            await api.post('admin-reset/', { user_id: userId, new_password: newPassword });
            setMessage(`Password reset successfully for ${selectedUser?.full_name || selectedUser?.username}.`);
            setNewPassword('');
            setSelectedUser(null);
            loadData();
        } catch (error) {
            setMessage('Failed to reset password.');
        }
    };

    return (
        <div className="app-container animate-fade-in">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-gradient">School Administration</h1>
                    <p className="text-secondary">Logged in as {user?.username}</p>
                </div>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
            </header>

            {message && <div className="glass-panel text-center" style={{ background: 'var(--success)', color: '#000', marginBottom: '16px', padding: '12px' }}>{message}</div>}

            <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
                <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>Users</button>
                <button className={`btn ${activeTab === 'teachers' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('teachers')}>Add Teacher</button>
                <button className={`btn ${activeTab === 'exams' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('exams')}>Exam Queue</button>
                <button className={`btn ${activeTab === 'verifications' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('verifications')}>Verifications</button>
                <button className={`btn ${activeTab === 'results' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('results')}>Results</button>
                <button className={`btn ${activeTab === 'reset-requests' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('reset-requests')} style={{ position: 'relative' }}>
                    Password Resets
                    {resetRequests.length > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{resetRequests.length}</span>}
                </button>
            </div>

            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div className="glass-panel text-center">
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', marginBottom: '8px' }}>{allUsers.filter(u => u.role === 'STUDENT').length}</h2>
                        <p className="text-secondary">Enrolled Students</p>
                    </div>
                    <div className="glass-panel text-center">
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--success)', marginBottom: '8px' }}>{allUsers.filter(u => u.role === 'TEACHER').length}</h2>
                        <p className="text-secondary">Active Teachers</p>
                    </div>
                    <div className="glass-panel text-center">
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--warning)', marginBottom: '8px' }}>{pendingStudents.length}</h2>
                        <p className="text-secondary">Pending Verifications</p>
                    </div>
                </div>
            )}

            {activeTab === 'teachers' && (
                <div className="glass-panel" style={{ maxWidth: '600px' }}>
                    <h3 className="mb-4">Create Teacher Profile</h3>
                    <form onSubmit={handleCreateTeacher}>
                        <div className="input-group">
                            <label>Teacher Username</label>
                            <input type="text" required value={teacherUsername} onChange={(e) => setTeacherUsername(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Temporary Password</label>
                            <input type="text" required value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-primary w-full">Generate Credentials</button>
                    </form>
                </div>
            )}

            {activeTab === 'exams' && (
                <div className="glass-panel">
                    <h3 className="mb-4">Exam Authorization Queue</h3>
                    {pendingExams.length === 0 ? (
                        <p className="text-secondary text-center">No exams pending authorization.</p>
                    ) : (
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {pendingExams.map(exam => (
                                <li key={exam.id} style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{exam.title}</strong>
                                        <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Type: {exam.type} | Duration: {exam.time_limit_minutes}m</p>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => handleAuthorizeExam(exam.id)}>Authorize</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {activeTab === 'verifications' && (
                <div className="glass-panel">
                    <h3 className="mb-4">Student Verification Queue</h3>
                    {pendingStudents.length === 0 ? (
                        <p className="text-secondary text-center">No students pending verification.</p>
                    ) : (
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {pendingStudents.map(student => (
                                <li key={student.id} style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{student.full_name} ({student.username})</strong>
                                        <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Email: {student.email}</p>
                                        {student.verification_document && (
                                            <a href={student.verification_document} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem' }}>View Academic Script</a>
                                        )}
                                    </div>
                                    <button className="btn btn-success" onClick={() => handleVerifyStudent(student.id)}>Verify Student</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="glass-panel">
                        <h3>Teachers ({allUsers.filter(u => u.role === 'TEACHER').length})</h3>
                        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {allUsers.filter(u => u.role === 'TEACHER').map(t => (
                                <div key={t.id} onClick={() => setSelectedUser(t)} className="p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)', cursor: 'pointer', transition: 'background 0.2s' }}>
                                    <strong>{t.full_name || t.username}</strong>
                                    <p className="text-secondary" style={{ fontSize: '0.8rem' }}>@{t.username} · Click to view profile</p>
                                </div>
                            ))}
                            {allUsers.filter(u => u.role === 'TEACHER').length === 0 && <p className="text-secondary">No teachers yet.</p>}
                        </div>
                    </div>
                    <div className="glass-panel">
                        <h3>Students ({allUsers.filter(u => u.role === 'STUDENT').length})</h3>
                        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {allUsers.filter(u => u.role === 'STUDENT').map(s => (
                                <div key={s.id} onClick={() => setSelectedUser(s)} className="p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: s.is_verified ? '4px solid var(--success)' : '4px solid var(--warning)', cursor: 'pointer', transition: 'background 0.2s' }}>
                                    <strong>{s.full_name || s.username}</strong>
                                    <p className="text-secondary" style={{ fontSize: '0.8rem' }}>{s.grade_level} · {s.is_verified ? '✅ Verified' : '⏳ Pending'} · Click to view</p>
                                </div>
                            ))}
                            {allUsers.filter(u => u.role === 'STUDENT').length === 0 && <p className="text-secondary">No students yet.</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'results' && (
                <div className="glass-panel">
                    <h3>Student Results Archive</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <th className="p-3">Student</th>
                                    <th className="p-3">Assessment</th>
                                    <th className="p-3">Score</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allSubmissions.map(sub => (
                                    <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td className="p-3">{sub.student_name}</td>
                                        <td className="p-3">{sub.assessment_title}</td>
                                        <td className="p-3" style={{ color: 'var(--success)', fontWeight: 'bold' }}>{sub.score}</td>
                                        <td className="p-3">
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: sub.status === 'PUBLISHED' ? 'var(--success)' : 'var(--warning)', color: '#000' }}>
                                                {sub.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {allSubmissions.length === 0 && <p className="text-center py-8 text-secondary">No results recorded in the system yet.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'reset-requests' && (
                <div className="glass-panel">
                    <h3>Password Reset Requests</h3>
                    <p className="text-secondary mb-4">Users who have requested a password reset. Click a name to view their profile and reset their password.</p>
                    {resetRequests.length === 0 ? (
                        <p className="text-secondary text-center py-8">✅ No pending password reset requests.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            {resetRequests.map(r => (
                                <div key={r.id} className="flex justify-between items-center p-4" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid var(--danger)', borderRadius: '12px' }}>
                                    <div>
                                        <strong>{r.full_name || r.username}</strong>
                                        <p className="text-secondary" style={{ fontSize: '0.8rem' }}>@{r.username} · Requested {new Date(r.date_requested).toLocaleString()}</p>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setSelectedUser(allUsers.find(u => u.username === r.username))}
                                    >
                                        Reset Password
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* User Profile Modal */}
            {selectedUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
                    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <button onClick={() => { setSelectedUser(null); setNewPassword(''); }} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                        
                        <div className="text-center mb-6">
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.8rem', fontWeight: 'bold' }}>
                                {(selectedUser.full_name || selectedUser.username)?.[0]?.toUpperCase()}
                            </div>
                            <h3>{selectedUser.full_name || selectedUser.username}</h3>
                            <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', background: selectedUser.role === 'TEACHER' ? 'var(--accent-primary)' : 'var(--success)', color: '#000', fontWeight: 'bold' }}>
                                {selectedUser.role}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { label: 'Username', value: selectedUser.username },
                                { label: 'Email', value: selectedUser.email || 'N/A' },
                                { label: 'Phone', value: selectedUser.phone_number || 'N/A' },
                                { label: 'Grade Level', value: selectedUser.grade_level || 'N/A' },
                                { label: 'Verified', value: selectedUser.is_verified ? '✅ Yes' : '⏳ Pending' },
                                { label: 'Profile Complete', value: selectedUser.is_profile_complete ? '✅ Yes' : '❌ No' },
                            ].map(item => (
                                <div key={item.label} className="p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>{item.label}</div>
                                    <div style={{ fontWeight: 500 }}>{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {selectedUser.role === 'STUDENT' && (selectedUser.parent_first_name || selectedUser.parent_phone_number) && (
                            <div className="p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                <h5 className="mb-2">Guardian Information</h5>
                                <p><strong>Name:</strong> {selectedUser.parent_first_name || 'N/A'}</p>
                                <p><strong>Phone:</strong> {selectedUser.parent_phone_number || 'N/A'}</p>
                            </div>
                        )}

                        {selectedUser.bio && (
                            <div className="p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <h5 className="mb-2">Bio</h5>
                                <p className="text-secondary" style={{ fontSize: '0.9rem' }}>{selectedUser.bio}</p>
                            </div>
                        )}

                        <div className="p-4" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid var(--danger)', borderRadius: '12px', marginTop: '8px' }}>
                            <h5 className="mb-3" style={{ color: 'var(--danger)' }}>🔐 Admin Password Reset</h5>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Enter new password..."
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                />
                                <button className="btn btn-primary" onClick={() => handleResetPassword(selectedUser.id)}>
                                    Set Password
                                </button>
                            </div>
                            <p className="text-secondary mt-2" style={{ fontSize: '0.75rem' }}>Share the new password with the user securely.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
