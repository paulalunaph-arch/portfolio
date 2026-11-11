import { DashboardStats } from "@/components/admin/DashboardStats"
import { requireAdmin } from "@/lib/auth"
import { getDashboard } from "@/lib/data/admin"

export default async function DashboardPage() {
  const { supabase, email } = await requireAdmin()
  const data = await getDashboard(supabase)

  return (
    <div>
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Estudio</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Panel</h1>
      {email ? <p className="mt-3 text-sm text-mute">{email}</p> : null}
      <div className="mt-10">
        <DashboardStats data={data} />
      </div>
    </div>
  )
}
