import { NextResponse } from 'next/server';

export async function POST() {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock response
    return NextResponse.json({
        success: true,
        data: {
            type: 'Gold Chain',
            detected_karat: 22,
            confidence: 0.95
        }
    });
}
