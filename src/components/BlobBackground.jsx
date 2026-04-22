export function BlobBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Blob 1 — warm amber, top-left, 18s */}
      <div
        className="absolute rounded-full opacity-25"
        style={{
          width: 600, height: 600,
          top: '-150px', left: '-150px',
          background: 'radial-gradient(circle, #7c4515, #4a2508)',
          filter: 'blur(110px)',
          animation: 'blob1 18s ease-in-out infinite',
        }}
      />
      {/* Blob 2 — deep sepia, top-right, 13s */}
      <div
        className="absolute rounded-full opacity-20"
        style={{
          width: 500, height: 500,
          top: '-100px', right: '-100px',
          background: 'radial-gradient(circle, #5c2c0a, #3a1806)',
          filter: 'blur(110px)',
          animation: 'blob2 13s ease-in-out infinite',
        }}
      />
      {/* Blob 3 — ochre glow, bottom-center, 21s */}
      <div
        className="absolute rounded-full opacity-22"
        style={{
          width: 700, height: 700,
          bottom: '-200px', left: '30%',
          background: 'radial-gradient(circle, #9a6018, #5a3010)',
          filter: 'blur(110px)',
          animation: 'blob3 21s ease-in-out infinite',
        }}
      />
      {/* Blob 4 — warm rust, mid-center, 16s */}
      <div
        className="absolute rounded-full opacity-18"
        style={{
          width: 450, height: 450,
          top: '40%', left: '45%',
          background: 'radial-gradient(circle, #6b3015, #8b4a20)',
          filter: 'blur(110px)',
          animation: 'blob4 16s ease-in-out infinite',
        }}
      />
    </div>
  )
}
