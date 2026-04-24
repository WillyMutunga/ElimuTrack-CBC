import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchLearningAreas, fetchModules, createModule, fetchClasses, fetchTimetables, createTimetable, createAssessment, updateProfile, fetchTracks, uploadContent } from '../api/curriculum';
import api from '../api/axios';

const TeacherDashboard = () => {
    const { user, logout, setUser } = useContext(AuthContext);
    const [learningAreas, setLearningAreas] = useState([]);
    const [modules, setModules] = useState([]);
    const [classes, setClasses] = useState([]);
    const [timetables, setTimetables] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [students, setStudents] = useState([]);
    const [activeTab, setActiveTab] = useState(user?.is_profile_complete ? 'modules' : 'profile');
    
    // New Module Form State
    const [showNewModuleForm, setShowNewModuleForm] = useState(false);
    const [newModule, setNewModule] = useState({ learning_area: '', track: '', title: '', description: '', order_index: 0, is_locked: false });
    
    // Timetable Form State
    const [newTimetable, setNewTimetable] = useState({ class_group: '', subject: '', day_of_week: 'MON', start_time: '', end_time: '' });

    // Assessment Form State
    const [newExam, setNewExam] = useState({ module: '', track: '', title: '', type: 'EXAM', time_limit_minutes: 30 });

    // Classroom Management State
    const [newClass, setNewClass] = useState({ name: '', grade_level: 'Senior School', track: '' });
    const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState('');
    const [managingClassEnrollment, setManagingClassEnrollment] = useState(null);

    // Profile Form State
    const [profile, setProfile] = useState({ 
        full_name: '', 
        phone_number: '', 
        bio: '', 
        is_profile_complete: false,
        tracks: []
    });

    // Monitoring & Grading State
    const [enrollments, setEnrollments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [gradingScore, setGradingScore] = useState(0);

    // Question Management State
    const [selectedExam, setSelectedExam] = useState(null);
    const [newQuestion, setNewQuestion] = useState({ text: '', type: 'MCQ', points: 1, options: { choices: [], correct: '' } });

    // Content Management State
    const [managingModule, setManagingModule] = useState(null); // The module being edited
    const [newContent, setNewContent] = useState({ title: '', content_type: 'VIDEO', external_link: '', file: null, text_content: '' });

    // Exam Management State
    const [managingExam, setManagingExam] = useState(null); 
    const [exams, setExams] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch the full profile to get tracks and other details not in the token
            const profileRes = await api.get('profile/');
            setProfile({
                full_name: profileRes.data.full_name || '',
                phone_number: profileRes.data.phone_number || '',
                bio: profileRes.data.bio || '',
                is_profile_complete: profileRes.data.is_profile_complete || false,
                tracks: profileRes.data.tracks || []
            });

            setLearningAreas(await fetchLearningAreas());
            setModules(await fetchModules());
            setClasses(await fetchClasses());
            setTimetables(await fetchTimetables());
            setTracks(await fetchTracks());

            const studentsRes = await api.get('users/');
            setStudents(studentsRes.data);
            
            const sessionsRes = await api.get('exam-sessions/');
            setSessions(sessionsRes.data);
            
            const submissionsRes = await api.get('assessment-submissions/');
            setSubmissions(submissionsRes.data);

            const enrRes = await api.get('enrollments/');
            setEnrollments(enrRes.data);

            const examsRes = await api.get('assessments/');
            setExams(examsRes.data);
        } catch (error) {
            console.error("Error loading curriculum data:", error);
        }
    };

    const handleCreateModule = async (e) => {
        e.preventDefault();
        try {
            await createModule(newModule);
            setShowNewModuleForm(false);
            setNewModule({ learning_area: '', title: '', description: '', order_index: 0, is_locked: false });
            loadData();
        } catch (error) { alert("Failed to create module."); }
    };

    const handleCreateTimetable = async (e) => {
        e.preventDefault();
        try {
            await createTimetable(newTimetable);
            loadData();
            alert("Timetable added!");
        } catch (error) { alert("Failed to create timetable."); }
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            await createAssessment(newExam);
            alert("Exam created and sent to Admin for authorization!");
            loadData();
        } catch (error) { alert("Failed to create exam."); }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await api.post('classes/', newClass);
            alert("Class created!");
            setNewClass({ name: '', grade_level: 'Senior School', track: '' });
            loadData();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.detail) {
                alert(error.response.data.detail);
            } else {
                alert("Failed to create class.");
            }
        }
    };

    const handleEnrollStudent = async (classId) => {
        if (!selectedStudentForEnroll) return;
        try {
            await api.post('enrollments/', { 
                student: selectedStudentForEnroll, 
                class_group: classId 
            });
            alert("Student enrolled!");
            setSelectedStudentForEnroll('');
            loadData();
        } catch (error) { alert("Failed to enroll student. They might already be in this class."); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(profile);
            // Update user context immediately so filters and lockout are updated without re-login
            setUser(prev => ({ 
                ...prev, 
                is_profile_complete: profile.is_profile_complete,
                tracks: profile.tracks 
            }));
            alert("Profile updated!");
            if (profile.is_profile_complete) setActiveTab('modules');
        } catch (error) { alert("Failed to update profile."); }
    };

    const handleGradeSubmission = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`assessment-submissions/${selectedSubmission.id}/`, {
                score: gradingScore,
                status: 'PUBLISHED'
            });
            alert("Submission graded and published!");
            setSelectedSubmission(null);
            loadData();
        } catch (error) { alert("Failed to grade submission."); }
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        try {
            await api.post('questions/', {
                assessment: managingExam.id,
                ...newQuestion
            });
            alert("Question added!");
            setNewQuestion({ text: '', type: 'MCQ', points: 1, options: { choices: [], correct: '' } });
            // Refresh managingExam questions
            const updatedExam = await api.get(`assessments/${managingExam.id}/`);
            setManagingExam(updatedExam.data);
            loadData();
        } catch (error) { alert("Failed to add question."); }
    };

    const handleUpdateExamSettings = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`assessments/${managingExam.id}/`, {
                is_locked: managingExam.is_locked,
                scheduled_start_time: managingExam.scheduled_start_time,
                scheduled_end_time: managingExam.scheduled_end_time,
                time_limit_minutes: managingExam.time_limit_minutes
            });
            alert("Exam settings updated!");
            loadData();
        } catch (error) { alert("Failed to update exam settings."); }
    };

    const handleDeleteQuestion = async (qId) => {
        if (!window.confirm("Delete this question?")) return;
        try {
            await api.delete(`questions/${qId}/`);
            const updatedExam = await api.get(`assessments/${managingExam.id}/`);
            setManagingExam(updatedExam.data);
            loadData();
        } catch (error) { alert("Failed to delete question."); }
    };

    const handleUploadContent = async (e) => {
        e.preventDefault();
        if (!managingModule) {
            alert("No module selected.");
            return;
        }
        try {
            const data = { ...newContent, module: managingModule.id };
            await uploadContent(data);
            alert("Content added successfully!");
            setNewContent({ title: '', content_type: 'VIDEO', external_link: '', file: null, text_content: '' });
            loadData();
            // Update managingModule to show the new content
            const updatedMod = await api.get(`modules/${managingModule.id}/`);
            setManagingModule(updatedMod.data);
        } catch (error) { 
            console.error("UPLOAD ATTEMPT FAILED!", error);
            
            let msg = "Failed to upload content.";
            if (error.response) {
                msg = `Server Error (${error.response.status}): ` + JSON.stringify(error.response.data);
            } else if (error.request) {
                msg = "No response from server. Check network connection.";
            } else {
                msg = error.message;
            }
            alert(msg); 
        }
    };

    const handleDeleteContent = async (contentId) => {
        if (!window.confirm("Are you sure you want to delete this lesson?")) return;
        try {
            await api.delete(`contents/${contentId}/`);
            const updatedMod = await api.get(`modules/${managingModule.id}/`);
            setManagingModule(updatedMod.data);
            loadData();
        } catch (error) { alert("Failed to delete content."); }
    };

    return (
        <div className="app-container animate-fade-in">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-gradient">Teacher Dashboard</h1>
                    <p className="text-secondary">Welcome back, {user?.username}</p>
                </div>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
            </header>

            {!user?.is_profile_complete && (
                <div className="animate-pulse" style={{ 
                    background: 'linear-gradient(90deg, var(--warning), #ffcc00)', 
                    color: '#000', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 15px rgba(255, 204, 0, 0.3)'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>🔔</span>
                    <div>
                        <strong style={{ display: 'block' }}>Action Required: Complete Your Specialization Profile</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Please update your certifications and tracks in the Profile tab to enable module management and grading.</p>
                    </div>
                </div>
            )}

            {user?.is_profile_complete && (
                <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
                    <button className={`btn ${activeTab === 'modules' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('modules')}>Modules</button>
                    <button className={`btn ${activeTab === 'timetable' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('timetable')}>Timetable</button>
                    <button className={`btn ${activeTab === 'exams' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('exams')}>Exams</button>
                    <button className={`btn ${activeTab === 'monitoring' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('monitoring')}>Monitoring</button>
                    <button className={`btn ${activeTab === 'grading' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('grading')}>Grading</button>
                    <button className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('students')}>My Class</button>
                    <button className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('profile')}>Profile</button>
                </div>
            )}

            {(!user?.is_profile_complete || activeTab === 'profile') && (
                <div className="glass-panel">
                    <h3>Profile Manager</h3>
                    <form onSubmit={handleUpdateProfile} className="mt-4">
                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" required value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Phone Number</label>
                            <input type="text" value={profile.phone_number} onChange={(e) => setProfile({...profile, phone_number: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Bio</label>
                            <textarea value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Tracks & Certifications (Select All That Apply)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                {tracks.map(track => (
                                    <label key={track.id} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        transition: 'background 0.2s',
                                        margin: 0
                                    }}
                                    className="hover-bg-glass"
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={profile.tracks.includes(track.id)} 
                                            onChange={() => {
                                                const newTracks = profile.tracks.includes(track.id)
                                                   ? profile.tracks.filter(id => id !== track.id)
                                                   : [...profile.tracks, track.id];
                                                setProfile({...profile, tracks: newTracks});
                                            }}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                                        />
                                        <span style={{ fontSize: '0.95rem' }}>{track.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="input-group flex gap-2" style={{ alignItems: 'center' }}>
                            <input type="checkbox" checked={profile.is_profile_complete} onChange={(e) => setProfile({...profile, is_profile_complete: e.target.checked})} style={{ width: 'auto' }} />
                            <label style={{ margin: 0 }}>Mark Profile as Complete</label>
                        </div>
                        <button type="submit" className="btn btn-primary mt-4">Save Profile</button>
                    </form>
                </div>
            )}

            {user?.is_profile_complete && activeTab === 'modules' && (
                <div className="glass-panel">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Module Management</h3>
                        <button className="btn btn-primary" onClick={() => setShowNewModuleForm(!showNewModuleForm)}>
                            {showNewModuleForm ? 'Cancel' : '+ New Module'}
                        </button>
                    </div>

                    {showNewModuleForm && (
                        <div className="glass-panel mb-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <form onSubmit={handleCreateModule} className="mt-4">
                                <div className="input-group">
                                    <label>Learning Area</label>
                                    <select required value={newModule.learning_area} onChange={(e) => setNewModule({...newModule, learning_area: e.target.value})}>
                                        <option value="">Select Learning Area...</option>
                                        {learningAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                     <label>Track</label>
                                     <select required value={newModule.track} onChange={(e) => setNewModule({...newModule, track: e.target.value})}>
                                         <option value="">Select Track...</option>
                                         {tracks.filter(t => profile.tracks.includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                     </select>
                                     {profile.tracks.length === 0 && <p className="text-warning" style={{ fontSize: '0.75rem' }}>Update your profile tracks first!</p>}
                                 </div>
                                <div className="input-group">
                                    <label>Title</label>
                                    <input type="text" required value={newModule.title} onChange={(e) => setNewModule({...newModule, title: e.target.value})} />
                                </div>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </form>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {modules.map(mod => (
                            <div key={mod.id} className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                                <div className="flex justify-between mb-2">
                                    <h4>{mod.title}</h4>
                                    <span style={{ fontSize: '0.7rem', background: 'var(--accent-primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>{mod.track_name}</span>
                                </div>
                                <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>{mod.description}</p>
                                <button className="btn btn-secondary w-full" onClick={() => setManagingModule(mod)}>Manage Lessons</button>
                            </div>
                        ))}
                    </div>

                    {managingModule && (
                        <div style={{ 
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            padding: '20px'
                        }}>
                            <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3>Lessons: {managingModule.title}</h3>
                                    <button className="btn btn-secondary" onClick={() => setManagingModule(null)}>Close</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <h5>Add New Lesson</h5>
                                        <form onSubmit={handleUploadContent} className="mt-4">
                                            <div className="input-group">
                                                <label>Title</label>
                                                <input type="text" required value={newContent.title} onChange={e => setNewContent({...newContent, title: e.target.value})} />
                                            </div>
                                            <div className="input-group">
                                                <label>Type</label>
                                                <select value={newContent.content_type} onChange={e => setNewContent({...newContent, content_type: e.target.value})}>
                                                    <option value="VIDEO">Video Link</option>
                                                    <option value="PDF">PDF/Document</option>
                                                    <option value="LINK">External Resource</option>
                                                    <option value="TEXT">Text Lesson</option>
                                                </select>
                                            </div>
                                            {newContent.content_type === 'PDF' ? (
                                                <div className="input-group">
                                                    <label>Upload File</label>
                                                    <input type="file" required onChange={e => setNewContent({...newContent, file: e.target.files[0]})} />
                                                </div>
                                            ) : newContent.content_type === 'TEXT' ? (
                                                <div className="input-group">
                                                    <label>Lesson Content (Text)</label>
                                                    <textarea required rows={10} value={newContent.text_content} onChange={e => setNewContent({...newContent, text_content: e.target.value})} placeholder="Type your lesson here..." />
                                                </div>
                                            ) : (
                                                <div className="input-group">
                                                    <label>URL</label>
                                                    <input type="text" required value={newContent.external_link} onChange={e => setNewContent({...newContent, external_link: e.target.value})} />
                                                </div>
                                            )}
                                            <button type="submit" className="btn btn-primary w-full">Add Lesson</button>
                                        </form>
                                    </div>

                                    <div>
                                        <h5>Existing Lessons</h5>
                                        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {managingModule.contents?.length === 0 ? (
                                                <p className="text-secondary">No lessons added yet.</p>
                                            ) : (
                                                managingModule.contents?.map(content => (
                                                    <div key={content.id} className="flex justify-between items-center p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem' }}>{content.title}</div>
                                                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{content.content_type}</div>
                                                        </div>
                                                        <button className="text-danger" onClick={() => handleDeleteContent(content.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
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
            )}

            {activeTab === 'timetable' && (
                <div className="glass-panel">
                    <h3>Timetable Manager</h3>
                    <form onSubmit={handleCreateTimetable} className="mt-4 mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label>Class</label>
                            <select required value={newTimetable.class_group} onChange={e => setNewTimetable({...newTimetable, class_group: e.target.value})}>
                                <option value="">Select...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Subject</label>
                            <select required value={newTimetable.subject} onChange={e => setNewTimetable({...newTimetable, subject: e.target.value})}>
                                <option value="">Select...</option>
                                {learningAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Day</label>
                            <select required value={newTimetable.day_of_week} onChange={e => setNewTimetable({...newTimetable, day_of_week: e.target.value})}>
                                <option value="MON">Monday</option>
                                <option value="TUE">Tuesday</option>
                                <option value="WED">Wednesday</option>
                                <option value="THU">Thursday</option>
                                <option value="FRI">Friday</option>
                            </select>
                        </div>
                        <div className="input-group flex gap-2">
                            <input type="time" required value={newTimetable.start_time} onChange={e => setNewTimetable({...newTimetable, start_time: e.target.value})} />
                            <input type="time" required value={newTimetable.end_time} onChange={e => setNewTimetable({...newTimetable, end_time: e.target.value})} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>Add Schedule</button>
                    </form>

                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {timetables.length === 0 ? (
                            <p className="text-secondary text-center">No schedule entries yet.</p>
                        ) : (
                            ['MON','TUE','WED','THU','FRI'].map(day => {
                                const dayEntries = timetables.filter(t => t.day_of_week === day);
                                if (dayEntries.length === 0) return null;
                                const dayName = { MON:'Monday', TUE:'Tuesday', WED:'Wednesday', THU:'Thursday', FRI:'Friday' }[day];
                                return (
                                    <div key={day}>
                                        <div className="text-accent" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dayName}</div>
                                        {dayEntries.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(t => (
                                            <div key={t.id} className="flex justify-between items-center p-3 mb-1" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent-primary)' }}>
                                                <span style={{ fontWeight: 500 }}>{t.subject_name || 'Subject'}</span>
                                                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{t.start_time?.slice(0,5)} – {t.end_time?.slice(0,5)}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'exams' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="glass-panel">
                        <h3>Schedule New Exam</h3>
                        <p className="text-secondary mb-4">Exams created here require Admin authorization.</p>
                        <form onSubmit={handleCreateExam}>
                            <div className="input-group">
                                <label>Module</label>
                                <select required value={newExam.module} onChange={e => setNewExam({...newExam, module: e.target.value})}>
                                    <option value="">Select...</option>
                                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Target Track</label>
                                <select required value={newExam.track} onChange={e => setNewExam({...newExam, track: e.target.value})}>
                                    <option value="">Select Track...</option>
                                    {tracks.filter(t => profile.tracks.includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Exam Title</label>
                                <input type="text" required value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} />
                            </div>
                            <button type="submit" className="btn btn-primary w-full">Create Exam</button>
                        </form>
                    </div>

                    <div className="glass-panel">
                        <h3>Manage My Exams</h3>
                        <p className="text-secondary mb-4">Approved exams ready for scheduling.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {exams.length === 0 ? (
                                <p className="text-center py-4 text-secondary">No exams created yet.</p>
                            ) : (
                                exams.map(exam => (
                                    <div key={exam.id} className="flex justify-between items-center p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{exam.title}</div>
                                            <span style={{ fontSize: '0.7rem', color: exam.is_authorized ? 'var(--success)' : 'var(--warning)' }}>
                                                {exam.is_authorized ? '✓ APPROVED' : '⌛ PENDING ADMIN'}
                                            </span>
                                        </div>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setManagingExam(exam)} disabled={!exam.is_authorized}>
                                            Edit / Schedule
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {managingExam && (
                        <div style={{ 
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            padding: '20px'
                        }}>
                            <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto' }}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3>Exam Editor: {managingExam.title}</h3>
                                    <button className="btn btn-secondary" onClick={() => setManagingExam(null)}>Close</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                    {/* Left: Settings */}
                                    <div>
                                        <h5>Scheduling & Control</h5>
                                        <form onSubmit={handleUpdateExamSettings} className="mt-4">
                                            <div className="input-group">
                                                <label>Lock Status</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" checked={managingExam.is_locked} onChange={e => setManagingExam({...managingExam, is_locked: e.target.checked})} />
                                                    <span>Lock Exam (Students cannot start)</span>
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Start Time</label>
                                                <input type="datetime-local" value={managingExam.scheduled_start_time ? managingExam.scheduled_start_time.slice(0,16) : ''} onChange={e => setManagingExam({...managingExam, scheduled_start_time: e.target.value})} />
                                            </div>
                                            <div className="input-group">
                                                <label>End Time</label>
                                                <input type="datetime-local" value={managingExam.scheduled_end_time ? managingExam.scheduled_end_time.slice(0,16) : ''} onChange={e => setManagingExam({...managingExam, scheduled_end_time: e.target.value})} />
                                            </div>
                                            <div className="input-group">
                                                <label>Time Limit (Minutes)</label>
                                                <input type="number" value={managingExam.time_limit_minutes} onChange={e => setManagingExam({...managingExam, time_limit_minutes: e.target.value})} />
                                            </div>
                                            <button type="submit" className="btn btn-primary w-full">Save Settings</button>
                                        </form>
                                    </div>

                                    {/* Right: Questions */}
                                    <div>
                                        <h5>Questions ({managingExam.questions?.length || 0})</h5>
                                        <div className="mt-4 mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {managingExam.questions?.map((q, idx) => (
                                                <div key={q.id} className="p-3 mb-2" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                    <div className="flex justify-between">
                                                        <small className="text-accent">Q{idx + 1} - {q.points} pts</small>
                                                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-danger" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', margin: '4px 0' }}>{q.text}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <h6>Add New Question</h6>
                                        <form onSubmit={handleAddQuestion} className="mt-2">
                                            <div className="input-group">
                                                <textarea 
                                                    required 
                                                    style={{ minHeight: '60px' }}
                                                    value={newQuestion.text} 
                                                    onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} 
                                                    placeholder="Enter question..."
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="number" style={{ width: '80px' }} value={newQuestion.points} onChange={e => setNewQuestion({...newQuestion, points: e.target.value})} />
                                                <button type="submit" className="btn btn-secondary w-full">Add Question</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'monitoring' && (
                <div className="glass-panel">
                    <h3>Exam Monitoring</h3>
                    <p className="text-secondary mb-4">Real-time view of students currently taking exams.</p>
                    {sessions.length === 0 ? (
                        <p className="text-center py-8">No active exam sessions.</p>
                    ) : (
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {sessions.map(s => (
                                <li key={s.id} className="flex justify-between items-center p-4 border-b border-glass">
                                    <div>
                                        <strong>{s.student_name || `Student ID: ${s.student}`}</strong>
                                        <p className="text-secondary">Exam: {s.assessment_title || `Exam ID: ${s.assessment}`}</p>
                                    </div>
                                    <span className={`badge ${s.is_submitted ? 'badge-success' : 'badge-warning'}`}>
                                        {s.is_submitted ? 'Submitted' : 'In Progress'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {activeTab === 'grading' && (
                <div className="glass-panel">
                    <h3>Grading Queue</h3>
                    {selectedSubmission ? (
                        <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <button className="btn btn-secondary mb-4" onClick={() => setSelectedSubmission(null)}>← Back to Queue</button>
                            <h4>Grading: {selectedSubmission.student_name}</h4>
                            <p className="text-secondary mb-4">Exam: {selectedSubmission.assessment_title}</p>
                            
                            <div className="mb-4">
                                <h5>Student Responses:</h5>
                                <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', overflowX: 'auto', color: 'var(--accent-primary)' }}>
                                    {JSON.stringify(selectedSubmission.answers, null, 2)}
                                </pre>
                            </div>

                            <form onSubmit={handleGradeSubmission}>
                                <div className="input-group">
                                    <label>Award Total Score</label>
                                    <input type="number" required value={gradingScore} onChange={e => setGradingScore(e.target.value)} />
                                </div>
                                <button type="submit" className="btn btn-success">Publish Results</button>
                            </form>
                        </div>
                    ) : (
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {submissions.filter(s => s.status === 'DRAFT').length === 0 ? (
                                <p className="text-center py-8">No submissions pending grading.</p>
                            ) : (
                                submissions.filter(s => s.status === 'DRAFT').map(s => (
                                    <li key={s.id} className="flex justify-between items-center p-4 border-b border-glass">
                                        <div>
                                            <strong>{s.student_name}</strong>
                                            <p className="text-secondary">{s.assessment_title}</p>
                                        </div>
                                        <button className="btn btn-primary" onClick={() => { setSelectedSubmission(s); setGradingScore(s.score); }}>Grade Now</button>
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>
            )}

            {activeTab === 'students' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                    <div className="glass-panel">
                        <h3>Create New Class</h3>
                        <form onSubmit={handleCreateClass} className="mt-4">
                            <div className="input-group">
                                <label>Class Name (e.g. 10A)</label>
                                <input type="text" required value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label>Grade Level</label>
                                <select value={newClass.grade_level} onChange={e => setNewClass({...newClass, grade_level: e.target.value})}>
                                    <option value="Junior School">Junior School</option>
                                    <option value="Senior School">Senior School</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Associated Track</label>
                                <select required value={newClass.track} onChange={e => setNewClass({...newClass, track: e.target.value})}>
                                    <option value="">Select...</option>
                                    {tracks.filter(t => profile.tracks.includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary w-full">Create Class</button>
                        </form>
                    </div>

                    <div className="glass-panel">
                        <h3>My Classes & Enrollments</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                            {classes.length === 0 ? (
                                <p className="text-secondary">You haven't created any classes yet.</p>
                            ) : (
                                classes.map(cls => (
                                    <div key={cls.id} className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h4>{cls.name}</h4>
                                                <p className="text-accent" style={{ fontSize: '0.8rem' }}>{cls.grade_level}</p>
                                            </div>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setManagingClassEnrollment(managingClassEnrollment === cls.id ? null : cls.id)}>
                                                {managingClassEnrollment === cls.id ? 'Close' : 'Enroll Students'}
                                            </button>
                                        </div>

                                        {managingClassEnrollment === cls.id && (
                                            <div className="mb-4 p-4" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                                <h5>Enroll a Student</h5>
                                                <div className="flex gap-2 mt-2">
                                                    <select className="w-full" value={selectedStudentForEnroll} onChange={e => setSelectedStudentForEnroll(e.target.value)}>
                                                        <option value="">Select a student...</option>
                                                        {students.map(s => <option key={s.id} value={s.id}>{s.full_name} (@{s.username})</option>)}
                                                    </select>
                                                    <button className="btn btn-success" onClick={() => handleEnrollStudent(cls.id)}>Enroll</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-2">
                                            <p className="text-secondary mb-2" style={{ fontSize: '0.85rem' }}>Currently Enrolled:</p>
                                            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                                {enrollments.filter(e => e.class_group === cls.id).length > 0 ? (
                                                    enrollments.filter(e => e.class_group === cls.id).map(e => (
                                                        <span key={e.id} className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                                                            {e.student_name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>No students enrolled yet.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
