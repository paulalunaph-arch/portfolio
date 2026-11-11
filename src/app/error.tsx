"use client"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5">
      <h1 className="font-serif text-5xl tracking-tight">No se pudo mostrar esta página.</h1>
      <button type="button" onClick={reset} className="mt-8 text-left text-sm underline underline-offset-4">
        Reintentar
      </button>
    </main>
  )
}
