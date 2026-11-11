import { AdminNav } from "@/components/admin/AdminNav"

export function AdminShell({
  email,
  children,
}: {
  email: string | null
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-paper md:flex">
      <AdminNav email={email} />
      <div className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</div>
    </div>
  )
}

export function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center px-6">
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Abriendo el estudio…</p>
    </div>
  )
}
