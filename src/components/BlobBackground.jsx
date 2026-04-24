export function BlobBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Blob 1 — deep indigo, top-left, 18s */}
      <div
        className="absolute rounded-full opacity-30"
        style={{
          width: 600,
          height: 600,
          top: '-150px',
          left: '-150px',
          background: 'radial-gradient(circle, #2d3680, #131840)',
          filter: 'blur(90px)',
          animation: 'blob1 18s ease-in-out infinite',
        }}
      />
      {/* Blob 2 — deep navy blue, top-right, 13s */}
      <div
        className="absolute rounded-full opacity-25"
        style={{
          width: 500,
          height: 500,
          top: '-100px',
          right: '-100px',
          background: 'radial-gradient(circle, #1a2a5c, #0a1030)',
          filter: 'blur(90px)',
          animation: 'blob2 13s ease-in-out infinite',
        }}
      />
      {/* Blob 3 — deep space, bottom-center, 21s */}
      <div
        className="absolute rounded-full opacity-22"
        style={{
          width: 700,
          height: 700,
          bottom: '-200px',
          left: '30%',
          background: 'radial-gradient(circle, #152040, #060c20)',
          filter: 'blur(90px)',
          animation: 'blob3 21s ease-in-out infinite',
        }}
      />
      {/* Blob 4 — deep violet-navy, mid-center, 16s */}
      <div
        className="absolute rounded-full opacity-18"
        style={{
          width: 450,
          height: 450,
          top: '40%',
          left: '45%',
          background: 'radial-gradient(circle, #201848, #0e0c28)',
          filter: 'blur(90px)',
          animation: 'blob4 16s ease-in-out infinite',
        }}
      />
    </div>
  )
}
