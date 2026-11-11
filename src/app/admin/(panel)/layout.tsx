import { Suspense } from "react"
import { connection } from "next/server"
import { AdminFallback, AdminShell } from "@/components/admin/AdminShell"
import { requireAdmin } from "@/lib/auth"

export const instant = false
export const maxDuration = 60

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <Guarded>{children}</Guarded>
    </Suspense>
  )
}

async function Guarded({ children }: { children: React.ReactNode }) {
  await connection()
  const { email } = await requireAdmin()
  return <AdminShell email={email}>{children}</AdminShell>
}
