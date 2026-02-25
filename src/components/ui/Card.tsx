import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    padding?: 'none' | 'small' | 'medium' | 'large';
}

export default function Card({ children, className = '', style, padding = 'medium' }: CardProps) {
    return (
        <div className={`${styles.card} ${styles[padding]} ${className}`} style={style}>
            {children}
        </div>
    );
}
