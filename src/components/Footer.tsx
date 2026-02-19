import styles from './Footer.module.css';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.content}`}>
                <p className={styles.copy}>
                    &copy; {new Date().getFullYear()} Gold Estimation Platform. All rights reserved.
                </p>
                <div className={styles.socials}>
                    <Link href="#" className={styles.socialLink}>Privacy Policy</Link>
                    <Link href="#" className={styles.socialLink}>Terms of Service</Link>
                    <Link href="#" className={styles.socialLink}>Contact Support</Link>
                </div>
            </div>
        </footer>
    );
}
