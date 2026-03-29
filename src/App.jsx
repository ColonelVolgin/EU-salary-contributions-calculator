import { BlobBackground } from '@/components/BlobBackground'
import EmployerCostCalculator from '@/components/EmployerCostCalculator'

export default function App() {
  return (
    <div className="min-h-screen relative" style={{ background: '#05080f' }}>
      <BlobBackground />
      <main className="relative max-w-5xl mx-auto px-4 py-8" style={{ zIndex: 1 }}>
        <EmployerCostCalculator />
      </main>
    </div>
  )
}
