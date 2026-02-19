"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FileUpload from '@/components/FileUpload';
import { saveItem } from '@/lib/storage';

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

    const handleSaveToPortfolio = () => {
        if (!estimation) return;

        const newItem = {
            id: Date.now().toString(),
            title: `${(details.category as string).charAt(0).toUpperCase() + (details.category as string).slice(1)} (${details.karat}K)`,
            date: new Date().toISOString().split('T')[0],
            weight: `${(estimation as any).gold_weight}g`,
            value: (estimation as any).estimated_value,
            image: file ? URL.createObjectURL(file) : 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop'
        };

        saveItem(newItem);
        router.push('/portfolio');
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                {step === 4 ? 'Valuation Result' : 'Get Your Estimate'}
            </h1>

            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                {[1, 2, 3, 4].map((s) => (
                    <div
                        key={s}
                        style={{
                            flex: 1,
                            height: '4px',
                            background: s <= step ? 'var(--color-gold-primary)' : 'var(--color-border)',
                            borderRadius: '2px',
                            transition: 'background 0.3s'
                        }}
                    />
                ))}
            </div>

            <Card>
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--color-text-main)' }}>
                            Step 1: Select Category
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setDetails({ ...details, category: cat.id })}
                                    style={{
                                        padding: '1.5rem',
                                        background: details.category === cat.id ? 'var(--color-gold-primary)' : '#2A2A2A',
                                        color: details.category === cat.id ? 'black' : 'white',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '1.1rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>{cat.emoji}</span>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        <Button onClick={handleNext} fullWidth>
                            Next: Upload Photo
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                            Step 2: Upload Photo
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            Upload a clear image of your jewellery.
                        </p>

                        <FileUpload onFileSelect={(f) => setFile(f)} />

                        <div style={{ marginTop: '2rem' }}>
                            <Button
                                onClick={handleNext}
                                disabled={!file}
                                fullWidth
                            >
                                Next: Enter Purity
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--color-text-main)' }}>
                            Step 3: Enter Purity
                        </h2>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Gold Purity</label>
                            <select
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: '#2A2A2A',
                                    border: '1px solid var(--color-border)',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                                value={details.karat}
                                onChange={(e) => setDetails({ ...details, karat: e.target.value })}
                            >
                                {purities.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <Button onClick={handleNext} disabled={loading} fullWidth>
                            {loading ? 'Analyzing & Valuing...' : 'Get Valuation'}
                        </Button>
                        {error && (
                            <p style={{ color: '#ff4444', marginTop: '1rem', textAlign: 'center', background: 'rgba(255,0,0,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                                {error}
                            </p>
                        )}
                    </div>
                )}

                {step === 4 && estimation && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🎊</span>
                            <h2 style={{ fontSize: '2rem', color: 'var(--color-gold-primary)' }}>
                                ₹{((estimation as any).estimated_value || 0).toLocaleString('en-IN')}
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)' }}>Total Estimated Value</p>
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            textAlign: 'left',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-gold-light)' }}>AI Analysis Results</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Predicted Gold Weight:</span>
                                <span>{(estimation as any).gold_weight} g (approx)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Predicted Diamond Weight:</span>
                                <span>{(estimation as any).diamond_weight} ct (approx)</span>
                            </div>

                            <h3 style={{ marginTop: '1rem', marginBottom: '1rem', color: 'var(--color-gold-light)' }}>Valuation Breakdown</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Gold Value ({details.karat}K):</span>
                                <span>₹{((estimation as any).breakdown.gold_value || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Diamond Value:</span>
                                <span>₹{((estimation as any).breakdown.stone_value || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <Button fullWidth onClick={handleSaveToPortfolio}>
                            Save to Portfolio
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
