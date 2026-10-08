import { useEffect, useState } from 'react'

function App() {
  const [apiOk, setApiOk] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/health')
      .then((r) => setApiOk(r.ok))
      .catch(() => setApiOk(false))
  }, [])

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">DataHub</h1>
      <p role="status" className="mt-2 text-sm">
        {apiOk === null ? 'Comprobando API…' : apiOk ? 'API ok' : 'API no disponible'}
      </p>
    </main>
  )
}

export default App
