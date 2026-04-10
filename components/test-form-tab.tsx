"use client"

import { useState } from "react"
import { logAction, type UserProfile } from "@/lib/api"

interface TestFormTabProps {
  profile: UserProfile | null
  onAction: () => void
}

/**
 * Demo de autocompletado automático con previsualizacion
 * 
 * Permite probar el flujo completo:
 * 1. Autocompletar datos desde el perfil
 * 2. Revisar en una previsualizacion
 * 3. Confirmar y enviar el formulario
 */
export default function TestFormTab({ profile, onAction }: TestFormTabProps) {
  // Estado del formulario
  const [testFormData, setTestFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    titulo: "",
    mensaje: "",
  })

  // Estados de interacción
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [hasBeenFilled, setHasBeenFilled] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  /**
   * Obtiene los datos del perfil del usuario y llena el formulario
   * Luego entra en modo previsualizacion
   */
  async function handleAutofillFromProfile() {
    if (!profile) return

    // Mapear datos del perfil al formulario
    const autofilledData = {
      nombre: `${profile.nombre || ""} ${profile.apellido || ""}`.trim(),
      email: profile.email || "",
      telefono: profile.telefono || "",
      titulo: profile.titulo_profesional || "",
      mensaje: profile.resumen || "",
    }

    setTestFormData(autofilledData)
    setHasBeenFilled(true)
    setIsPreviewMode(true)

    // Registrar acción de previsualizacion
    await logAction({
      action: "Autocompletado con previsualización",
      details: "Campos llenados: nombre, email, teléfono, título, mensaje",
      fields: ["nombre", "email", "telefono", "titulo", "mensaje"],
      status: "previsualizado",
    })

    onAction()
  }

  /**
   * Confirma el envío del formulario
   * Registra la acción completada y reinicia el demo
   */
  async function handleConfirmAndSubmit() {
    setIsPreviewMode(false)
    setIsSubmitted(true)

    // Registrar envío exitoso
    await logAction({
      action: "Formulario enviado",
      details: "El usuario confirmó y envió el formulario autocompletado",
      fields: Object.keys(testFormData),
      status: "completado",
    })

    onAction()
  }

  /**
   * Cancela la previsualizacion y limpia los datos
   */
  async function handleCancelAutofill() {
    setIsPreviewMode(false)
    setTestFormData({
      nombre: "",
      email: "",
      telefono: "",
      titulo: "",
      mensaje: "",
    })
    setHasBeenFilled(false)

    // Registrar cancelación
    await logAction({
      action: "Autocompletado cancelado",
      details: "El usuario canceló la previsualización y limpió los campos",
      fields: [],
      status: "cancelado",
    })

    onAction()
  }

  /**
   * Reinicia la demo a su estado inicial
   */
  function handleResetDemo() {
    setTestFormData({
      nombre: "",
      email: "",
      telefono: "",
      titulo: "",
      mensaje: "",
    })
    setHasBeenFilled(false)
    setIsSubmitted(false)
    setIsPreviewMode(false)
  }

  // Definición de campos del formulario
  const formFields = [
    { key: "nombre", label: "Nombre completo", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "telefono", label: "Teléfono", type: "tel" },
    { key: "titulo", label: "Puesto / Título", type: "text" },
  ]

  return (
    <div className="space-y-4">
      {/* Contenedor principal del formulario demo */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Demo: Autocompletar + Previsualización
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Este formulario simula un sitio de empleo. Presiona "Autocompletar"
          para llenar automáticamente los campos con tus datos de perfil.
        </p>

        {/* Botón para iniciar autocompletado */}
        {!isSubmitted && (
          <button
            onClick={handleAutofillFromProfile}
            disabled={!profile || hasBeenFilled}
            className="mb-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {hasBeenFilled ? "Ya autocompletado" : "Autocompletar desde perfil"}
          </button>
        )}

        {/* Banner de previsualización con acciones */}
        {isPreviewMode && (
          <div className="mb-4 rounded-md border border-primary/40 bg-primary/10 p-3 flex items-center justify-between">
            <span className="text-sm text-foreground font-medium">
              Modo previsualización — Revisa los datos antes de enviar
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmAndSubmit}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Confirmar y enviar
              </button>
              <button
                onClick={handleCancelAutofill}
                className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 transition-opacity"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Mensaje de envío exitoso */}
        {isSubmitted && (
          <div className="mb-4 rounded-md border border-primary/40 bg-primary/10 p-4 text-center">
            <p className="text-foreground font-semibold mb-1">
              ✓ Formulario enviado exitosamente
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Los datos fueron autocompletados y confirmados correctamente.
            </p>
            <button
              onClick={handleResetDemo}
              className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:opacity-90 transition-opacity"
            >
              Reiniciar demo
            </button>
          </div>
        )}

        {/* Campos del formulario */}
        <div className="grid grid-cols-2 gap-4">
          {formFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.key}
                value={testFormData[field.key as keyof typeof testFormData]}
                onChange={(e) =>
                  setTestFormData((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                readOnly={isPreviewMode}
                className={`w-full rounded-md border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
                  hasBeenFilled && !isSubmitted
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-background"
                } ${isPreviewMode ? "bg-muted/50 cursor-not-allowed" : "hover:border-primary/30"}`}
              />
            </div>
          ))}
        </div>

        {/* Campo de mensaje/resumen */}
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-foreground">
            Resumen profesional
          </label>
          <textarea
            name="mensaje"
            rows={3}
            value={testFormData.mensaje}
            onChange={(e) =>
              setTestFormData((prev) => ({
                ...prev,
                mensaje: e.target.value,
              }))
            }
            readOnly={isPreviewMode}
            className={`w-full rounded-md border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
              hasBeenFilled && !isSubmitted
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-background"
            } ${isPreviewMode ? "bg-muted/50 cursor-not-allowed" : "hover:border-primary/30"}`}
          />
        </div>
      </div>
    </div>
  )
}
