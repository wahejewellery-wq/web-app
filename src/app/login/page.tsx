'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import styles from '../auth.module.css';

export default function Login() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullName, setFullName] = useState(''); // Optional for new users
    const [otpCode, setOtpCode] = useState('');

    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await api.post('/users/request-otp', {
                phone_number: phoneNumber,
                full_name: fullName || undefined
            });
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to request OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/users/verify-otp', {
                phone_number: phoneNumber,
                otp_code: otpCode
            });
            if (response.data.access_token) {
                Cookies.set('token', response.data.access_token, { expires: 7 });
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid OTP. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        {step === 1 ? 'Sign In / Register' : 'Verify Phone'}
                    </h1>
                    <p className={styles.subtitle}>
                        {step === 1
                            ? 'Enter your mobile number to continue'
                            : `We sent a code to ${phoneNumber}`}
                    </p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {step === 1 ? (
                    <form className={styles.form} onSubmit={handleRequestOTP}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="phoneNumber">Phone Number</label>
                            <input
                                id="phoneNumber"
                                type="tel"
                                className={styles.input}
                                placeholder="+1 234 567 8900"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="fullName">Full Name (Optional if new)</label>
                            <input
                                id="fullName"
                                type="text"
                                className={styles.input}
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form className={styles.form} onSubmit={handleVerifyOTP}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="otpCode">6-Digit OTP</label>
                            <input
                                id="otpCode"
                                type="text"
                                maxLength={6}
                                className={styles.input}
                                placeholder="123456"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                required
                                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '24px' }}
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading || otpCode.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            disabled={loading}
                            className={styles.submitBtn}
                            style={{ background: 'transparent', color: 'var(--text-secondary, #666)', marginTop: 0 }}
                        >
                            Back to Phone Number
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
