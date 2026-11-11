import { AccessShell } from "@/components/admin/AccessShell"
import { PasswordForm } from "@/components/admin/AccessForms"

export default function UpdatePasswordPage() {
  return (
    <AccessShell title="Nueva contraseña">
      <PasswordForm />
    </AccessShell>
  )
}
