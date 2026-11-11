import { AssetUploader } from "@/components/admin/AssetUploader"
import { SettingsForm } from "@/components/admin/SettingsForm"
import { requireAdmin } from "@/lib/auth"
import { getAdminSettings } from "@/lib/data/admin"

export default async function SettingsPage() {
  const { supabase } = await requireAdmin()
  const settings = await getAdminSettings(supabase)

  return (
    <div>
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Sitio</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Configuración</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-mute">
        Estos textos aparecen en la portada, en Sobre mí y en Contacto. No hace falta tocar el código.
      </p>
      <div className="mt-10">
        <SettingsForm settings={settings} />
      </div>
      <div className="mt-14 max-w-3xl">
        <AssetUploader
          kind="portrait"
          label="Retrato"
          url={settings.portraitUrl}
          width={settings.portraitWidth}
          height={settings.portraitHeight}
          bytes={settings.portraitBytes}
        />
        <AssetUploader
          kind="featured"
          label="Fotografía destacada"
          url={settings.featuredImageUrl}
          width={settings.featuredWidth}
          height={settings.featuredHeight}
          bytes={settings.featuredBytes}
        />
      </div>
    </div>
  )
}
