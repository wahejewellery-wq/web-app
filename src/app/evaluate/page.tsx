"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FileUpload from '@/components/FileUpload';
import { saveItem } from '@/lib/storage';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

export default function EvaluatePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [estimation, setEstimation] = useState(null);

    // Form State
    const [details, setDetails] = useState({
        category: 'ring',
        karat: '22',
    });

    const categories = [
        { id: 'ring', label: 'Ring', emoji: '💍' },
        { id: 'necklace', label: 'Necklace', emoji: '📿' },
        { id: 'earring', label: 'Earring', emoji: '👂' },
        { id: 'bangle', label: 'Bangle', emoji: '⭕' },
    ];

    const purities = [
        { value: '24', label: '24K (99.9%)' },
        { value: '22', label: '22K (91.6%)' },
        { value: '18', label: '18K (75.0%)' },
        { value: '14', label: '14K (58.5%)' },
    ];

    const handleNext = async () => {
        if (step === 1) {
            // New Step 1: Category Selection (always has default or user selected)
            setStep(2);
        } else if (step === 2 && file) {
            // New Step 2: Image Upload
            setStep(3);
        } else if (step === 3) {
            setLoading(true);
            setError(null);
            try {
                // Prepare FormData for API
                const formData = new FormData();
                if (file) formData.append('image', file);
                formData.append('category', details.category);
                formData.append('purity', details.karat);

                const response = await fetch('/api/estimate', {
                    method: 'POST',
                    body: formData,
                });

                let result;
                try {
                    result = await response.json();
                } catch (e) {
                    console.error("Failed to parse response", e);
                    throw new Error("Invalid response from server");
                }

                if (result.success) {
                    setEstimation(result.data);
                    setStep(4);
                } else {
                    console.error("Estimation failed:", result.error);
                    setError(result.error || "Estimation failed. Please try again.");
                }
            } catch (error) {
                console.error("Estimation request failed", error);
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSaveToPortfolio = async () => {
        if (!estimation) return;

        const titleText = `${(details.category as string).charAt(0).toUpperCase() + (details.category as string).slice(1)} (${details.karat}K)`;
        const imageSrc = file ? URL.createObjectURL(file) : 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop';

        const token = Cookies.get('token');
        if (token) {
            // Save to Backend API
            try {
                // Determine image url mapping for backend. 
                // Note: file blob urls won't work across sessions, in a real app this should be a CDN link uploaded during step 2.
                // We'll pass the base64 or null.
                let imageUrlToSave = imageSrc;
                if (imageSrc.startsWith('blob:')) {
                    imageUrlToSave = ''; // Or handling base64, but keeping empty for now per schema
                }

                await api.post('/evaluations/', {
                    title: titleText,
                    category: details.category,
                    purity: details.karat,
                    gold_weight: `${(estimation as any).gold_weight}g`,
                    estimated_value: (estimation as any).estimated_value,
                    image_url: imageUrlToSave || null
                });
                router.push('/dashboard');
            } catch (err) {
                console.error("Failed to save to backend", err);
                setError("Failed to save evaluation to your account.");
            }
        } else {
            // Guest mode -> save to LocalStorage
            const newItem = {
                id: Date.now().toString(),
                title: titleText,
                date: new Date().toISOString().split('T')[0],
                weight: `${(estimation as any).gold_weight}g`,
                value: (estimation as any).estimated_value,
                image: imageSrc
            };

            saveItem(newItem);
            router.push('/dashboard');
            // the new dashboard page replaces portfolio. Even without a token, Nextjs router redirect in dashboard page handles guest bounce. 
            // Wait, we need to consider if guest can view portfolio. Earlier they could. Let's let them go to dashboard and the dashboard page handles the view.
        }
    };

    return (
        <div style={{ backgroundColor: '#ffffff', color: '#0f172a', minHeight: '100vh', width: '100vw', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>

            {/* Header Area */}
            <div style={{ padding: '3rem 1.5rem 2rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(237, 188, 29, 0.1)',
                        color: '#edbc1d'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>✨</span>
                    </div>
                </div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', fontWeight: 300, color: '#0f172a', marginBottom: '0.5rem' }}>
                    {step === 4 ? 'Valuation Result' : 'AI Evaluation'}
                </h1>
                <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 300 }}>
                    {step === 4 ? 'Here is our detailed AI analysis.' : 'Discover the true value of your item'}
                </p>
            </div>

            {/* Form Container */}
            <div style={{ flex: 1, padding: '0 1.5rem 3rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>

                {/* Progress Indicators (Variant 1 style, dots with connecting lines) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', backgroundColor: '#f1f5f9', zIndex: 0, transform: 'translateY(-50%)' }}></div>
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1, backgroundColor: '#ffffff', padding: '0 0.5rem' }}>
                            <div style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '9999px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                backgroundColor: s === step ? '#0f172a' : (s < step ? '#10b981' : '#f8fafc'),
                                color: s === step ? '#ffffff' : (s < step ? '#ffffff' : '#94a3b8'),
                                border: s > step ? '1px solid #e2e8f0' : 'none',
                                transition: 'all 0.3s'
                            }}>
                                {s < step ? '✓' : s}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: s === step ? '#0f172a' : '#94a3b8', fontWeight: s === step ? 600 : 400 }}>
                                {s === 1 && 'Type'}
                                {s === 2 && 'Photo'}
                                {s === 3 && 'Details'}
                                {s === 4 && 'Result'}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', padding: '2rem' }}>
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ color: '#0f172a', fontSize: '1.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', lineHeight: 1.25, paddingBottom: '0.5rem', paddingTop: '1rem' }}>Select Category</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Step 1 of 4: What type of item is this?</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setDetails({ ...details, category: cat.id })}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem 1.5rem',
                                            backgroundColor: details.category === cat.id ? 'rgba(237, 188, 29, 0.1)' : '#ffffff',
                                            color: '#0f172a',
                                            border: `1px solid ${details.category === cat.id ? '#edbc1d' : '#e2e8f0'}`,
                                            borderRadius: '0.75rem',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                            transition: 'all 0.2s',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.5rem' }}>{cat.emoji}</span>
                                        <span>{cat.label}</span>
                                        {details.category === cat.id && (
                                            <span style={{ marginLeft: 'auto', color: '#edbc1d' }}>✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <button onClick={handleNext} style={{
                                    width: '100%',
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    height: '3.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    letterSpacing: '0.025em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'opacity 0.2s',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}>
                                    <span>Continue</span>
                                    <span style={{ fontSize: '1.25rem' }}>→</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ color: '#0f172a', fontSize: '1.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', lineHeight: 1.25, paddingBottom: '0.5rem', paddingTop: '1rem' }}>Upload Photo</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Step 2 of 4: Document your item</p>

                            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '2rem' }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    borderRadius: '0.75rem',
                                    border: '2px dashed rgba(237, 188, 29, 0.3)',
                                    backgroundColor: 'rgba(237, 188, 29, 0.05)',
                                    padding: '4rem 1.5rem',
                                    transition: 'background-color 0.2s',
                                    cursor: 'pointer'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ backgroundColor: 'rgba(237, 188, 29, 0.2)', padding: '1rem', borderRadius: '9999px' }}>
                                            <span style={{ color: '#edbc1d', fontSize: '2.5rem' }}>📷</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', maxWidth: '280px' }}>
                                            <p style={{ color: '#0f172a', fontSize: '1.125rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.25 }}>Tap to upload</p>
                                            <p style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.5 }}>Upload a clear high-resolution photo for precise AI analysis</p>
                                        </div>
                                    </div>
                                    <div style={{ width: '100%' }}>
                                        <FileUpload onFileSelect={(f) => setFile(f)} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <button
                                    onClick={handleNext}
                                    disabled={!file}
                                    style={{
                                        width: '100%',
                                        backgroundColor: file ? '#0f172a' : '#94a3b8',
                                        color: '#ffffff',
                                        height: '3.5rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        letterSpacing: '0.025em',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'background-color 0.2s',
                                        border: 'none',
                                        cursor: file ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <span>Continue</span>
                                    <span style={{ fontSize: '1.25rem' }}>→</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ color: '#0f172a', fontSize: '1.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', lineHeight: 1.25, paddingBottom: '0.5rem', paddingTop: '1rem' }}>Piece Details</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Step 3 of 4: Enter known specifics</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gold Purity / Karat</label>
                                    <select
                                        style={{
                                            width: '100%',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #e2e8f0',
                                            backgroundColor: '#ffffff',
                                            height: '3.5rem',
                                            padding: '0 1rem',
                                            color: '#0f172a',
                                            outline: 'none',
                                            fontSize: '1rem',
                                            appearance: 'none',
                                            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 1rem top 50%',
                                            backgroundSize: '0.65rem auto'
                                        }}
                                        value={details.karat}
                                        onChange={(e) => setDetails({ ...details, karat: e.target.value })}
                                    >
                                        {purities.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <button
                                    onClick={handleNext}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#0f172a',
                                        color: '#ffffff',
                                        height: '3.5rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        letterSpacing: '0.025em',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'opacity 0.2s',
                                        border: 'none',
                                        cursor: loading ? 'wait' : 'pointer',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    <span>{loading ? 'Analyzing...' : 'Analyze'}</span>
                                    {!loading && <span style={{ fontSize: '1.25rem' }}>✨</span>}
                                </button>
                                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '1rem' }}>
                                    AI analysis typically takes 5-10 seconds to process your high-resolution images.
                                </p>
                                {error && (
                                    <p style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center', backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                                        {error}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 4 && estimation && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎊</span>
                                <h2 style={{ fontSize: '2.5rem', color: '#edbc1d', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>
                                    ₹{((estimation as any).estimated_value || 0).toLocaleString('en-IN')}
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Estimated Value</p>
                            </div>

                            <div style={{
                                backgroundColor: '#f8fafc',
                                padding: '1.5rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #e2e8f0',
                                marginBottom: '2rem'
                            }}>
                                <h3 style={{ marginBottom: '1rem', color: '#0f172a', fontWeight: 600, fontSize: '1.125rem' }}>AI Analysis Results</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#64748b' }}>Predicted Gold Weight</span>
                                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{(estimation as any).gold_weight} g</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#64748b' }}>Predicted Diamond Weight</span>
                                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{(estimation as any).diamond_weight} ct</span>
                                </div>

                                <h3 style={{ marginTop: '1rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 600, fontSize: '1.125rem' }}>Valuation Breakdown</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#64748b' }}>Gold Value ({details.karat}K)</span>
                                    <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{((estimation as any).breakdown.gold_value || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#64748b' }}>Diamond Value</span>
                                    <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{((estimation as any).breakdown.stone_value || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button onClick={handleSaveToPortfolio} style={{
                                    width: '100%',
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    height: '3.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    letterSpacing: '0.025em',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}>
                                    Save to Portfolio
                                </button>
                                <button onClick={() => alert('Selling with Luxe feature coming soon!')} style={{
                                    width: '100%',
                                    backgroundColor: 'transparent',
                                    color: '#edbc1d',
                                    border: '1px solid #edbc1d',
                                    height: '3.5rem',
                                    borderRadius: '0.5rem',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    letterSpacing: '0.025em',
                                    cursor: 'pointer'
                                }}>
                                    Sell with Luxe
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
