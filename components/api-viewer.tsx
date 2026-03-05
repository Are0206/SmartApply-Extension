"use client"

import { useState } from "react"
import { fetchEndpoint } from "@/lib/api"

/**
 * Componente para visualizar y probar endpoints de la API
 * 
 * Permite seleccionar entre diferentes endpoints y ver sus
 * respuestas en tiempo real en formato JSON.
 */
export default function ApiViewer() {
  const [apiResponse, setApiResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState("/api/profile")

  const availableEndpoints = ["/api/profile", "/api/logs"]

  async function handleFetchEndpoint() {
    setIsLoading(true)
    try {
      const response = await fetchEndpoint(selectedEndpoint)
      setApiResponse(response)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Explorador de API
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Consulta los endpoints REST y visualiza las respuestas en tiempo real.
      </p>

      {/* Selector de endpoints */}
      <div className="flex gap-2 mb-4">
        {availableEndpoints.map((endpoint) => (
          <button
            key={endpoint}
            onClick={() => setSelectedEndpoint(endpoint)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedEndpoint === endpoint
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            GET {endpoint}
          </button>
        ))}
      </div>

      {/* Botón para ejecutar la consulta */}
      <button
        onClick={handleFetchEndpoint}
        disabled={isLoading}
        className="mb-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isLoading ? "Consultando..." : "Enviar solicitud"}
      </button>

      {/* Visualizador de respuesta */}
      {apiResponse && (
        <div className="rounded-md border border-border bg-background p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
            Respuesta JSON
          </p>
          <pre className="max-h-80 overflow-auto text-xs text-foreground font-mono whitespace-pre-wrap break-words">
            {apiResponse}
          </pre>
        </div>
      )}
    </div>
  )
}
