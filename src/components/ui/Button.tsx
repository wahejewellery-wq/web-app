import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    fullWidth?: boolean;
    children: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    fullWidth = false,
    className = '',
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={`${styles.button} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''} ${props.disabled ? styles.disabled : ''} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
