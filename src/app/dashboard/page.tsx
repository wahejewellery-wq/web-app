"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import { getItems, clearItems } from '@/lib/storage';

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
    const [activeFilter, setActiveFilter] = useState<'Tracking' | 'Selling' | 'Sold'>('Tracking');

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
                        purity: 'Unknown',
                        gold_weight: item.weight,
                        diamond_weight: null,
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

        fetchDashboardData();
    }, [router]);

    const handleLogout = () => {
        Cookies.remove('token');
        router.push('/login');
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#1A1A1A', background: '#FAFAFA' }}>Loading your dashboard...</div>;
    }

    if (!user) return null;

    const totalValue = evaluations.reduce((sum, item) => sum + item.estimated_value, 0);

    // Generate mock historical trajectory (roughly 22% growth over year mimicking actual gold prices)
    const historicalMultipliers = [0.82, 0.83, 0.85, 0.84, 0.86, 0.88, 0.89, 0.91, 0.94, 0.96, 0.98, 1.0];
    const growthPercentage = (((1.0 - historicalMultipliers[0]) / historicalMultipliers[0]) * 100).toFixed(1);


    return (
        <div style={{ backgroundColor: '#f8f8f6', color: '#0f172a', minHeight: '100vh', width: '100vw', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>

            {/* Header Area */}
            <div style={{ padding: '3rem 1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0f172a' }}>Jewellery Portfolio</h2>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{user.full_name?.split(' ')[0] || 'User'}</p>
                </div>
                <button onClick={handleLogout} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'rgba(237, 188, 29, 0.2)' }}>
                    <span style={{ color: '#edbc1d', fontSize: '1.25rem' }}>🚪</span>
                </button>
            </div>

            {/* Portfolio Value Section */}
            <div style={{ padding: '0 1.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.025em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Portfolio Value</p>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 300, color: '#edbc1d', marginBottom: '0.25rem' }}>
                    ₹{totalValue.toLocaleString('en-IN')}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
                    <span style={{ fontSize: '1rem' }}>↗</span>
                    <span>+{growthPercentage}% this year</span>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div style={{ display: 'flex', gap: '1rem', padding: '0 1.5rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #f1f5f9', padding: '1rem', borderRadius: '0.75rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '-0.05em', marginBottom: '0.25rem' }}>Total Items</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{evaluations.length} Pieces</p>
                </div>
                <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #f1f5f9', padding: '1rem', borderRadius: '0.75rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '-0.05em', marginBottom: '0.25rem' }}>Last Evaluation</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Recently</p>
                </div>
            </div>

            {/* Recent Evaluations Section */}
            <div style={{ padding: '0 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Recent Evaluations</h3>
                    <a href="#" onClick={(e) => { e.preventDefault(); router.push('/evaluate') }} style={{ color: '#edbc1d', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none' }}>+ Add New</a>
                </div>

                {/* Grid of Jewellery Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', paddingBottom: '6rem' }}>
                    {evaluations.map((item) => (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '0.75rem', overflow: 'hidden' }}>
                            <div style={{ aspectRatio: '1/1', backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={item.image_url || "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop"}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ padding: '0.75rem' }}>
                                <p style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                                <p style={{ color: '#edbc1d', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>₹{item.estimated_value.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    ))}
                    {evaluations.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '0.75rem', border: '1px dashed #e2e8f0' }}>
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No items evaluated yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button for Adding New Items */}
            <button onClick={() => router.push('/evaluate')} style={{
                position: 'fixed',
                bottom: '6rem',
                right: '1.5rem',
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                backgroundColor: '#edbc1d',
                color: '#ffffff',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}>
                <span style={{ fontSize: '2rem' }}>+</span>
            </button>
        </div>
    );
}
