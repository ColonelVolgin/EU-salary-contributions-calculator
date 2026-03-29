export function BlobBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Blob 1 — violet/indigo, top-left, 18s */}
      <div
        className="absolute rounded-full opacity-30"
        style={{
          width: 600,
          height: 600,
          top: '-150px',
          left: '-150px',
          background: 'radial-gradient(circle, #7c3aed, #4338ca)',
          filter: 'blur(90px)',
          animation: 'blob1 18s ease-in-out infinite',
        }}
      />
      {/* Blob 2 — cyan/sky, top-right, 13s */}
      <div
        className="absolute rounded-full opacity-25"
        style={{
          width: 500,
          height: 500,
          top: '-100px',
          right: '-100px',
          background: 'radial-gradient(circle, #0891b2, #0284c7)',
          filter: 'blur(90px)',
          animation: 'blob2 13s ease-in-out infinite',
        }}
      />
      {/* Blob 3 — teal/emerald, bottom-center, 21s */}
      <div
        className="absolute rounded-full opacity-20"
        style={{
          width: 700,
          height: 700,
          bottom: '-200px',
          left: '30%',
          background: 'radial-gradient(circle, #0d9488, #059669)',
          filter: 'blur(90px)',
          animation: 'blob3 21s ease-in-out infinite',
        }}
      />
      {/* Blob 4 — pink/purple, mid-center, 16s with rotation */}
      <div
        className="absolute rounded-full opacity-20"
        style={{
          width: 450,
          height: 450,
          top: '40%',
          left: '45%',
          background: 'radial-gradient(circle, #db2777, #9333ea)',
          filter: 'blur(90px)',
          animation: 'blob4 16s ease-in-out infinite',
        }}
      />
    </div>
  )
}
