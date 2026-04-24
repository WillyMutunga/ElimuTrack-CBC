import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const ExamPortal = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [assessment, setAssessment] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    
    const [session, setSession] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isStarted, setIsStarted] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        fetchAssessment();
    }, [id]);

    const fetchAssessment = async () => {
        try {
            const res = await api.get(`assessments/${id}/`);
            setAssessment(res.data);
            if (res.data.questions) {
                setQuestions(res.data.questions);
            }
        } catch (error) { console.error("Failed to fetch assessment", error); }
    };

    useEffect(() => {
        let timer;
        if (isStarted && !isSubmitted && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isStarted && !isSubmitted) {
            handleSubmitExam();
        }
        return () => clearInterval(timer);
    }, [isStarted, isSubmitted, timeLeft]);

    const handleStartExam = async () => {
        // Calculate end time
        const durationSeconds = (assessment.time_limit_minutes || 60) * 60;
        setTimeLeft(durationSeconds);
        setIsStarted(true);

        try {
            const res = await api.post('exam-sessions/', {
                student: user.id,
                assessment: assessment.id,
                end_time: new Date(Date.now() + durationSeconds * 1000).toISOString()
            });
            setSession(res.data);
        } catch (error) { console.error("Failed to create session", error); }
    };

    const handleSubmitExam = async () => {
        setIsSubmitted(true);
        try {
            // Create assessment submission
            await api.post('assessment-submissions/', {
                student: user.id,
                assessment: assessment.id,
                answers: answers,
                status: 'DRAFT' // Initially draft until teacher grades it
            });

            if (session) {
                await api.patch(`exam-sessions/${session.id}/`, { is_submitted: true });
            }
            alert("Exam submitted successfully!");
            navigate('/dashboard');
        } catch (error) { 
            console.error("Failed to submit exam", error);
            alert("An error occurred while submitting. Please try again.");
            setIsSubmitted(false);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    if (!assessment) return <div className="app-container"><p>Loading...</p></div>;

    if (!isStarted) {
        return (
            <div className="app-container flex" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="glass-panel text-center" style={{ maxWidth: '600px' }}>
                    <h2 className="mb-4">{assessment.title}</h2>
                    <p className="text-secondary mb-2">Duration: {assessment.time_limit_minutes} minutes</p>
                    <div style={{ background: 'var(--danger)', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
                        <strong>Warning:</strong> Once started, the timer cannot be paused or undone. The exam will automatically submit when time is up.
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={handleStartExam}>Start Exam Now</button>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return <div className="app-container"><p>Exam submitted. Redirecting...</p></div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="app-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <header className="flex justify-between items-center mb-4 p-4 glass-panel" style={{ position: 'sticky', top: '16px', zIndex: 10 }}>
                <h3 style={{ margin: 0 }}>{assessment.title}</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft < 300 ? 'var(--danger)' : 'var(--success)' }}>
                    {formatTime(timeLeft)}
                </div>
            </header>

            {questions.length === 0 ? (
                <div className="glass-panel text-center">
                    <p className="text-secondary">This exam has no questions mapped yet.</p>
                    <button className="btn btn-primary mt-4" onClick={handleSubmitExam}>Finish Exam</button>
                </div>
            ) : (
                <div className="glass-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                        <span className="text-secondary" style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <h2 className="mt-2" style={{ fontSize: '1.5rem' }}>{currentQuestion?.text || "Question text..."}</h2>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label className="text-secondary mb-2">Writing Pad:</label>
                        <textarea 
                            style={{ flex: 1, minHeight: '200px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff', fontSize: '1rem', resize: 'vertical' }}
                            placeholder="Type your answer here..."
                            value={answers[currentQuestion?.id] || ''}
                            onChange={(e) => setAnswers({...answers, [currentQuestion?.id]: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <button className="btn btn-secondary" onClick={handlePrev} disabled={currentQuestionIndex === 0}>Previous</button>
                        
                        {currentQuestionIndex === questions.length - 1 ? (
                            <button className="btn btn-success" onClick={handleSubmitExam}>Submit Exam</button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleNext}>Next Question</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamPortal;
