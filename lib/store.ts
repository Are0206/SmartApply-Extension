/**
 * Data Store
 * 
 * Almacenamiento en memoria para esta POC.
 * En producción, esto sería reemplazado por una base de datos real
 * (PostgreSQL, MongoDB, Firebase, etc.)
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

/**
 * Perfil de usuario por defecto (datos de ejemplo)
 */
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
  habilidades: [
    "JavaScript",
    "TypeScript",
    "Python",
    "React",
    "Node.js",
    "SQL",
    "Git",
    "Docker",
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ==================== ESTADO GLOBAL ====================

/**
 * Perfil actual del usuario
 * Se inicia con los datos por defecto
 */
let profile: UserProfile = { ...defaultProfile }

/**
 * Historial de acciones/eventos
 * Se mantiene una lista de todas las operaciones realizadas
 */
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

/**
 * Obtiene una copia del perfil actual
 */
export function getProfile(): UserProfile {
  return { ...profile }
}

/**
 * Actualiza el perfil con los datos proporcionados
 * Automáticamente actualiza la fecha de modificación
 */
export function updateProfile(data: Partial<UserProfile>): UserProfile {
  profile = {
    ...profile,
    ...data,
    updatedAt: new Date().toISOString(),
  }
  return { ...profile }
}

/**
 * Reinicia el perfil a los valores por defecto
 */
export function resetProfile(): UserProfile {
  profile = { ...defaultProfile, updatedAt: new Date().toISOString() }
  return { ...profile }
}

// ==================== OPERACIONES DE BITÁCORA ====================

/**
 * Obtiene el historial de acciones ordenado por fecha descendente
 * (más recientes primero)
 */
export function getActionLogs(): ActionLog[] {
  return [...actionLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

/**
 * Añade una nueva entrada al historial de acciones
 * Genera automáticamente el ID y la marca de tiempo
 */
export function addActionLog(
  log: Omit<ActionLog, "id" | "timestamp">
): ActionLog {
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
