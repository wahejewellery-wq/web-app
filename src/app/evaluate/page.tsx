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
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [estimation, setEstimation] = useState(null);

    // Form State
    const [details, setDetails] = useState({
        category: 'ring',
        karat: '22',
        hasGemstones: 'no',
        metalType: 'yellow',
        gemstoneType: 'natural',
    });

    const categories = [
        { id: 'ring', label: 'Ring', emoji: '💍', image: '/categories/ring.jpg' },
        { id: 'necklace', label: 'Necklace', emoji: '📿', image: '/categories/necklace.jpg' },
        { id: 'earring', label: 'Earring', emoji: '👂', image: '/categories/earring.jpg' },
        { id: 'bangle', label: 'Bangle', emoji: '⭕', image: '/categories/bangle.jpg' },
    ];

    const purities = [
        { value: '22', label: '22K (91.6%)' },
        { value: '18', label: '18K (75.0%)' },
        { value: '14', label: '14K (58.5%)' },
        { value: '9', label: '9K (37.5%)' },
    ];

    const handleNext = async () => {
        if (step === 1) {
            // New Step 1: Category Selection (always has default or user selected)
            setStep(2);
        } else if (step === 2 && file) {
            // New Step 2: Image Upload
            setStep(3);
        } else if (step === 3) {
            setStep(4);
        } else if (step === 4) {
            setLoading(true);
            setError(null);
            try {
                // Prepare FormData for API
                const formData = new FormData();
                if (documentFile) formData.append('document', documentFile); // Optionally send doc
                if (file) formData.append('image', file);
                formData.append('category', details.category);
                formData.append('purity', details.karat);

                // Send directly to backend to avoid Vercel 10s timeout and 4.5MB payload limit
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/predict`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Backend API Error:", response.status, errorText);
                    setError(`Server Error (${response.status}): The AI backend took too long to wake up. Please try again!`);
                    setLoading(false);
                    return;
                }

                let result;
                try {
                    result = await response.json();
                } catch (e) {
                    console.error("Failed to parse response", e);
                    throw new Error("Invalid response from server");
                }

                if (result && result.success && result.data) {
                    // Extract data from backend
                    const { gold_weight, diamond_weight } = result.data;
                    const goldWeight = gold_weight || 0;
                    let diamondWeight = diamond_weight || 0;

                    if (details.hasGemstones === 'no') {
                        diamondWeight = 0;
                    }

                    // Valuation Logic (same as old /api/estimate)
                    let CURRENT_GOLD_PRICE_PER_GRAM_24K = 7500; // Approx Market Rate
                    const DIAMOND_PRICE_PER_CT = 35000;

                    try {
                        const goldRes = await fetch('https://api.metalpriceapi.com/v1/latest?api_key=1298ec43bbdc40f5047ef3354b07a56f&base=INR&currencies=XAU');
                        if (goldRes.ok) {
                            const goldData = await goldRes.json();
                            if (goldData && goldData.success && goldData.rates && goldData.rates.XAU) {
                                // rates.XAU represents amount of XAU for 1 INR. Invert to get INR per XAU (Ounce)
                                const pricePerOunceINR = 1 / goldData.rates.XAU;
                                // Convert price per Troy Ounce to price per Gram
                                const pricePerGramINR = pricePerOunceINR / 31.1034768;
                                CURRENT_GOLD_PRICE_PER_GRAM_24K = pricePerGramINR;
                            }
                        }
                    } catch (err) {
                        console.error("Failed to fetch live gold rate:", err);
                    }

                    const purityFactor = parseInt(details.karat) / 24;
                    const goldValue = goldWeight * CURRENT_GOLD_PRICE_PER_GRAM_24K * purityFactor;
                    const stoneValue = diamondWeight * DIAMOND_PRICE_PER_CT;
                    const totalValue = goldValue + stoneValue;

                    setEstimation({
                        estimated_value: Math.round(totalValue || 0),
                        gold_weight: goldWeight,
                        diamond_weight: diamondWeight,
                        breakdown: {
                            gold_value: Math.round(goldValue),
                            stone_value: Math.round(stoneValue)
                        },
                        currency: 'INR'
                    } as any);
                    setStep(5);
                } else {
                    console.error("Estimation failed:", result);
                    setError(result.error || "Estimation failed. Please try again.");
                }
            } catch (error) {
                console.error("Estimation request failed", error);
                setError("Network error: The backend might be starting up from sleep. Please click Analyze again.");
            } finally {
                setLoading(false);
            }
        }
    };

    const getBase64 = (f: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSaveToPortfolio = async () => {
        if (!estimation) return;

        const titleText = `${(details.category as string).charAt(0).toUpperCase() + (details.category as string).slice(1)} (${details.karat}K)`;

        let imageToSave = 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop';
        if (file) {
            try {
                imageToSave = await getBase64(file);
            } catch (err) {
                console.error("Failed to convert image to base64", err);
            }
        }

        const token = Cookies.get('token');
        if (token) {
            // Save to Backend API
            try {
                await api.post('/evaluations/', {
                    title: titleText,
                    category: details.category,
                    purity: details.karat,
                    gold_weight: (estimation as any).gold_weight.toString(),
                    diamond_weight: (estimation as any).diamond_weight?.toString() || null,
                    estimated_value: (estimation as any).estimated_value,
                    image_url: imageToSave
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
                weight: `${(estimation as any).gold_weight}g`, // Legacy
                gold_weight: (estimation as any).gold_weight.toString(),
                diamond_weight: (estimation as any).diamond_weight?.toString() || null,
                value: (estimation as any).estimated_value,
                image: imageToSave
            };

            saveItem(newItem);
            router.push('/dashboard');
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
                    {step === 5 ? 'Valuation Result' : 'AI Evaluation'}
                </h1>
                <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 300 }}>
                    {step === 5 ? 'Here is our detailed AI analysis.' : 'Discover the true value of your item'}
                </p>
            </div>

            {/* Form Container */}
            <div style={{ flex: 1, padding: '0 1.5rem 3rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>

                {/* Progress Indicators (Variant 1 style, dots with connecting lines) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', backgroundColor: '#f1f5f9', zIndex: 0, transform: 'translateY(-50%)' }}></div>
                    {[1, 2, 3, 4, 5].map((s) => (
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
                                {s === 4 && 'Docs'}
                                {s === 5 && 'Result'}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', padding: '2rem' }}>
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ color: '#0f172a', fontSize: '1.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', lineHeight: 1.25, paddingBottom: '0.5rem', paddingTop: '1rem' }}>Select Category</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Step 1 of 5: What type of item is this?</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setDetails({ ...details, category: cat.id })}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            padding: '1rem',
                                            height: '140px',
                                            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%), url(${cat.image})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            color: '#ffffff',
                                            border: `2px solid ${details.category === cat.id ? '#dfb755' : 'transparent'}`,
                                            borderRadius: '0.75rem',
                                            cursor: 'pointer',
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            transition: 'all 0.2s',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            boxShadow: details.category === cat.id ? '0 0 0 2px #fff inset, 0 4px 12px rgba(223, 183, 85, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
                                            transform: details.category === cat.id ? 'scale(1.02)' : 'scale(1)'
                                        }}
                                    >
                                        <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 10 }}>{cat.label}</span>
                                        {details.category === cat.id && (
                                            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '1.75rem', height: '1.75rem', backgroundColor: '#dfb755', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>✓</div>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-sans)', lineHeight: 1.25 }}>Jewelry valuation</h3>
                                <button style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }} aria-label="Close">✕</button>
                            </div>

                            <h2 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>Upload photos</h2>
                            <p style={{ color: '#334155', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                                Instantly value your piece. Add clear photos for the best result.
                            </p>

                            <div style={{ marginBottom: '1rem' }}>
                                <FileUpload onFileSelect={(f) => setFile(f)} />
                            </div>

                            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
                                The more photos you add, the more accurate your estimation will be.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                                <button
                                    onClick={handleNext}
                                    disabled={!file}
                                    style={{
                                        backgroundColor: file ? '#dfb755' : '#e2e8f0',
                                        color: file ? '#0f172a' : '#94a3b8',
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: '1.5rem',
                                        fontWeight: 500,
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        border: 'none',
                                        cursor: file ? 'pointer' : 'not-allowed',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    Continue <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>→</span>
                                </button>
                            </div>

                            <div>
                                <h4 style={{ color: '#1e293b', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1rem' }}>Tips for best results:</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                    {[
                                        { title: 'Use light background', img: 'https://images.unsplash.com/photo-1627225924765-552d49cf4e52?q=80&w=200&auto=format&fit=crop' },
                                        { title: 'Provide clear close-up shots', img: 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=200&auto=format&fit=crop' },
                                        { title: 'Include scale', img: 'https://images.unsplash.com/photo-1611082181513-583eb587db21?q=80&w=200&auto=format&fit=crop' },
                                        { title: 'Close-up of clasp', img: 'https://images.unsplash.com/photo-1515562141207-7a8efebd3473?q=80&w=200&auto=format&fit=crop' }
                                    ].map((tip, i) => (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '0.375rem', paddingBottom: '0.75rem' }}>
                                            <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '0.375rem', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                                <img src={tip.img} alt={tip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: '#0f172a', fontWeight: 500, lineHeight: 1.2, textAlign: 'left' }}>{tip.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ color: '#0f172a', fontSize: '1.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', lineHeight: 1.25, paddingBottom: '0.5rem', paddingTop: '1rem' }}>Piece Details</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Step 3 of 5: Enter known specifics</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>

                                {/* Metal Only or Gemstones */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type of Jewelry</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button onClick={() => setDetails({ ...details, hasGemstones: 'no' })} style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${details.hasGemstones === 'no' ? '#dfb755' : '#e2e8f0'}`, backgroundColor: details.hasGemstones === 'no' ? '#fefce8' : '#fff', cursor: 'pointer', textAlign: 'center', fontWeight: 500, color: '#0f172a', transition: 'all 0.2s' }}>Metal Only</button>
                                        <button onClick={() => setDetails({ ...details, hasGemstones: 'yes' })} style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${details.hasGemstones === 'yes' ? '#dfb755' : '#e2e8f0'}`, backgroundColor: details.hasGemstones === 'yes' ? '#fefce8' : '#fff', cursor: 'pointer', textAlign: 'center', fontWeight: 500, color: '#0f172a', transition: 'all 0.2s' }}>With Gemstones</button>
                                    </div>
                                </div>

                                {/* Metal Type */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What kind of metal?</label>
                                    <select style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', height: '3.5rem', padding: '0 1rem', outline: 'none', appearance: 'none', color: '#0f172a', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }} value={details.metalType} onChange={(e) => setDetails({ ...details, metalType: e.target.value })}>
                                        <option value="yellow">Yellow Gold</option>
                                        <option value="rose">Rose Gold</option>
                                        <option value="white">White Gold</option>
                                    </select>
                                </div>

                                {/* Karat */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Karat</label>
                                    <select style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', height: '3.5rem', padding: '0 1rem', outline: 'none', appearance: 'none', color: '#0f172a', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }} value={details.karat} onChange={(e) => setDetails({ ...details, karat: e.target.value })}>
                                        {purities.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Gemstones (if applicable) */}
                                {details.hasGemstones === 'yes' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <label style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gemstones Quality</label>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button onClick={() => setDetails({ ...details, gemstoneType: 'natural' })} style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${details.gemstoneType === 'natural' ? '#dfb755' : '#e2e8f0'}`, backgroundColor: details.gemstoneType === 'natural' ? '#fefce8' : '#fff', cursor: 'pointer', textAlign: 'center', fontWeight: 500, color: '#0f172a', transition: 'all 0.2s' }}>Natural</button>
                                            <button onClick={() => setDetails({ ...details, gemstoneType: 'lab_grown' })} style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${details.gemstoneType === 'lab_grown' ? '#dfb755' : '#e2e8f0'}`, backgroundColor: details.gemstoneType === 'lab_grown' ? '#fefce8' : '#fff', cursor: 'pointer', textAlign: 'center', fontWeight: 500, color: '#0f172a', transition: 'all 0.2s' }}>Lab Grown</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={handleNext} style={{ width: '100%', backgroundColor: '#0f172a', color: '#ffffff', height: '3.5rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none' }}>
                                Continue →
                            </button>
                        </div>
                    )}

                    {step === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ color: '#0f172a', fontSize: '1.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', lineHeight: 1.25, paddingBottom: '0.5rem', paddingTop: '1rem' }}>Supporting Documents</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Step 4 of 5: Additional Info (Optional)</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upload Receipts or Certificates</label>
                                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.5rem' }}>For example: BSI certificate, original purchase receipt to enhance valuation accuracy. (Optional)</p>
                                    <FileUpload onFileSelect={(f) => setDocumentFile(f)} />
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

                    {step === 5 && estimation && (
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
                                    <span style={{ color: '#64748b' }}>Predicted Metal Weight</span>
                                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{(estimation as any).gold_weight} g</span>
                                </div>
                                {details.hasGemstones === 'yes' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                                        <span style={{ color: '#64748b' }}>Predicted Diamond Weight</span>
                                        <span style={{ color: '#0f172a', fontWeight: 500 }}>{(estimation as any).diamond_weight} ct</span>
                                    </div>
                                )}

                                <h3 style={{ marginTop: '1rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 600, fontSize: '1.125rem' }}>Valuation Breakdown</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#64748b' }}>Metal Value ({details.karat}K {details.metalType.charAt(0).toUpperCase() + details.metalType.slice(1)} Gold)</span>
                                    <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{((estimation as any).breakdown.gold_value || 0).toLocaleString('en-IN')}</span>
                                </div>
                                {details.hasGemstones === 'yes' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                        <span style={{ color: '#64748b' }}>Diamond Value ({details.gemstoneType === 'natural' ? 'Natural' : 'Lab Grown'})</span>
                                        <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{((estimation as any).breakdown.stone_value || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                )}
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
                                <button onClick={() => alert('Selling with Wahe feature coming soon!')} style={{
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
                                    Sell with Wahe
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
