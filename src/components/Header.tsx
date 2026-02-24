'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import styles from './Header.module.css';

export default function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = Cookies.get('token');
        setIsLoggedIn(!!token);
    }, []);

    const handleLogout = () => {
        Cookies.remove('token');
        setIsLoggedIn(false);
    };

    return (
        <header className={styles.header}>
            <div className={`container ${styles.nav}`}>
                <Link href="/" className={styles.logo}>
                    GOLD ESTIMATOR
                </Link>
                <nav className={styles.links}>
                    <Link href="/" className={styles.link}>Home</Link>
                    <Link href="/evaluate" className={styles.link}>Evaluate</Link>
                    {isLoggedIn ? (
                        <>
                            <Link href="/dashboard" className={styles.link}>Dashboard</Link>
                            <button onClick={handleLogout} className={styles.link} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', padding: 0 }}>Logout</button>
                        </>
                    ) : (
                        <Link href="/login" className={styles.link}>Login</Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
