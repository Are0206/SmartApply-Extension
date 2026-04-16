"use client"

import { useState, useEffect } from "react"
import { updateUserProfile, createUserProfile, logAction, type UserProfile } from "@/lib/api"
import ProfileSelector from "@/components/profile-selector"

interface ProfileTabProps {
  profile: UserProfile | null
  profiles: UserProfile[]
  activeProfileId: string
  onSave: () => void
}

/**
 * Pestaña para gestionar perfiles (HU-10 + edición existente)
 */
export default function ProfileTab({ profile, profiles, activeProfileId, onSave }: ProfileTabProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        nombre: profile.nombre || "",
        apellido: profile.apellido || "",
        email: profile.email || "",
        telefono: profile.telefono || "",
        titulo_profesional: profile.titulo_profesional || "",
        ubicacion: profile.ubicacion || "",
        linkedin: profile.linkedin || "",
        resumen: profile.resumen || "",
      })
      // Limpiar modo creación al cambiar perfil activo
      setIsCreatingNew(false)
      setFeedbackMessage("")
    }
  }, [profile, activeProfileId])

  const profileFields = [
    { key: "nombre", label: "Nombre" },
    { key: "apellido", label: "Apellido" },
    { key: "email", label: "Email" },
    { key: "telefono", label: "Teléfono" },
    { key: "titulo_profesional", label: "Título profesional" },
    { key: "ubicacion", label: "Ubicación" },
    { key: "linkedin", label: "LinkedIn" },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleCreateNew() {
    setIsCreatingNew(true)
    setFeedbackMessage("")
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      titulo_profesional: "",
      ubicacion: "",
      linkedin: "",
      resumen: "",
    })
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFeedbackMessage("")

    try {
      if (isCreatingNew) {
        // Crear nuevo perfil (HU-10)
        const created = await createUserProfile(formData)
        if (!created) {
          setFeedbackMessage("Error al crear el perfil.")
          setIsSaving(false)
          return
        }
        await logAction({
          action: "Perfil creado",
          details: `Nuevo perfil: ${formData.nombre} ${formData.apellido}`,
          fields: Object.keys(formData),
          status: "completado",
        })
        setFeedbackMessage("Perfil creado correctamente")
        setIsCreatingNew(false)
      } else {
        // Actualizar perfil activo
        const updateSuccess = await updateUserProfile(formData)
        if (!updateSuccess) {
          setFeedbackMessage("Error al guardar el perfil.")
          setIsSaving(false)
          return
        }
        await logAction({
          action: "Perfil actualizado",
          details: `Campos actualizados: ${Object.keys(formData).join(", ")}`,
          fields: Object.keys(formData),
          status: "completado",
        })
        setFeedbackMessage("Perfil guardado correctamente")
      }

      setIsSaving(false)
      onSave()
    } catch (error) {
      console.error("Error al guardar perfil:", error)
      setFeedbackMessage("Error inesperado. Intenta de nuevo.")
      setIsSaving(false)
    }
  }

  return (
    <div>
      {/* Selector de perfiles (HU-10) */}
      <ProfileSelector
        profiles={profiles}
        activeProfileId={activeProfileId}
        onProfileChange={onSave}
        onCreateNew={handleCreateNew}
      />

      {/* Formulario de edición / creación */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {isCreatingNew ? "Crear nuevo perfil" : "Editar perfil activo"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {isCreatingNew
            ? "Ingresa los datos del nuevo perfil."
            : "Estos datos se usarán para autocompletar formularios."}
        </p>

        {!profile && !isCreatingNew ? (
          <p className="text-muted-foreground">Cargando perfil...</p>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {profileFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    name={field.key}
                    value={formData[field.key] || ""}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Resumen profesional
              </label>
              <textarea
                name="resumen"
                rows={3}
                value={formData.resumen || ""}
                onChange={handleInputChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isSaving
                  ? "Guardando..."
                  : isCreatingNew
                  ? "Crear perfil"
                  : "Guardar perfil"}
              </button>

              {isCreatingNew && (
                <button
                  type="button"
                  onClick={() => { setIsCreatingNew(false); setFeedbackMessage("") }}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:opacity-80 transition-opacity"
                >
                  Cancelar
                </button>
              )}

              {feedbackMessage && (
                <span
                  className={`text-sm font-medium ${
                    feedbackMessage.includes("Error") ? "text-destructive" : "text-primary"
                  }`}
                >
                  {feedbackMessage}
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
