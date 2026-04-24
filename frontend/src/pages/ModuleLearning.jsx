import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const ModuleLearning = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [module, setModule] = useState(null);
    const [contents, setContents] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    
    const sectionRefs = useRef([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const modRes = await api.get(`modules/${moduleId}/`);
                setModule(modRes.data);
                
                // Sort contents to ensure logical flow
                const sorted = modRes.data.contents.sort((a, b) => a.id - b.id);
                setContents(sorted);

                // Check overall module completion if needed
                // For simplicity, we'll track progress in this session
            } catch (err) {
                console.error("Failed to fetch module data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [moduleId]);

    // Scroll-Spy Logic using Intersection Observer
    useEffect(() => {
        if (contents.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5 // 50% visibility
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = parseInt(entry.target.getAttribute('data-index'));
                    setActiveIndex(index);

                    // Persistence: If this is the final section, mark lesson as completed
                    if (index === contents.length - 1 && !isCompleted) {
                        handleMarkModuleCompleted();
                    }
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        
        // Observe all sections
        sectionRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [contents, isCompleted]);

    const handleMarkModuleCompleted = async () => {
        try {
            // Send background PATCH/POST to mark lesson as completed
            // Assuming endpoint for entire module completion or final content progress
            const finalContentId = contents[contents.length - 1].id;
            await api.post('progress/', {
                content: finalContentId,
                is_completed: true
            });
            setIsCompleted(true);
            console.log("Lesson marked as completed in database.");
        } catch (err) {
            console.error("Failed to mark completion:", err);
        }
    };

    if (loading) return <div className="app-container">Loading Modular Lesson...</div>;
    if (!module) return <div className="app-container">Module not found.</div>;

    const progressPercentage = contents.length > 0 
        ? Math.round(((activeIndex + 1) / contents.length) * 100) 
        : 0;

    return (
        <div className="animate-fade-in" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
            {/* Sticky Progress Bar */}
            <div style={{ 
                position: 'sticky', top: 0, left: 0, right: 0, zIndex: 1000,
                background: 'rgba(15, 17, 26, 0.8)', backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--glass-border)', padding: '12px 24px'
            }}>
                <div className="app-container" style={{ padding: 0 }}>
                    <div className="flex justify-between items-center mb-2">
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{module.title}</span>
                        <span className="text-accent" style={{ fontWeight: 700 }}>{progressPercentage}% Completed</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${progressPercentage}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, var(--accent-tertiary), var(--accent-primary))',
                            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                </div>
            </div>

            <div className="app-container" style={{ maxWidth: '900px', paddingTop: '40px' }}>
                <button className="btn btn-secondary mb-8" onClick={() => navigate('/dashboard')}>
                    ← Exit to Dashboard
                </button>

                {contents.length === 0 ? (
                    <div className="glass-panel text-center py-20 text-secondary">
                        This module has no content yet.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '100px' }}>
                        {contents.map((content, index) => (
                            <section 
                                key={content.id}
                                data-index={index}
                                ref={el => sectionRefs.current[index] = el}
                                style={{
                                    opacity: activeIndex === index ? 1 : 0.3,
                                    transform: activeIndex === index ? 'scale(1)' : 'scale(0.98)',
                                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                    scrollMarginTop: '100px'
                                }}
                            >
                                <div className="glass-panel" style={{ 
                                    padding: '40px', 
                                    borderLeft: activeIndex === index ? '4px solid var(--accent-primary)' : '4px solid transparent',
                                    boxShadow: activeIndex === index ? 'var(--glass-shadow)' : 'none'
                                }}>
                                    <h4 className="text-secondary mb-2" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                                        Section {index + 1}
                                    </h4>
                                    <h2 className="mb-6">{content.title}</h2>

                                    <div className="content-render" style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
                                        {content.content_type === 'VIDEO' ? (
                                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎥</div>
                                                <p>Video Lesson Available</p>
                                                <a href={content.external_link} target="_blank" rel="noreferrer" className="btn btn-primary mt-4">Watch Presentation</a>
                                            </div>
                                        ) : content.content_type === 'TEXT' ? (
                                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                                {content.text_content}
                                            </div>
                                        ) : content.content_type === 'PDF' ? (
                                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
                                                <p>Download Study Materials</p>
                                                <a href={content.file} target="_blank" rel="noreferrer" className="btn btn-primary mt-4">Download PDF</a>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center' }}>
                                                <p>External Resource:</p>
                                                <a href={content.external_link} target="_blank" rel="noreferrer" className="text-accent">{content.external_link}</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Completion Banner */}
            {isCompleted && (
                <div style={{ 
                    position: 'fixed', bottom: 0, left: 0, right: 0, 
                    background: 'var(--success)', color: '#000', 
                    padding: '12px', textAlign: 'center', fontWeight: 700,
                    zIndex: 1001, animation: 'fadeIn 0.5s ease'
                }}>
                    ✨ Congratulations! You have completed the "{module.title}" module.
                </div>
            )}
        </div>
    );
};

export default ModuleLearning;
