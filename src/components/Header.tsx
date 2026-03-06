'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import styles from './Header.module.css';

export default function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = Cookies.get('token');
        setIsLoggedIn(!!token);
    }, [pathname]);

    const handleLogout = () => {
        Cookies.remove('token');
        setIsLoggedIn(false);
        router.push('/login');
    };

    return (
        <header className={styles.header}>
            <div className={styles.navContainer}>
                {/* Logo Section */}
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoText}>GOLD ESTIMATOR</span>
                    <span className={styles.brandText}>by wahe</span>
                </Link>

                {/* Desktop Nav Section */}
                <nav className={styles.desktopNav}>
                    <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.activeNavLink : ''}`}>
                        Home
                    </Link>
                    <Link href="/evaluate" className={`${styles.navLink} ${pathname === '/evaluate' ? styles.activeNavLink : ''}`}>
                        Evaluate
                    </Link>
                    {isLoggedIn && (
                        <Link href="/dashboard" className={`${styles.navLink} ${pathname === '/dashboard' ? styles.activeNavLink : ''}`}>
                            Dashboard
                        </Link>
                    )}
                    <Link href="/profile" className={`${styles.navLink} ${pathname === '/profile' ? styles.activeNavLink : ''}`}>
                        Profile
                    </Link>

                    <div className={styles.divider}></div>

                    <button className={styles.iconBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </button>

                    {isLoggedIn ? (
                        <button onClick={handleLogout} className={styles.profileBtn} style={{ borderRadius: '50%' }}>
                            <span style={{ color: '#733004', fontSize: '1.25rem' }}>👤</span>
                        </button>
                    ) : (
                        <Link href="/login" className={styles.navLink}>Login</Link>
                    )}
                </nav>

                {/* Mobile Identity/Action Area */}
                <div className={styles.mobileActions}>
                    {isLoggedIn ? (
                        <button onClick={handleLogout} className={styles.profileBtn} style={{ borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: '#ffffff' }}>
                            <span style={{ color: '#cbab36', fontSize: '1.25rem' }}>👤</span>
                        </button>
                    ) : (
                        <Link href="/login" className={styles.navLink}>Login</Link>
                    )}
                </div>
            </div>
        </header>
    );
}
