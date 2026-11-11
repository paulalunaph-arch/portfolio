import { redirect } from "next/navigation"
import { Suspense } from "react"
import { connection } from "next/server"
import { AccessShell } from "@/components/admin/AccessShell"
import { LoginForm } from "@/components/admin/AccessForms"
import { getAdminSession } from "@/lib/auth"

const notices: Record<string, string> = {
  config: "Faltan las variables de Supabase en el servidor.",
  "sin-permiso": "Esta cuenta no tiene acceso al estudio.",
  auth: "No se pudo validar el enlace. Pedí uno nuevo.",
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  return (
    <Suspense fallback={<p className="px-5 py-20 text-sm text-mute">Cargando…</p>}>
      <LoginScreen searchParams={searchParams} />
    </Suspense>
  )
}

async function LoginScreen({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  await connection()
  const params = await searchParams
  const session = await getAdminSession()

  if (session?.isAdmin) {
    redirect("/admin/dashboard")
  }

  const nextPath = params.next?.startsWith("/admin") ? params.next : undefined

  return (
    <AccessShell title="Entrar">
      <LoginForm nextPath={nextPath} notice={params.error ? notices[params.error] : undefined} />
    </AccessShell>
  )
}
