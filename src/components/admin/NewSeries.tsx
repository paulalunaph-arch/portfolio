import { SeriesForm } from "@/components/admin/SeriesForm"

export function NewSeries() {
  return (
    <div>
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Categoría nueva</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Crear</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-mute">
        Una categoría es un grupo de fotografías con su propia página en el portfolio. Podés crearla vacía y subir
        las fotos después. Si no la marcás como publicada, no se ve en el sitio.
      </p>
      <div className="mt-10">
        <SeriesForm />
      </div>
    </div>
  )
}
