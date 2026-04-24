import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('overview'); // overview, enrollment, timetable, profile
    const [classes, setClasses] = useState([]);
    const [timetables, setTimetables] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [modules, setModules] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [profile, setProfile] = useState({ 
        full_name: '', 
        grade_level: '',
        parent_first_name: '',
        parent_phone_number: '',
        tracks: [],
        is_verified: false,
        username: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const cls = await api.get('classes/');
            setClasses(cls.data);
            const enr = await api.get('enrollments/');
            // Only show enrollments for this student
            setEnrollments(enr.data.filter(e => e.student === user.id));
            const tt = await api.get('timetables/');
            setTimetables(tt.data);
            const asms = await api.get('assessments/');
            // Only show authorized exams
            setExams(asms.data.filter(a => a.is_authorized));
            
            const subRes = await api.get('assessment-submissions/');
            setSubmissions(subRes.data);
            setResults(subRes.data.filter(s => s.status === 'PUBLISHED'));

            const profileRes = await api.get('profile/');
            setProfile(profileRes.data);

            const modRes = await api.get('modules/');
            setModules(modRes.data);

            const usersRes = await api.get('users/');
            setTeachers(usersRes.data.filter(u => u.role === 'TEACHER'));
        } catch (error) { console.error("Error fetching student data", error); }
    };

    if (user && !user.is_verified) {
        return (
            <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="glass-panel text-center" style={{ maxWidth: '500px' }}>
                    <h2 className="text-warning mb-4">Pending Verification</h2>
                    <p className="text-secondary mb-4">Your account is currently under review by the administration. You must wait for your academic scripts to be verified before accessing the portal.</p>
                    <button className="btn btn-secondary mt-4" onClick={logout}>Logout</button>
                </div>
            </div>
        );
    }

    const handleEnroll = async (classId) => {
        try {
            await api.post('enrollments/', { student: user.id, class_group: classId });
            alert("Enrolled successfully!");
            loadData();
        } catch (error) { 
            if (error.response && error.response.data && error.response.data.detail) {
                alert(error.response.data.detail);
            } else {
                alert("Failed to enroll."); 
            }
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.patch('profile/', profile);
            alert("Profile updated!");
        } catch (error) { alert("Failed to update profile."); }
    };

    const myClassIds = enrollments.map(e => e.class_group);
    const myTimetables = timetables.filter(t => myClassIds.includes(t.class_group));

    // Logic for Upcoming Classes
    const getUpcomingClass = () => {
        const now = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const currentDay = days[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();

        return myTimetables.find(t => {
            if (t.day_of_week !== currentDay) return false;
            const [h, m] = t.start_time.split(':').map(Number);
            const startTotal = h * 60 + m;
            // Class is upcoming if it starts within next 60 mins or is currently happening
            return (startTotal > currentTime && startTotal - currentTime <= 60) || 
                   (currentTime >= startTotal && currentTime <= startTotal + 60); // assume 1hr classes
        });
    };

    const upcoming = getUpcomingClass();

    return (
        <div className="app-container animate-fade-in">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-gradient">Student Portal</h1>
                    <p className="text-secondary">Welcome, {user?.username} {profile.grade_level ? `(${profile.grade_level})` : ''}</p>
                </div>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
            </header>

            <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
                <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`btn ${activeTab === 'learning' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('learning')}>My Learning</button>
                <button className={`btn ${activeTab === 'enrollment' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('enrollment')}>Class Enrollment</button>
                <button className={`btn ${activeTab === 'timetable' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('timetable')}>My Timetable</button>
                <button className={`btn ${activeTab === 'exams' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('exams')}>Exams & Results</button>
                <button className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('profile')}>Profile</button>
            </div>

            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="glass-panel">
                        <h3>Upcoming Classes</h3>
                        {upcoming ? (
                            <div className="p-4 mt-4 animate-pulse" style={{ background: 'rgba(0, 255, 127, 0.1)', border: '1px solid #00ff7f', borderRadius: '12px' }}>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: '#00ff7f', fontWeight: 600, fontSize: '0.8rem' }}>● LIVE / UPCOMING</span>
                                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{upcoming.start_time} - {upcoming.end_time}</span>
                                </div>
                                <h4 className="mt-2" style={{ margin: 0 }}>{upcoming.subject_name}</h4>
                                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Prepare your materials for the session.</p>
                                <button className="btn btn-primary btn-sm mt-4" onClick={() => setActiveTab('learning')}>
                                    Go to Learning Area
                                </button>
                            </div>
                        ) : (
                            <p className="text-secondary mt-4">No classes scheduled for the next hour.</p>
                        )}
                    </div>

                    <div className="glass-panel">
                        <h3>Academic Progress</h3>
                        <div className="mt-4">
                            <div className="flex justify-between mb-2">
                                <span>Course Completion</span>
                                <span>{Math.round(modules.filter(m => m.progress_percentage === 100).length / (modules.length || 1) * 100)}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${(modules.filter(m => m.progress_percentage === 100).length / (modules.length || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'learning' && (
                <div className="glass-panel">
                    <h3>My Modules</h3>
                    <p className="text-secondary mb-4">Select a module to continue your learning journey.</p>
                    {modules.length === 0 ? (
                        <p className="text-center py-8">No modules available for your registered tracks yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {modules.map(mod => (
                                <div key={mod.id} className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                                    <h4 className="mb-2">{mod.title}</h4>
                                    <p className="text-secondary mb-4" style={{ fontSize: '0.85rem', height: '40px', overflow: 'hidden' }}>{mod.description}</p>
                                    
                                    <div className="flex justify-between mb-1" style={{ fontSize: '0.8rem' }}>
                                        <span>Progress</span>
                                        <span>{mod.progress_percentage}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', marginBottom: '16px' }}>
                                        <div style={{ 
                                            width: `${mod.progress_percentage}%`, 
                                            height: '100%', 
                                            background: 'var(--success)', 
                                            borderRadius: '4px',
                                            transition: 'width 0.5s ease'
                                        }}></div>
                                    </div>
                                    
                                    <button className="btn btn-primary w-full" onClick={() => window.location.href = `/learning/module/${mod.id}`}>
                                        {mod.progress_percentage === 0 ? 'Start Learning' : 'Continue Learning'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'enrollment' && (
                <div className="glass-panel">
                    <h3>Available Classes</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
                        {classes.filter(cls => cls.grade_level === profile.grade_level && profile.tracks.includes(cls.track)).length === 0 ? (
                            <p className="text-secondary text-center py-4" style={{ gridColumn: '1 / -1' }}>No classes available for your grade level ({profile.grade_level || 'Not Specified'}) and specialized tracks.</p>
                        ) : (
                            classes.filter(cls => cls.grade_level === profile.grade_level && profile.tracks.includes(cls.track)).map(cls => (
                                <div key={cls.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                                    <h4>{cls.name}</h4>
                                    <p className="text-secondary mb-4">{cls.grade_level}</p>
                                    {myClassIds.includes(cls.id) ? (
                                        <button className="btn btn-secondary w-full" disabled>Enrolled</button>
                                    ) : (
                                        <button className="btn btn-primary w-full" onClick={() => handleEnroll(cls.id)}>Enroll Now</button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'timetable' && (
                <div className="glass-panel animate-slide-up">
                    <h3>Weekly Schedule</h3>
                    <p className="text-secondary mb-6">Click on a subject to jump to its learning modules.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                        {['MON', 'TUE', 'WED', 'THU', 'FRI'].map(day => (
                            <div key={day} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '12px' }}>
                                <h5 className="text-center mb-4" style={{ color: 'var(--accent-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>{day}</h5>
                                <div className="flex flex-col gap-3">
                                    {myTimetables.filter(t => t.day_of_week === day).length === 0 ? (
                                        <p className="text-center text-secondary" style={{ fontSize: '0.7rem' }}>No Classes</p>
                                    ) : (
                                        myTimetables.filter(t => t.day_of_week === day).sort((a,b) => a.start_time.localeCompare(b.start_time)).map(t => (
                                            <div 
                                                key={t.id} 
                                                onClick={() => setActiveTab('learning')}
                                                style={{ 
                                                    padding: '10px', 
                                                    background: 'rgba(255,255,255,0.03)', 
                                                    borderRadius: '8px', 
                                                    borderLeft: '4px solid var(--accent-primary)',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s, background 0.2s'
                                                }}
                                                className="hover-scale"
                                            >
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.subject_name}</div>
                                                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{t.start_time.slice(0,5)}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'exams' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="glass-panel animate-slide-up">
                        <h3>Active Exams</h3>
                        <p className="text-secondary mb-6">Exams that have been authorized by the Admin and are ready for you to take.</p>
                        {(() => {
                            const activeExams = exams.filter(ex => !submissions.some(s => s.assessment === ex.id));
                            return activeExams.length === 0 ? (
                                <p className="text-secondary text-center py-8">No authorized exams available at the moment.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {activeExams.map(ex => (
                                        <div key={ex.id} className="flex justify-between items-center p-4" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{ex.title}</div>
                                                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Duration: {ex.time_limit_minutes} minutes</div>
                                            </div>
                                            <button className="btn btn-primary" onClick={() => window.location.href = `/exam/${ex.id}`}>Start Exam</button>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <h3 className="mb-4">My Exam Results</h3>
                        <p className="text-secondary mb-6">Your performance record for recently completed and graded assessments.</p>
                        {results.length === 0 ? (
                            <p className="text-secondary text-center py-8">No published grades found yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {results.map(r => (
                                    <div key={r.id} className="flex justify-between items-center p-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{r.assessment_title}</div>
                                            <div className="text-secondary" style={{ fontSize: '0.8rem' }}>Status: Completed</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem' }}>{r.score}</div>
                                            <div className="text-secondary" style={{ fontSize: '0.7rem' }}>Total Marks</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                    <div className="glass-panel text-center">
                        <div style={{ 
                            width: '120px', height: '120px', borderRadius: '50%', 
                            background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))',
                            margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', color: '#fff', fontWeight: 'bold'
                        }}>
                            {profile.full_name?.[0] || profile.username?.[0]}
                        </div>
                        <h3>{profile.full_name || profile.username}</h3>
                        <p className="text-secondary">@{profile.username}</p>
                        <span className={`badge ${profile.is_verified ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '12px' }}>
                            {profile.is_verified ? 'Verified Student' : 'Pending Verification'}
                        </span>
                    </div>

                    <div className="glass-panel">
                        <h3 className="mb-4">Academic & Personal Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <h5 className="text-accent mb-2">Grade Level</h5>
                                <p>{profile.grade_level || 'Not Specified'}</p>
                            </div>
                            <div>
                                <h5 className="text-accent mb-2">Selected Tracks</h5>
                                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                    {profile.tracks_details?.length > 0 ? profile.tracks_details.map(t => (
                                        <span key={t.id} className="badge badge-secondary">{t.name}</span>
                                    )) : <p className="text-secondary">No tracks selected</p>}
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                                <h4 className="mb-4">Parent / Guardian Information</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <h5 className="text-accent mb-2">Guardian Name</h5>
                                        <p>{profile.parent_first_name || 'Not Recorded'}</p>
                                    </div>
                                    <div>
                                        <h5 className="text-accent mb-2">Guardian Phone</h5>
                                        <p>{profile.parent_phone_number || 'Not Recorded'}</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                                <h4 className="mb-4">My Teachers</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {teachers.length === 0 ? (
                                        <p className="text-secondary">No specialized teachers assigned yet.</p>
                                    ) : (
                                        teachers.map(t => (
                                            <div key={t.id} className="p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)' }}>
                                                <strong>{t.full_name || t.username}</strong>
                                                <div className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                                                    {t.tracks_details?.map(tr => tr.name).join(', ') || 'General Track'}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
