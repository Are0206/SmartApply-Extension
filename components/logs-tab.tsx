"use client"

import { type ActionLog } from "@/lib/api"

interface LogsTabProps {
  logs: ActionLog[]
  onRefresh: () => void
}

/**
 * Pestaña de bitácora de acciones
 * 
 * Muestra un historial de todas las acciones realizadas:
 * - Cambios en el perfil
 * - Autocompletados
 * - Envíos de formularios
 */
export default function LogsTab({ logs, onRefresh }: LogsTabProps) {
  
  async function handleClearLogs() {
    if (confirm("¿Estás seguro de que deseas borrar todo el historial?")) {
      try {
        // Usamos el puerto 5000 backend Python
        await fetch("http://localhost:5000/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clear" })
        });
        onRefresh(); // Actualiza la tabla para que se vea vacía
      } catch (error) {
        console.error("Error al limpiar historial", error);
      }
    }
  }
  /**
   * Mapeo de colores para los diferentes estados de acciones
   */
  const statusColorMap: Record<string, string> = {
    completado: "bg-primary/20 text-primary",
    previsualizado: "bg-blue-500/20 text-blue-400",
    cancelado: "bg-destructive/20 text-destructive",
  }

  /**
   * Formatea la fecha/hora al formato local del usuario
   */
  function formatActionTime(timestamp: string | undefined): string {
    if (!timestamp) return ""
    try {
      return new Date(timestamp).toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      })
    } catch {
      return timestamp
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Bitácora de acciones
          </h2>
          <p className="text-sm text-muted-foreground">
            Registro de todas las acciones del sistema.
          </p>
        </div>
        
        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={handleClearLogs}
            className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors"
          >
            Borrar historial
          </button>
          <button
            onClick={onRefresh}
            className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:opacity-80 transition-opacity"
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* Estado vacío */}
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Sin registros aún.
        </p>
      ) : (
        /* Lista de acciones */
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((logEntry, index) => {
            const statusColor =
              statusColorMap[logEntry.status] ||
              "bg-muted text-muted-foreground"

            return (
              <div
                key={logEntry.id || index}
                className="rounded-md border border-border bg-background p-3 flex items-start gap-3 hover:border-primary/30 transition-colors"
              >
                {/* Insignia de estado */}
                <span
                  className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${statusColor}`}
                >
                  {logEntry.status}
                </span>

                {/* Contenido de la acción */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {logEntry.action}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {logEntry.details}
                  </p>
                  {/* URL del sitio donde se realizó */}
                  {logEntry.url && logEntry.url !== "desconocido" && logEntry.url !== "" && (
                    <a
                      href={logEntry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block text-xs text-primary hover:underline truncate max-w-xs"
                      title={logEntry.url}
                    >
                      🔗 {(() => { try { return new URL(logEntry.url).hostname } catch { return logEntry.url } })()}
                    </a>
                  )}
                  {/* Campos afectados */}
                  {logEntry.fields && logEntry.fields.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {logEntry.fields.map((field) => (
                        <span
                          key={field}
                          className="inline-block px-1.5 py-0.5 text-xs bg-muted rounded text-muted-foreground"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatActionTime(logEntry.timestamp)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
