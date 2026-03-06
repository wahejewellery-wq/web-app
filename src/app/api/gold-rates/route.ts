import { NextResponse } from 'next/server';

export const revalidate = 86400; // 24 hours in seconds

export async function GET() {
    try {
        const API_KEY = '1298ec43bbdc40f5047ef3354b07a56f';
        const url = `https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}&base=INR&currencies=XAU`;

        const response = await fetch(url, { next: { revalidate: 86400 } });

        if (!response.ok) {
            throw new Error(`Failed to fetch gold rates: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.success && data.rates && data.rates.XAU) {
            const pricePerOunceINR = 1 / data.rates.XAU;
            const pricePerGram24K = pricePerOunceINR / 28.35;
            const pricePerGram22K = pricePerGram24K * (22 / 24);

            return NextResponse.json({
                success: true,
                rates: {
                    gold_24k: Math.round(pricePerGram24K * 100) / 100,
                    gold_22k: Math.round(pricePerGram22K * 100) / 100
                },
                timestamp: data.timestamp
            });
        }

        throw new Error('Invalid data format from gold price API');

    } catch (error) {
        console.error("Gold rates API error:", error);
        return NextResponse.json({
            success: false,
            error: (error as Error).message,
            // Fallback values if API fails
            rates: {
                gold_24k: 7500,
                gold_22k: 6875
            }
        }, { status: 500 });
    }
}
