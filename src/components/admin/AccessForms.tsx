"use client"

import Link from "next/link"
import { useActionState } from "react"
import { login, requestPasswordReset, updatePassword } from "@/lib/actions/auth"
import { buttonClass, fieldClass, labelClass } from "@/components/ui/controls"
import type { ActionState } from "@/types/content"

export function LoginForm({ nextPath, notice }: { nextPath?: string; notice?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, {})

  return (
    <form action={action} className="grid gap-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {notice ? <p className="text-sm text-danger">{notice}</p> : null}
      <div>
        <label className={labelClass} htmlFor="email">
          Correo
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={fieldClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Ingresando…" : "Entrar"}
      </button>
      <Link href="/admin/recuperar" className="text-sm underline decoration-line underline-offset-4">
        Olvidé mi contraseña
      </Link>
    </form>
  )
}

export function RecoveryForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(requestPasswordReset, {})

  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className={labelClass} htmlFor="email">
          Correo
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={fieldClass} />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm">
          {state.ok}
        </p>
      ) : null}
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </button>
      <Link href="/admin/login" className="text-sm underline decoration-line underline-offset-4">
        Volver
      </Link>
    </form>
  )
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(updatePassword, {})

  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className={labelClass} htmlFor="password">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="confirmation">
          Repetir contraseña
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={fieldClass}
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Guardando…" : "Actualizar contraseña"}
      </button>
    </form>
  )
}
