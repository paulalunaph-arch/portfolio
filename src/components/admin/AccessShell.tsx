export function AccessShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Estudio</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">{title}</h1>
      <div className="mt-10">{children}</div>
    </main>
  )
}
