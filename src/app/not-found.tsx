import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5">
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">404</p>
      <h1 className="mt-4 font-serif text-5xl tracking-tight">Esta página no está.</h1>
      <Link href="/" className="mt-8 text-sm underline underline-offset-4">
        Volver al inicio
      </Link>
    </main>
  )
}
