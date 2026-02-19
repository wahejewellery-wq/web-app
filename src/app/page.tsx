import Hero from '@/components/Hero';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Hero />

      <section className="container" style={{ padding: '4rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>How It Works</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Three simple steps to get your valuation</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          <Card className="bg-card">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Upload Photo</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              Take a clear photo of your jewellery item. Our AI analyzes the visual characteristics to identify the type and potential purity.
            </p>
          </Card>

          <Card className="bg-card">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Add Details</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              Input known details such as weight and karat if available. The more information you provide, the more precise the estimate.
            </p>
          </Card>

          <Card className="bg-card">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Get Valuation</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              Receive an instant estimated value range based on real-time market gold prices and diamond rates.
            </p>
          </Card>
        </div>

        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <Link href="/portfolio">
            <Button variant="secondary">View My Portfolio</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
