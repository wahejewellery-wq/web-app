import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <div className={styles.container}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                className={`${styles.input} ${error ? styles.errorInput : ''} ${className}`}
                {...props}
            />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
}
