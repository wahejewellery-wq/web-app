import Link from 'next/link';
import Button from './ui/Button';
import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.background}></div>
            <div className={styles.content}>
                <h1 className={styles.title}>
                    Discover the True Value of Your Gold
                </h1>
                <p className={styles.subtitle}>
                    Use our advanced AI-powered estimation tool to get accurate, real-time valuations for your jewellery.
                    Professional, secure, and instant.
                </p>
                <Link href="/evaluate">
                    <Button variant="primary" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem' }}>
                        Start Free Estimation
                    </Button>
                </Link>
            </div>
        </section>
    );
}
