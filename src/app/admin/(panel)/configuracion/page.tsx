import { Suspense } from "react"
import { AssetUploader } from "@/components/admin/AssetUploader"
import { SettingsForm } from "@/components/admin/SettingsForm"
import { requireAdmin } from "@/lib/auth"
import { getAdminSettings } from "@/lib/data/admin"

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-mute">Abriendo la configuración…</p>}>
      <SettingsContent />
    </Suspense>
  )
}

async function SettingsContent() {
  const { supabase } = await requireAdmin()
  const settings = await getAdminSettings(supabase)

  return (
    <div>
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Sitio</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Configuración</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-mute">
        Desde acá se cambian los colores y los textos del sitio. Cada campo dice dónde aparece. No hace falta tocar el código.
      </p>
      <div className="mt-10">
        <SettingsForm settings={settings} />
      </div>
      <div className="mt-14 max-w-3xl">
        <AssetUploader
          kind="portrait"
          label="Retrato"
          description="La foto de Sobre mí. Si no hay retrato, esa página deja el espacio vacío."
          url={settings.portraitUrl}
          width={settings.portraitWidth}
          height={settings.portraitHeight}
          bytes={settings.portraitBytes}
        />
        <AssetUploader
          kind="featured"
          label="Imagen para compartir"
          description="La imagen que aparece cuando alguien comparte el enlace del sitio, por ejemplo en WhatsApp. No es la foto del inicio ni la portada de una categoría."
          url={settings.featuredImageUrl}
          width={settings.featuredWidth}
          height={settings.featuredHeight}
          bytes={settings.featuredBytes}
        />
      </div>
    </div>
  )
}
