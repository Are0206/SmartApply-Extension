"use client"

import { useState } from "react"
import { type UserProfile } from "@/lib/api"
import { setActiveProfile, deleteUserProfile } from "@/lib/api"

interface ProfileSelectorProps {
  profiles: UserProfile[]
  activeProfileId: string
  onProfileChange: () => void
  onCreateNew: () => void
}

/**
 * Selector de perfil activo (HU-10)
 * Permite al usuario elegir qué perfil usar para autocompletar.
 */
export default function ProfileSelector({
  profiles,
  activeProfileId,
  onProfileChange,
  onCreateNew,
}: ProfileSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSelect(id: string) {
    if (id === activeProfileId) return
    setLoading(id)
    await setActiveProfile(id)
    onProfileChange()
    setLoading(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este perfil?")) return
    setLoading(id)
    await deleteUserProfile(id)
    onProfileChange()
    setLoading(null)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Perfiles guardados</h2>
          <p className="text-sm text-muted-foreground">
            Selecciona el perfil activo para autocompletar formularios.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          + Nuevo perfil
        </button>
      </div>

      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No hay perfiles.</p>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId
            const isLoading = loading === profile.id

            return (
              <div
                key={profile.id}
                className={`flex items-center justify-between rounded-md border px-4 py-3 transition-colors cursor-pointer ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/40"
                }`}
                onClick={() => handleSelect(profile.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Indicador de activo */}
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      isActive ? "bg-primary" : "bg-muted"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {profile.nombre} {profile.apellido}
                      {isActive && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          Activo
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{profile.titulo_profesional}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {!isActive && (
                    <button
                      onClick={() => handleSelect(profile.id)}
                      disabled={isLoading}
                      className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "..." : "Activar"}
                    </button>
                  )}
                  {profiles.length > 1 && (
                    <button
                      onClick={() => handleDelete(profile.id)}
                      disabled={isLoading}
                      className="rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
