import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={`container ${styles.nav}`}>
                <Link href="/" className={styles.logo}>
                    GOLD ESTIMATOR
                </Link>
                <nav className={styles.links}>
                    <Link href="/" className={styles.link}>Home</Link>
                    <Link href="/evaluate" className={styles.link}>Evaluate</Link>
                    <Link href="/portfolio" className={styles.link}>Portfolio</Link>
                </nav>
            </div>
        </header>
    );
}
