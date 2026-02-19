"use client";

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import styles from './portfolio.module.css';
import { getItems, PortfolioItem } from '@/lib/storage';

// Mock Data
const MOCK_ITEMS: PortfolioItem[] = [
    {
        id: '1',
        title: "Gold Necklace (22K)",
        date: "2024-02-10",
        weight: "25g",
        value: 165000,
        image: "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: '2',
        title: "Diamond Ring (18K)",
        date: "2024-01-15",
        weight: "8g",
        value: 85000,
        image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: '3',
        title: "Antique Bracelet",
        date: "2023-12-20",
        weight: "45g",
        value: 280000,
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop"
    }
];

export default function PortfolioPage() {
    const [items, setItems] = useState<PortfolioItem[]>([]);

    useEffect(() => {
        // Load local items and merge with mock items
        const localItems = getItems();
        setItems([...localItems, ...MOCK_ITEMS]);
    }, []);

    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    const totalWeight = items.reduce((sum, item) => {
        const weightVal = parseFloat(item.weight.replace('g', ''));
        return sum + (isNaN(weightVal) ? 0 : weightVal);
    }, 0);

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header className={styles.header}>
                <h1>My Portfolio</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>Track the value of your jewellery collection.</p>
            </header>

            <section className={styles.summary}>
                <div className={styles.valueCard}>
                    <div className={styles.valueLabel}>Total Portfolio Value</div>
                    <div className={styles.valueAmount}>₹{totalValue.toLocaleString('en-IN')}</div>
                </div>
                <div className={styles.valueCard}>
                    <div className={styles.valueLabel}>Total Weight Estimated</div>
                    <div className={styles.valueAmount}>{totalWeight.toFixed(1)}g</div>
                </div>
                <div className={styles.valueCard}>
                    <div className={styles.valueLabel}>Items Tracked</div>
                    <div className={styles.valueAmount}>{items.length}</div>
                </div>
            </section>

            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Saved Items</h2>
            <div className={styles.grid}>
                {items.map((item) => (
                    <Card key={item.id} padding="none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.title} className={styles.itemImage} />
                        <div className={styles.itemContent}>
                            <h3 className={styles.itemTitle}>{item.title}</h3>
                            <div className={styles.itemDetails}>
                                <span>{item.date}</span>
                                <span>{item.weight}</span>
                            </div>
                            <div className={styles.itemPrice}>
                                ₹{item.value.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <section className={styles.chartContainer}>
                <h3 style={{ marginBottom: '1rem' }}>Value Trend (6 Months)</h3>
                <div className={styles.barChart}>
                    {/* Mock Chart Data */}
                    {[40, 55, 45, 70, 85, 100].map((height, i) => (
                        <div
                            key={i}
                            className={styles.bar}
                            style={{ height: `${height}%` }}
                        >
                            <span className={styles.barLabel}>{['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'][i]}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
