"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import { getItems, clearItems, deleteItem } from '@/lib/storage';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface User {
    id: number;
    phone_number: string;
    full_name: string | null;
    email: string | null;
    created_at: string;
}

interface Evaluation {
    id: number;
    title: string;
    category: string;
    purity: string;
    gold_weight: string;
    diamond_weight: string | null;
    estimated_value: number;
    image_url: string | null;
    created_at: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
    const [activeFilter, setActiveFilter] = useState<'Tracking' | 'Selling' | 'Sold'>('Tracking');
    const [historySpan, setHistorySpan] = useState<'6M' | '1Y' | '3Y'>('6M');
    const [portfolioHistorySpan, setPortfolioHistorySpan] = useState<'6M' | '1Y' | '3Y'>('6M');
    const [marketPrices, setMarketPrices] = useState<{ gold_24k: number; gold_22k: number } | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = Cookies.get('token');
                if (!token) {
                    const localItems = getItems();
                    setEvaluations(localItems.map((item, index) => ({
                        id: parseInt(item.id) || index,
                        title: item.title,
                        category: item.title.split(' ')[0],
                        purity: item.title.includes('K') ? item.title.match(/(\d+)K/)?.[1] || 'Unknown' : 'Unknown',
                        gold_weight: item.gold_weight || item.weight,
                        diamond_weight: item.diamond_weight || null,
                        estimated_value: item.value,
                        image_url: item.image,
                        created_at: item.date
                    })));
                    setLoading(false);
                    return;
                }

                // 1. Fetch Profile
                const userResponse = await api.get('/users/me');
                setUser(userResponse.data);

                // 2. Sync Local Storage Items if any exist
                const localItems = getItems();
                if (localItems.length > 0) {
                    setSyncing(true);
                    for (const item of localItems) {
                        try {
                            await api.post('/evaluations/', {
                                title: item.title,
                                category: item.title.split(' ')[0].toLowerCase() || 'unknown',
                                purity: item.title.includes('K') ? item.title.match(/\d+K/)?.[0] || 'Unknown' : 'Unknown',
                                gold_weight: item.weight,
                                estimated_value: item.value,
                                image_url: item.image !== 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop' ? item.image : null
                            });
                        } catch (e) {
                            console.error("Failed to sync local item:", item, e);
                        }
                    }
                    clearItems();
                    setSyncing(false);
                }

