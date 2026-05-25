/**
 * Data Store
 *
 * Almacenamiento en memoria para esta POC.
 * En producción, esto sería reemplazado por una base de datos real.
 */

// ==================== TIPOS ====================

export interface UserProfile {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  linkedin: string
  portfolio: string
  ubicacion: string
  titulo_profesional: string
  resumen: string
  experiencia: string
  educacion: string
  habilidades: string[]
  createdAt: string
  updatedAt: string
}

export interface ActionLog {
  id: string
  action: string
  details: string
  fields: string[]
  url: string
  timestamp: string
  status: "completado" | "previsualizado" | "cancelado"
}

// ==================== DATOS POR DEFECTO ====================

const defaultProfile: UserProfile = {
  id: "usr_001",
  nombre: "Carlos",
  apellido: "Martínez",
  email: "carlos.martinez@email.com",
  telefono: "+506 8888-1234",
  linkedin: "linkedin.com/in/carlosmartinez",
  portfolio: "carlosmartinez.dev",
  ubicacion: "San José, Costa Rica",
  titulo_profesional: "Ingeniero de Software Full-Stack",
  resumen:
    "Ingeniero de software con 3 años de experiencia en desarrollo web, especializado en React, Node.js y Python. Apasionado por crear soluciones eficientes y escalables.",
  experiencia:
    "Desarrollador Full-Stack en TechCorp (2023-presente). Practicante en DevShop (2022-2023).",
  educacion:
    "Bachillerato en Ingeniería en Computación - Universidad de Costa Rica (2024)",
  habilidades: ["JavaScript","TypeScript","Python","React","Node.js","SQL","Git","Docker"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ==================== ESTADO GLOBAL ====================

/** Lista de todos los perfiles (HU-10) */
let profiles: UserProfile[] = [{ ...defaultProfile }]

/** ID del perfil activo (HU-10) */
let activeProfileId: string = defaultProfile.id

/** Historial de acciones */
let actionLogs: ActionLog[] = [
  {
    id: "log_001",
    action: "Perfil creado",
    details: "Se creó el perfil de usuario inicial con datos de ejemplo",
    fields: ["nombre", "email", "telefono"],
    url: "sistema",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    status: "completado",
  },
]

// ==================== OPERACIONES DEL PERFIL ====================

/** Obtiene el perfil activo actual */
export function getProfile(): UserProfile {
  const active = profiles.find((p) => p.id === activeProfileId)
  return active ? { ...active } : { ...profiles[0] }
}

/** Obtiene todos los perfiles (HU-10) */
export function getAllProfiles(): UserProfile[] {
  return profiles.map((p) => ({ ...p }))
}

/** Obtiene el ID del perfil activo (HU-10) */
export function getActiveProfileId(): string {
  return activeProfileId
}

/** Selecciona un perfil como activo (HU-10) */
export function setActiveProfile(id: string): UserProfile | null {
  const found = profiles.find((p) => p.id === id)
  if (!found) return null
  activeProfileId = id
  return { ...found }
}

/** Crea un nuevo perfil vacío (HU-10) */
export function createProfile(data: Partial<UserProfile>): UserProfile {
  const newProfile: UserProfile = {
    ...defaultProfile,
    ...data,
    id: `usr_${String(Date.now()).slice(-6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  profiles.push(newProfile)
  return { ...newProfile }
}

/** Actualiza el perfil activo */
export function updateProfile(data: Partial<UserProfile>): UserProfile {
  profiles = profiles.map((p) => {
    if (p.id === activeProfileId) {
      return { ...p, ...data, id: p.id, updatedAt: new Date().toISOString() }
    }
    return p
  })
  return getProfile()
}

/**
 * Actualiza un perfil por ID (HU-06)
 * Retorna el perfil actualizado o null si no existe
 */
export function updateProfileById(id: string, data: Partial<UserProfile>): UserProfile | null {
  let found = false
  profiles = profiles.map((p) => {
    if (p.id === id) {
      found = true
      return { ...p, ...data, id: p.id, updatedAt: new Date().toISOString() }
    }
    return p
  })
  if (!found) return null
  const updated = profiles.find((p) => p.id === id)!
  return { ...updated }
}

/** Elimina un perfil por ID; no permite eliminar el último (HU-10) */
export function deleteProfile(id: string): boolean {
  if (profiles.length <= 1) return false
  profiles = profiles.filter((p) => p.id !== id)
  if (activeProfileId === id) {
    activeProfileId = profiles[0].id
  }
  return true
}

/** Reinicia el perfil activo a valores por defecto */
export function resetProfile(): UserProfile {
  profiles = profiles.map((p) => {
    if (p.id === activeProfileId) {
      return { ...defaultProfile, id: p.id, createdAt: p.createdAt, updatedAt: new Date().toISOString() }
    }
    return p
  })
  return getProfile()
}

// ==================== OPERACIONES DE BITÁCORA ====================

export function getActionLogs(): ActionLog[] {
  return [...actionLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

export function addActionLog(log: Omit<ActionLog, "id" | "timestamp">): ActionLog {
  const newLog: ActionLog = {
    ...log,
    id: `log_${String(actionLogs.length + 1).padStart(3, "0")}`,
    timestamp: new Date().toISOString(),
  }
  actionLogs.push(newLog)
  return newLog
}

export function clearActionLogs(): void {
  actionLogs = []
}
