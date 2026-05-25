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

export interface UserProfile {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  titulo_profesional: string
  ubicacion: string
  linkedin: string
  resumen?: string
  [key: string]: unknown
}

export interface ActionLog {
  id?: string
  action: string
  details: string
  fields: string[]
  url?: string
  status: "completado" | "previsualizado" | "cancelado"
  timestamp?: string
}

// ==================== MULTI-PERFIL (HU-10) ====================

export interface ProfilesResponse {
  profiles: UserProfile[]
  activeProfileId: string
}

/** Obtiene todos los perfiles y el ID del activo */
export async function fetchAllProfiles(): Promise<ProfilesResponse | null> {
  try {
    const response = await fetch("/api/profiles")
    const data = await response.json() as { success: boolean; data: UserProfile[]; activeProfileId: string }
    if (!response.ok || !data.success) return null
    return { profiles: data.data, activeProfileId: data.activeProfileId }
  } catch {
    return null
  }
}

/** Crea un nuevo perfil */
export async function createUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    })
    const data = await response.json() as ApiResponse<UserProfile>
    if (!response.ok || !data.success) return null
    return data.data || null
  } catch {
    return null
  }
}

/** Cambia el perfil activo */
export async function setActiveProfile(id: string): Promise<boolean> {
  try {
    const response = await fetch("/api/profiles/active", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    const data = await response.json() as ApiResponse
    return response.ok && !!data.success
  } catch {
    return false
  }
}

/** Elimina un perfil por ID */
export async function deleteUserProfile(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/profiles/${id}`, { method: "DELETE" })
    const data = await response.json() as ApiResponse
    return response.ok && !!data.success
  } catch {
    return false
  }
}

// ==================== PERFIL ACTIVO ====================

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