                // 3. Fetch Portfolio
                const evalResponse = await api.get('/evaluations/me');
                setEvaluations(evalResponse.data);

            } catch (err) {
                console.error('Failed to load dashboard', err);
                Cookies.remove('token');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        const fetchMarketPrices = async () => {
            try {
                const response = await fetch('/api/gold-rates');
                const data = await response.json();
                if (data.success) {
                    setMarketPrices(data.rates);
                }
            } catch (err) {
                console.error('Failed to fetch market prices', err);
            }
        };

        fetchDashboardData();
        fetchMarketPrices();
    }, [router]);

    const handleLogout = () => {
        Cookies.remove('token');
        router.push('/login');
    };

    const handleDelete = async (id: number | string) => {
        const token = Cookies.get('token');

        try {
            if (token) {
                // Delete from backend
                await api.delete(`/evaluations/${id}`);
            } else {
                // Delete from local storage
                deleteItem(id.toString());
            }

            // Remove from local state
            setEvaluations(evaluations.filter(e => e.id !== id));
            setSelectedEvaluation(null);
        } catch (err) {
            console.error('Failed to delete evaluation', err);
            alert('Could not delete the evaluation. Please try again.');
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#1A1A1A', background: '#FAFAFA' }}>Loading your dashboard...</div>;
    }

    if (!user) return null;

    const totalValue = evaluations.reduce((sum, item) => sum + item.estimated_value, 0);

    // Global mock historical trajectory (roughly 22% growth over year mimicking actual gold prices) for the portfolio summary
    const historicalMultipliers = [0.82, 0.83, 0.85, 0.84, 0.86, 0.88, 0.89, 0.91, 0.94, 0.96, 0.98, 1.0];

    // Helper to generate history for multiple items combined
    const generatePortfolioHistory = (evals: Evaluation[], span: '6M' | '1Y' | '3Y') => {
        if (evals.length === 0) return [];

        let combinedHistoryPoints: { [key: string]: number } = {};
        let orderedMonthNames: string[] = [];

        // Sum up histories individually so the exact math scales identically
        for (const ev of evals) {
            const hist = generatePriceHistory(ev, span);
            orderedMonthNames = hist.map(h => h.name);
            for (const dp of hist) {
                combinedHistoryPoints[dp.name] = (combinedHistoryPoints[dp.name] || 0) + dp.Value;
            }
        }

        return orderedMonthNames.map(name => ({
            name,
            Value: combinedHistoryPoints[name]
        }));
    };

    const generatePriceHistory = (evaluation: Evaluation, span: '6M' | '1Y' | '3Y') => {
        const history = [];

        // Calculate constant diamond value
        const diamondCt = evaluation.diamond_weight ? parseFloat(evaluation.diamond_weight) : 0;
        const diamondValue = diamondCt * 35000;

        // Calculate current gold value
        const currentGoldValue = evaluation.estimated_value - diamondValue;

        // Extract gold weight and calculating purity factor to get 24K baseline
        const goldWeight = evaluation.gold_weight ? parseFloat(evaluation.gold_weight) : 0;
        const purityMatch = evaluation.purity ? evaluation.purity.match(/\d+/) : null;
        const purityValue = purityMatch ? parseInt(purityMatch[0]) : 24;
        const purityFactor = purityValue / 24;

        // Determine current implied 24K price per gram
        let impliedCurrent24KPrice = 7500;
        if (goldWeight > 0 && purityFactor > 0) {
            impliedCurrent24KPrice = currentGoldValue / (goldWeight * purityFactor);
        }

        // Interpolation logic between the user-provided exact historical 24K pure gold rates per gram
        const getHistorical24KPrice = (monthsAgo: number) => {
            if (monthsAgo === 0) return impliedCurrent24KPrice;
            if (monthsAgo <= 6) {
                return impliedCurrent24KPrice - (monthsAgo / 6) * (impliedCurrent24KPrice - 11450);
            }
            if (monthsAgo <= 12) {
                return 11450 - ((monthsAgo - 6) / 6) * (11450 - 9100);
            }
            if (monthsAgo <= 36) {
                return 9100 - ((monthsAgo - 12) / 24) * (9100 - 6300);
            }
            return 6300;
        };

        const now = new Date();
        const monthsCount = span === '6M' ? 6 : span === '1Y' ? 12 : 36;

        // Use a quarterly step for 3 years to avoid cluttering the X-axis, otherwise monthly
        const step = span === '3Y' ? 3 : 1;
        const dataPoints = span === '3Y' ? 12 : monthsCount;

        for (let i = dataPoints - 1; i >= 0; i--) {
            const monthsAgo = i * step;
            const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

            let monthStr = d.toLocaleString('default', { month: 'short' });
            if (span === '3Y') {
                monthStr = `${monthStr} '${d.getFullYear().toString().slice(-2)}`;
            }

            const historical24KPrice = getHistorical24KPrice(monthsAgo);

            // Add slight deterministic precision-bound noise so the line looks organically realistic while honoring the anchor nodes exactly
            let finalHistoricalPrice = historical24KPrice;
            if (monthsAgo !== 0 && monthsAgo !== 6 && monthsAgo !== 12 && monthsAgo !== 36) {
                const noise = (Math.sin(monthsAgo * 2.14) * 0.015) * historical24KPrice;
                finalHistoricalPrice += noise;
            }

            const historicalGoldValue = finalHistoricalPrice * goldWeight * purityFactor;
            const historicalTotalValue = Math.round(historicalGoldValue + diamondValue);

            history.push({
                name: monthStr,
                Value: historicalTotalValue
            });
        }
        return history;
    };

    const currentModalHistory = selectedEvaluation ? generatePriceHistory(selectedEvaluation, historySpan) : [];
    const modalGrowthPercentage = currentModalHistory.length > 0
        ? (((currentModalHistory[currentModalHistory.length - 1].Value - currentModalHistory[0].Value) / currentModalHistory[0].Value) * 100).toFixed(1)
        : "0.0";

    const currentPortfolioHistory = generatePortfolioHistory(evaluations, portfolioHistorySpan);
    const portfolioGrowthPercentage = currentPortfolioHistory.length > 0
        ? (((currentPortfolioHistory[currentPortfolioHistory.length - 1].Value - currentPortfolioHistory[0].Value) / currentPortfolioHistory[0].Value) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="dashboard-container">
            {/* Responsive Scoped Styles */}
            <style jsx>{`
                .dashboard-container {
                    background-color: #f8f8f6;
                    color: #0f172a;
                    min-height: 100vh;
                    width: 100vw;
                    font-family: var(--font-sans);
                    display: flex;
                    flex-direction: column;
                }
                .value-section {
                    padding: 1rem 1.5rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .global-chart-container {
                    padding: 0 1.5rem;
                }
                .main-content-grid {
                    display: flex;
                    flex-direction: column;
                }
                .recent-evaluations-col {
                    padding: 2rem 1.5rem;
                }
                .desktop-sidebar {
                    display: none;
                    flex-direction: column;
                    gap: 1.5rem;
                    padding: 2rem 1.5rem 2rem 0;
                }
                .quick-stats-row {
                    display: flex;
                    gap: 1rem;
                    padding: 0 1.5rem 7rem;
                }
                .bottom-nav-bar {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background-color: #ffffff;
                    border-top: 1px solid #f1f5f9;
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 40;
                }
                
                @media (min-width: 1024px) {
                    .value-section {
                        padding: 3rem 0 2rem;
                    }
                    .global-chart-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        width: 100%;
                        padding: 0 4rem;
                    }
                    .main-content-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr;
                        gap: 2rem;
                        max-width: 1200px;
                        margin: 0 auto;
                        width: 100%;
                        padding: 0 4rem;
                    }
                    .recent-evaluations-col {
                        padding: 2rem 0;
                    }
                    .desktop-sidebar {
                        display: flex;
                        padding: 2rem 0;
                    }
                }
            `}</style >



            {/* Portfolio Value Section */}
            <div className="value-section">
                <p style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Portfolio Value</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', color: '#2c2c2c', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginRight: '0.5rem', color: '#cbab36' }}>₹</span>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#1a1a1a' }}>
                        {totalValue.toLocaleString('en-IN')}
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.875rem', fontWeight: 700 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    <span>+{portfolioGrowthPercentage}% this year</span>
                </div>
            </div>

            {/* Global Portfolio Chart Card */}
            <div className="global-chart-container">
                <div style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>Growth History</h3>
                        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f8f8f6', padding: '0.25rem', borderRadius: '99px' }}>
                            {(['1M', '6M', '1Y', 'ALL'] as const).map(span => (
                                <button
                                    key={span}
                                    onClick={() => ['6M', '1Y'].includes(span) && setPortfolioHistorySpan(span as any)}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        borderRadius: '99px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: portfolioHistorySpan === span ? '#ffffff' : 'transparent',
                                        color: portfolioHistorySpan === span ? '#cbab36' : '#94a3b8',
                                        boxShadow: portfolioHistorySpan === span ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {span}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ height: '180px', width: '100%', marginLeft: '-15px', marginRight: '15px' }}>
                        {evaluations.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={currentPortfolioHistory} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis hide domain={['dataMin', 'dataMax']} />
                                    <Line
                                        type="monotone"
                                        dataKey="Value"
                                        stroke="#c19b5e"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#c19b5e', strokeWidth: 0 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                                Add items to track growth
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="main-content-grid">
                {/* Recent Evaluations Section (Left Col on Desktop) */}
                <div className="recent-evaluations-col">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>Recent Evaluations</h3>
                        <span style={{ color: '#cbab36', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>View All</span>
                    </div>

                    {/* List of Jewellery Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {evaluations.map((item) => {
                            // Calculate specific time string like "EVALUATED 2 DAYS AGO"
                            const evalDate = new Date(item.created_at);
                            const today = new Date();
                            const diffTime = Math.abs(today.getTime() - evalDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const timeAgoStr = diffDays <= 1 ? "TODAY" : diffDays < 7 ? `${diffDays} DAYS AGO` : diffDays < 14 ? "1 WEEK AGO" : diffDays < 30 ? `${Math.floor(diffDays / 7)} WEEKS AGO` : "A WHILE AGO";

                            return (
                                <div key={item.id} onClick={() => setSelectedEvaluation(item)} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'box-shadow 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'}>
                                    <div style={{ width: '3.5rem', height: '3.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', position: 'relative', overflow: 'hidden', flexShrink: 0, marginRight: '1rem', border: '1px solid #f1f5f9' }}>
                                        <Image
                                            src={item.image_url || "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop"}
                                            alt={item.title}
                                            fill
                                            style={{ objectFit: 'contain', padding: '0.25rem' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <p style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>{item.title}</p>
                                        <p style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', marginTop: '0.25rem' }}>EVALUATED: {timeAgoStr}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '1rem' }}>
                                        <p style={{ color: '#c19b5e', fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>₹{item.estimated_value.toLocaleString('en-IN')}</p>
                                        <p style={{ color: '#10b981', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em', marginTop: '0.15rem', textTransform: 'uppercase' }}>+2.4% VS LAST WEEK</p>
                                    </div>
                                    <div style={{ color: '#cbd5e1' }}>
                                        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            )
                        })}
                        {evaluations.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px dashed #e2e8f0' }}>
                                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No evaluations yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Right Col on Desktop) */}
                <div className="desktop-sidebar">

                    {/* Add More Assets Dark Box */}
                    <div style={{ backgroundColor: '#2b2a2a', borderRadius: '1rem', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>Add More Assets</h3>
                        <p style={{ color: '#9ca3af', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '2rem', maxWidth: '240px' }}>Instantly value your gold and jewelry with our premium AI-driven estimator tool.</p>
                        <button onClick={() => router.push('/evaluate')} style={{ backgroundColor: '#c19b5e', color: '#ffffff', width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: 'none', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b08b50'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c19b5e'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            EVALUATE NEW ITEM
                        </button>
                        <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', width: '2rem', height: '2rem', backgroundColor: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2b2a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                        </div>
                    </div>

                    {/* Market Overview Box */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c19b5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Market Overview</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>24K GOLD (PER G)</span>
                                    <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>₹{marketPrices ? marketPrices.gold_24k.toLocaleString('en-IN') : '7,500.00'}</span>
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>▲ 1.2%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>22K GOLD (PER G)</span>
                                    <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>₹{marketPrices ? marketPrices.gold_22k.toLocaleString('en-IN') : '6,875.00'}</span>
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>▲ 0.9%</span>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.55rem', color: '#cbd5e1', fontStyle: 'italic', textAlign: 'right', marginTop: '1.5rem' }}>Market prices updated daily</p>
                    </div>

                </div>
            </div>

            {/* Mobile Footer & Nav (Excluded on Desktop via CSS) */}
            <div className="quick-stats-row">
                <div style={{ flex: 1, backgroundColor: '#f8f8f6', border: '1px solid #f1f5f9', padding: '1.25rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ color: '#cbab36', marginBottom: '0.5rem' }}>
                        <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.5 14H17.5C18.3284 14 19 13.3284 19 12.5V3.5C19 2.67157 18.3284 2 17.5 2H2.5C1.67157 2 1 2.67157 1 3.5V12.5C1 13.3284 1.67157 14 2.5 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 9C11.1046 9 12 8.10457 12 7C12 5.89543 11.1046 5 10 5C8.89543 5 8 5.89543 8 7C8 8.10457 8.89543 9 10 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Total Items</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>{evaluations.length} Pieces</p>
                </div>
                <div style={{ flex: 1, backgroundColor: '#f8f8f6', border: '1px solid #f1f5f9', padding: '1.25rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ color: '#cbab36', marginBottom: '0.5rem' }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 4V9L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Last Update</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>Today</p>
                </div>
            </div>

            {/* Bottom Nav Bar */}
            <div className="bottom-nav-bar">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', color: '#cbab36', cursor: 'pointer' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard</span>
                </div>

                {/* Floating Add Button overlapping Nav */}
                <button onClick={() => router.push('/evaluate')} style={{
                    position: 'absolute',
                    top: '-1.5rem',
                    right: '2rem',
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '50%',
                    backgroundColor: '#cbab36',
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(203, 171, 54, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 50
                }}>
                    <span style={{ fontSize: '2rem', lineHeight: '1' }}>+</span>
                </button>

                <div onClick={() => router.push('/evaluate')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', color: '#94a3b8', cursor: 'pointer', marginRight: '3rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 22H20V2H4V22ZM6 20V4H18V20H6ZM8 14H16V18H8V14ZM8 6H16V12H8V6ZM10 8H14V10H10V8ZM10 15H14V17H10V15Z" />
                    </svg>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evaluate</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', color: '#94a3b8', cursor: 'pointer' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
                        <path d="M19.4 15.02L21.49 13.39C21.68 13.24 21.73 12.96 21.61 12.74L19.61 9.28001C19.49 9.06001 19.22 8.98001 18.99 9.07001L16.53 10.06C16.02 9.67001 15.46 9.35001 14.86 9.10001L14.49 6.47001C14.46 6.22001 14.25 6.03001 14 6.03001H10C9.75 6.03001 9.54 6.22001 9.51 6.47001L9.14 9.10001C8.54 9.35001 7.98 9.67001 7.47 10.06L5.01 9.07001C4.78 8.98001 4.51 9.06001 4.39 9.28001L2.39 12.74C2.26 12.96 2.32 13.24 2.51 13.39L4.6 15.02C4.57 15.28 4.54 15.54 4.54 15.8C4.54 16.06 4.57 16.32 4.6 16.58L2.51 18.21C2.32 18.36 2.27 18.64 2.39 18.86L4.39 22.32C4.51 22.54 4.78 22.62 5.01 22.53L7.47 21.54C7.98 21.93 8.54 22.25 9.14 22.5L9.51 25.13C9.54 25.38 9.75 25.57 10 25.57H14C14.25 25.57 14.46 25.38 14.49 25.13L14.86 22.5C15.46 22.25 16.02 21.93 16.53 21.54L18.99 22.53C19.22 22.62 19.49 22.54 19.61 22.32L21.61 18.86C21.74 18.64 21.68 18.36 21.49 18.21L19.4 16.58C19.43 16.32 19.46 16.06 19.46 15.8C19.46 15.54 19.43 15.28 19.4 15.02ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" />
                    </svg>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settings</span>
                </div>
            </div>

            {/* Evaluation Details Modal */}
            {
                selectedEvaluation && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(2px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                        padding: '1rem'
                    }} onClick={() => setSelectedEvaluation(null)}>
                        <div style={{
                            backgroundColor: '#ffffff',
                            width: '100%',
                            maxWidth: '420px',
                            borderRadius: '2rem',
                            padding: '2rem',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2rem'
                        }} onClick={(e) => e.stopPropagation()}>

                            <button
                                onClick={() => setSelectedEvaluation(null)}
                                style={{
                                    position: 'absolute',
                                    top: '1.5rem',
                                    right: '1.5rem',
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '9999px',
                                    backgroundColor: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748b',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {/* Top Header Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
                                <div style={{
                                    width: '140px',
                                    height: '140px',
                                    borderRadius: '1.5rem',
                                    backgroundColor: '#f8f9fc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1rem',
                                    position: 'relative',
                                    flexShrink: 0
                                }}>
                                    <Image
                                        src={selectedEvaluation.image_url || "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop"}
                                        alt={selectedEvaluation.title}
                                        fill
                                        style={{ objectFit: 'contain', padding: '1rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-serif)', lineHeight: 1.2 }}>{selectedEvaluation?.title}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <p style={{ color: '#d8ad27', fontSize: '1.5rem', fontWeight: 700 }}>₹{selectedEvaluation?.estimated_value?.toLocaleString('en-IN')}</p>
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Estimated Value</span>
                                    </div>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Last evaluated on {selectedEvaluation?.created_at ? new Date(selectedEvaluation.created_at).toLocaleDateString('en-GB') : 'Unknown'}</p>
                                </div>
                            </div>

                            {/* Weights Section */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Metal Weight</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                        <span style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 600 }}>{selectedEvaluation?.gold_weight?.replace('g', '') || 'N/A'}</span>
                                        {selectedEvaluation?.gold_weight && <span style={{ color: '#64748b', fontSize: '0.875rem' }}>g</span>}
                                    </div>
                                </div>
                                <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Diamond Weight</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                        <span style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 600 }}>{selectedEvaluation?.diamond_weight || '0.00'}</span>
                                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>ct</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price History Line Graph */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-serif)' }}>Price History</h4>
                                        <div style={{ backgroundColor: '#fefce8', color: '#d8ad27', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                            +{modalGrowthPercentage}% Growth
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                                        {(['6M', '1Y', '3Y'] as const).map(span => (
                                            <button
                                                key={span}
                                                onClick={() => setHistorySpan(span)}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    borderRadius: '0.375rem',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    backgroundColor: historySpan === span ? '#ffffff' : 'transparent',
                                                    color: historySpan === span ? '#0f172a' : '#64748b',
                                                    boxShadow: historySpan === span ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {span}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ height: '200px', width: '100%', marginLeft: '-15px', marginRight: '15px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={currentModalHistory} margin={{ top: 15, right: 0, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                                dy={15}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                                width={35}
                                            />
                                            <Tooltip
                                                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Value']}
                                                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: '8px 12px' }}
                                                labelStyle={{ color: '#0f172a', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.875rem' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="Value"
                                                stroke="#d8ad27"
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: '#d8ad27', strokeWidth: 0 }}
                                                activeDot={{ r: 5, strokeWidth: 0 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                                <button
                                    onClick={() => setSelectedEvaluation(null)}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#dfb22b',
                                        color: '#ffffff',
                                        height: '3.5rem',
                                        borderRadius: '1rem',
                                        fontWeight: 600,
                                        fontSize: '1.125rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c99f24'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dfb22b'}
                                >
                                    Close Details
                                </button>

                                <button
                                    onClick={() => handleDelete(selectedEvaluation.id)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        color: '#94a3b8',
                                        height: '2.5rem',
                                        fontWeight: 500,
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s',
                                        marginTop: '0.25rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                >
                                    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3.2002 4H12.8002V15.2C12.8002 15.6418 12.442 16 12.0002 16H3.0002C3.55837 16 3.2002 15.6418 3.2002 15.2V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M1 4H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M5 4V2C5 1.44772 5.44772 1 6 1H10C10.5523 1 11 1.44772 11 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Delete Asset
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}
