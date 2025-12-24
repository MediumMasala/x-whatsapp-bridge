/**
 * Root page - simple redirect or info page
 */

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#f5f5f5',
        padding: '20px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#1a1a1a' }}>
          X → WhatsApp Bridge
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          This service handles X/Twitter ad redirects to WhatsApp.
        </p>
        <p style={{ color: '#999', fontSize: '12px', marginTop: '24px' }}>
          For TAL
        </p>
      </div>
    </main>
  );
}
