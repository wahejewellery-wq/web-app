"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './dashboard.module.css';
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
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-unvault-text)', background: 'var(--color-unvault-bg)' }}>Loading your dashboard...</div>;
    }

    if (!user) return null;

    const totalValue = evaluations.reduce((sum, item) => sum + item.estimated_value, 0);
    const totalWeight = evaluations.reduce((sum, item) => {
        const weightVal = parseFloat(item.gold_weight.replace('g', ''));
        return sum + (isNaN(weightVal) ? 0 : weightVal);
    }, 0);

    const totalDiamondCarats = evaluations.reduce((sum, item) => {
        if (!item.diamond_weight) return sum;
        const ctVal = parseFloat(item.diamond_weight.replace(/[^\d.]/g, ''));
        return sum + (isNaN(ctVal) ? 0 : ctVal);
    }, 0);

    let goldTotalValue = 0;
    let gemTotalValue = 0;

    evaluations.forEach(item => {
        if (item.diamond_weight) {
            goldTotalValue += item.estimated_value * 0.8;
            gemTotalValue += item.estimated_value * 0.2;
        } else {
            goldTotalValue += item.estimated_value;
        }
    });

    const goldPercent = totalValue > 0 ? (goldTotalValue / totalValue) * 100 : 100;
    const gemPercent = totalValue > 0 ? (gemTotalValue / totalValue) * 100 : 0;

    // Generate mock historical trajectory (roughly 22% growth over year mimicking actual gold prices)
    const historicalMultipliers = [0.82, 0.83, 0.85, 0.84, 0.86, 0.88, 0.89, 0.91, 0.94, 0.96, 0.98, 1.0];
    const growthPercentage = (((1.0 - historicalMultipliers[0]) / historicalMultipliers[0]) * 100).toFixed(1);

    const mockChartData = Array.from({ length: 12 }, (_, i) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));

        const val = totalValue * historicalMultipliers[i];

        return {
            name: monthNames[date.getMonth()],
            value: Math.round(val)
        };
    });

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: '#fff', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>₹{payload[0].value.toLocaleString('en-IN')}</p>
                </div>
            );
        }
        return null;
    };

    const displayedItems = evaluations.filter(item => {
        if (activeFilter === 'Tracking') return true;
        return false;
    });

    return (
        <div className={styles.container}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}>Welcome Back, {user.full_name?.split(' ')[0] || 'User'}</h1>
                        <p className={styles.pageSubtitle}>Track the live value of your jewelry portfolio securely.</p>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        Log Out
                    </button>
                </header>

                <section className={styles.summary}>
                    <div className={styles.mainCard}>
                        <div className={styles.mainValueHeader}>
                            <h2 className={styles.mainValue}>₹{totalValue.toLocaleString('en-IN')}</h2>
                            {totalValue > 0 && <span className={styles.growthBadge}>+{growthPercentage}% (1yr)</span>}
                            <span className={styles.mainLabel}>Est. Value</span>
                        </div>

                        {/* Line Chart */}
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EAB308" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} minTickGap={20} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" stroke="#EAB308" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Breakdown Section */}
                        <div className={styles.breakdownSection}>
                            <div className={styles.progressBarTrack}>
                                <div className={styles.progressGold} style={{ width: `${goldPercent}%` }}></div>
                                {gemPercent > 0 && <div className={styles.progressGems} style={{ width: `${gemPercent}%` }}></div>}
                            </div>

                            <div className={styles.breakdownLegend}>
                                <div className={styles.legendRow}>
                                    <div className={styles.legendLeft}>
                                        <div className={styles.legendDotGold}></div>
                                        <span>Gold</span>
                                    </div>
                                    <div className={styles.legendRight}>
                                        <div className={styles.legendValue}>₹{Math.round(goldTotalValue).toLocaleString('en-IN')}</div>
                                        <div className={styles.legendWeight}>{totalWeight.toFixed(1)}g</div>
                                    </div>
                                </div>
                                {gemPercent > 0 && (
                                    <div className={styles.legendRow}>
                                        <div className={styles.legendLeft}>
                                            <div className={styles.legendDotGems}></div>
                                            <span>Gemstones</span>
                                        </div>
                                        <div className={styles.legendRight}>
                                            <div className={styles.legendValue}>₹{Math.round(gemTotalValue).toLocaleString('en-IN')}</div>
                                            <div className={styles.legendWeight}>{totalDiamondCarats.toFixed(2)}ct</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className={styles.filters}>
                        <div
                            className={`${styles.filterPill} ${activeFilter === 'Tracking' ? styles.filterPillActive : ''}`}
                            onClick={() => setActiveFilter('Tracking')}
                        >
                            Tracking ({evaluations.length})
                        </div>
                        <div
                            className={`${styles.filterPill} ${activeFilter === 'Selling' ? styles.filterPillActive : ''}`}
                            onClick={() => setActiveFilter('Selling')}
                        >
                            Selling (0)
                        </div>
                        <div
                            className={`${styles.filterPill} ${activeFilter === 'Sold' ? styles.filterPillActive : ''}`}
                            onClick={() => setActiveFilter('Sold')}
                        >
                            Sold (0)
                        </div>
                    </div>

                    {syncing && <p style={{ color: 'var(--color-unvault-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>Syncing offline evaluations to your vault...</p>}

                    {displayedItems.length === 0 ? (
                        <div className={styles.emptyState}>
                            <h3 className={styles.emptyTitle}>Nothing here yet</h3>
                            <p className={styles.emptySubtitle}>
                                {activeFilter === 'Tracking'
                                    ? "Unlock the true value of your jewelry transparently. Evaluate your first piece in 60 seconds."
                                    : `You have no items marked as ${activeFilter}.`}
                            </p>
                            {activeFilter === 'Tracking' && (
                                <button
                                    onClick={() => router.push('/evaluate')}
                                    className={styles.evaluateBtn}
                                >
                                    Get Instant Valuation
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {displayedItems.map((item) => (
                                <div key={item.id} className={styles.card}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.image_url || "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop"}
                                        alt={item.title}
                                        className={styles.itemImage}
                                    />
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemHeader}>
                                            <h3 className={styles.itemTitle}>{item.title}</h3>
                                        </div>
                                        <p className={styles.itemSubtitle}>
                                            {item.gold_weight} | Tracked since {new Date(item.created_at).getFullYear()}
                                        </p>
                                        <div className={styles.itemFooter}>
                                            <div className={styles.itemPrice}>
                                                ₹{item.estimated_value.toLocaleString('en-IN')}
                                            </div>
                                            <button className={styles.actionBtn}>
                                                Sell
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
