"use client";

import { useState, useCallback } from 'react';
import styles from './FileUpload.module.css';
import Button from './ui/Button';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            handleFile(file);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onFileSelect(file);
    };

    const clearFile = () => {
        setPreview(null);
    };

    return (
        <div>
            {preview ? (
                <div style={{ textAlign: 'center' }}>
                    <div className={styles.preview}>
                        <img src={preview} alt="Preview" className={styles.previewImage} />
                        <div className={styles.scanning}></div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <Button variant="secondary" onClick={clearFile} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Change Photo
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                    <input
                        type="file"
                        id="file-upload-input"
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleChange}
                    />
                    <span className={styles.icon}>📷</span>
                    <p className={styles.text}>Drag & Drop your jewellery photo here</p>
                    <p className={styles.subtext}>or click to browse</p>
                </div>
            )}
        </div>
    );
}
