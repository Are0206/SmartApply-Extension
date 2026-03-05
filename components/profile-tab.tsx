"use client"

import { useState } from "react"
import { updateUserProfile, logAction, type UserProfile } from "@/lib/api"

interface ProfileTabProps {
  profile: UserProfile | null
  onSave: () => void
}

/**
 * Pestaña para crear y editar el perfil del usuario
 * 
 * Permite guardar información personal que será usada
 * para autocompletar formularios automáticamente.
 */
export default function ProfileTab({ profile, onSave }: ProfileTabProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState("")

  /**
   * Define los campos del formulario que podrán ser editados
   */
  const profileFields = [
    { key: "nombre", label: "Nombre" },
    { key: "apellido", label: "Apellido" },
    { key: "email", label: "Email" },
    { key: "telefono", label: "Teléfono" },
    { key: "titulo_profesional", label: "Título profesional" },
    { key: "ubicacion", label: "Ubicación" },
    { key: "linkedin", label: "LinkedIn" },
  ]

  /**
   * Maneja el envío del formulario de perfil
   * 
   * 1. Recolecta los datos del formulario
   * 2. Los envía a la API
   * 3. Registra la acción en la bitácora
   * 4. Recarga los datos globales
   */
  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFeedbackMessage("")

    try {
      // Recolectar datos del formulario
      const formData = new FormData(event.currentTarget)
      const profileData: Record<string, string> = {}
      
      formData.forEach((value, key) => {
        profileData[key] = value as string
      })

      // Actualizar el perfil en la API
      const updateSuccess = await updateUserProfile(profileData)

      if (!updateSuccess) {
        setFeedbackMessage("Error al guardar el perfil. Intenta de nuevo.")
        setIsSaving(false)
        return
      }

      // Registrar la acción en la bitácora
      await logAction({
        action: "Perfil actualizado",
        details: `Se actualizaron los campos: ${Object.keys(profileData).join(", ")}`,
        fields: Object.keys(profileData),
        status: "completado",
      })

      setFeedbackMessage("Perfil guardado correctamente")
      setIsSaving(false)
      
      // Recargar todos los datos
      onSave()
    } catch (error) {
      console.error("Error al guardar perfil:", error)
      setFeedbackMessage("Error inesperado. Por favor intenta de nuevo.")
      setIsSaving(false)
    }
  }

  // Mostrar mensaje de carga mientras se obtiene el perfil
  if (!profile) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Crear / Editar perfil
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Estos datos se usarán para autocompletar formularios de manera
        inteligente.
      </p>

      <form onSubmit={handleProfileSubmit} className="space-y-4">
        {/* Campos de datos personales en grid */}
        <div className="grid grid-cols-2 gap-4">
          {profileFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {field.label}
              </label>
              <input
                type="text"
                name={field.key}
                defaultValue={profile[field.key] || ""}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>

        {/* Campo para resumen profesional */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Resumen profesional
          </label>
          <textarea
            name="resumen"
            rows={3}
            defaultValue={profile.resumen || ""}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSaving ? "Guardando..." : "Guardar perfil"}
          </button>
          
          {/* Mensaje de resultado */}
          {feedbackMessage && (
            <span
              className={`text-sm font-medium ${
                feedbackMessage.includes("Error")
                  ? "text-destructive"
                  : "text-primary"
              }`}
            >
              {feedbackMessage}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
