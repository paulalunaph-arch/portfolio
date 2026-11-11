import { SeriesForm } from "@/components/admin/SeriesForm"

export function NewSeries() {
  return (
    <div>
      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-mute">Serie nueva</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Crear</h1>
      <div className="mt-10">
        <SeriesForm />
      </div>
    </div>
  )
}
