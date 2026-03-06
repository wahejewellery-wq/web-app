
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#1A1A1A', minHeight: '100vh', width: '100vw', overflowX: 'hidden', fontFamily: 'var(--font-sans)' }}>

      {/* Hero Section: High-end Luxury */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '3rem 1.5rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          width: '100%',
          aspectRatio: '4/5',
          maxHeight: '600px',
          backgroundColor: '#e5e7eb',
          borderRadius: '0.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Image
            src="/home-banner.jpg"
            alt="Gold Jewellery Hero Image"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#1A1A1A' }}>
            Elegance <br /> Redefined by <br /> <span style={{ fontStyle: 'italic', color: '#733004' }}>Intelligence</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.125rem', fontWeight: 300, lineHeight: 1.625, maxWidth: '28rem' }}>
            Experience the pinnacle of luxury with our advanced AI gold estimation technology. Precise, sophisticated, and instantaneous.
          </p>
          <div style={{ paddingTop: '1rem' }}>
            <Link href="/evaluate" style={{ width: '100%', display: 'block' }}>
              <button style={{
                width: '100%',
                padding: '1.25rem 2rem',
                backgroundColor: '#733004',
                color: '#FFFFFF',
                borderRadius: '9999px',
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(115, 48, 4, 0.2)',
                transition: 'all 0.2s',
              }}>
                Evaluate Now
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '3rem', padding: '4rem 1.5rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <span style={{ color: '#733004', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>The Standard</span>
          <h3 style={{ color: '#0f172a', fontSize: '1.875rem', fontWeight: 300, fontFamily: 'var(--font-serif)' }}>Excellence in Every Grain</h3>
          <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 300 }}>Combining heritage expertise with proprietary neural networks for unmatched accuracy.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          {/* Feature 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', backgroundColor: 'rgba(115, 48, 4, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#733004', fontSize: '1.5rem' }}>
              ✨
            </div>
            <div>
              <h4 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI Precision</h4>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.625 }}>Instant market value estimation powered by real-time global commodity data and visual recognition.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', backgroundColor: 'rgba(115, 48, 4, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#733004', fontSize: '1.5rem' }}>
              ✓
            </div>
            <div>
              <h4 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Expert Review</h4>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.625 }}>Every digital appraisal is backed by our network of master jewelers with decades of experience.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', backgroundColor: 'rgba(237, 188, 29, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#edbc1d', fontSize: '1.5rem' }}>
              🔒
            </div>
            <div>
              <h4 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Secure Vault</h4>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.625 }}>Your data and evaluations are protected by bank-grade encryption and privacy protocols.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Curated Collections / Gallery Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '4rem 0' }}>
        <h2 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 300, fontFamily: 'var(--font-serif)', padding: '0 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>Curated Collections</h2>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', padding: '0 1.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

          {/* Card 1 */}
          <div style={{ minWidth: '280px', height: '400px', position: 'relative', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCawW5RvHsbGUBSw9nlwMaL3KCHZLNo0d5LTTz7-ix0o6sv4RP2HI9vJdDxVVUEYInah0dcDCK-0dN9sRCSABjJGFe8xAv97m8EK1lRgbuIGYBFSajJejK1_ZUJ1kqNYS_vUvmkqgch0ugEoMFMm9BrL6Fj1QE_eWJ_fUeDXPKYXEUR2G-JI7dPyzROCbhmA2SOJFfZ-VAWfvWtVMSr32ILJF555_yPWfmZg3nIvx0Qgnqi_Si1dSkDvZ4quz1mOnna6vcE_v9qaPw"
              alt="Vintage Gold"
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 280px"
            />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 60%)' }}></div>
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
              <p style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Heritage</p>
              <h4 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 300 }}>Vintage Gold</h4>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ minWidth: '280px', height: '400px', position: 'relative', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAg2W6pZ4JEhgaKcRGCYIj3IyOQNtsb7CYrN-hLVMx-D13i6qObUs4ZRw8EYFFTKdeEtCi1dH4e4aE1LPnFIZwREGqOJ5UUKWl1WiuCpp62SNSHgoab-pc28QhZGM50gOWTIvl4GkHlv1b004t9uLVyrzaZWhju6phdP_F-k4HYHd6skr_xKIALN12vig4LEUK7dSluHZ_9jj5g2cYNfBF37pu9tvKQDiK7rCpjFF9ukvY2IeymNcxndHByQsj1n4QMdSnti7J1Hq0"
              alt="Modern Minimalist"
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 280px"
            />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 60%)' }}></div>
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
              <p style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Contemporary</p>
              <h4 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 300 }}>Modern Minimalist</h4>
            </div>
          </div>

        </div>
      </section>

      {/* Call to Action */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'rgba(115, 48, 4, 0.05)', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', marginBottom: '1rem', color: '#0f172a' }}>Ready to Discover Your Value?</h3>
        <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '20rem', margin: '0 auto 2rem' }}>Get your first AI-powered evaluation in less than 60 seconds.</p>
        <Link href="/dashboard">
          <button style={{
            padding: '1rem 2.5rem',
            backgroundColor: '#0f172a',
            color: '#FFFFFF',
            borderRadius: '9999px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer'
          }}>
            Get Started
          </button>
        </Link>
      </section>

    </div>
  );
}
