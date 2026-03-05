/**
 * API Service Layer
 * 
 * Centraliza todas las llamadas a los endpoints REST para mantener
 * el código limpio y facilitar cambios en la API en el futuro.
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface UserProfile extends Record<string, unknown> {
  nombre: string
  apellido: string
  email: string
  telefono: string
  titulo_profesional: string
  ubicacion: string
  linkedin: string
  resumen?: string
}

export interface ActionLog {
  id?: string
  action: string
  details: string
  fields: string[]
  status: "completado" | "previsualizado" | "cancelado"
  timestamp?: string
}

/**
 * Obtiene el perfil del usuario desde la API
 */
export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/profile")
    const responseData = await response.json() as ApiResponse<UserProfile>
    
    if (!response.ok || !responseData.success) {
      console.error("Error al obtener perfil:", responseData.error)
      return null
    }
    
    return responseData.data || null
  } catch (error) {
    console.error("Error de red al obtener perfil:", error)
    return null
  }
}

/**
 * Actualiza el perfil del usuario
 */
export async function updateUserProfile(profileData: Record<string, string>): Promise<boolean> {
  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    })
    
    const responseData = await response.json() as ApiResponse
    
    if (!response.ok || !responseData.success) {
      console.error("Error al actualizar perfil:", responseData.error)
      return false
    }
    
    return true
  } catch (error) {
    console.error("Error de red al actualizar perfil:", error)
    return false
  }
}

/**
 * Obtiene el historial de acciones/logs
 */
export async function fetchActionLogs(): Promise<ActionLog[]> {
  try {
    const response = await fetch("/api/logs")
    const responseData = await response.json() as ApiResponse<ActionLog[]>
    
    if (!response.ok || !responseData.success) {
      console.error("Error al obtener logs:", responseData.error)
      return []
    }
    
    return responseData.data || []
  } catch (error) {
    console.error("Error de red al obtener logs:", error)
    return []
  }
}

/**
 * Registra una nueva acción en la bitácora
 */
export async function logAction(actionData: ActionLog): Promise<boolean> {
  try {
    const response = await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(actionData),
    })
    
    const responseData = await response.json() as ApiResponse
    
    if (!response.ok || !responseData.success) {
      console.error("Error al registrar acción:", responseData.error)
      return false
    }
    
    return true
  } catch (error) {
    console.error("Error de red al registrar acción:", error)
    return false
  }
}

/**
 * Obtiene la respuesta de un endpoint específico (para pruebas)
 */
export async function fetchEndpoint(endpoint: string): Promise<string> {
  try {
    const response = await fetch(endpoint)
    const responseData = await response.json()
    return JSON.stringify(responseData, null, 2)
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : "Error desconocido"}`
  }
}
