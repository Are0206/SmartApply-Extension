import { prisma } from "./prisma"

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
  github: string
  salario: string
  disponibilidad: string
  isActive?: boolean
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

// ==================== HELPERS ====================

function parseProfile(p: {
  id: string; nombre: string; apellido: string; email: string
  telefono: string; linkedin: string; portfolio: string; ubicacion: string
  titulo_profesional: string; resumen: string; experiencia: string
  educacion: string; habilidades: string; github: string; salario: string
  disponibilidad: string; isActive: boolean; createdAt: Date; updatedAt: Date
}): UserProfile {
  return {
    ...p,
    habilidades: JSON.parse(p.habilidades || "[]"),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

function parseLog(l: {
  id: string; action: string; details: string; fields: string
  url: string; status: string; timestamp: Date
}): ActionLog {
  return {
    ...l,
    fields: JSON.parse(l.fields || "[]"),
    status: l.status as ActionLog["status"],
    timestamp: l.timestamp.toISOString(),
  }
}

// Crea el perfil inicial si la BD está vacía
async function seedIfEmpty() {
  const count = await prisma.profile.count()
  if (count > 0) return

  await prisma.profile.create({
    data: {
      nombre: "Carlos",
      apellido: "Martínez",
      email: "carlos.martinez@email.com",
      telefono: "+506 8888-1234",
      linkedin: "linkedin.com/in/carlosmartinez",
      portfolio: "carlosmartinez.dev",
      ubicacion: "San José, Costa Rica",
      titulo_profesional: "Ingeniero de Software Full-Stack",
      resumen: "Ingeniero de software con 3 años de experiencia en desarrollo web, especializado en React, Node.js y Python.",
      experiencia: "Desarrollador Full-Stack en TechCorp (2023-presente). Practicante en DevShop (2022-2023).",
      educacion: "Bachillerato en Ingeniería en Computación - Universidad de Costa Rica (2024)",
      habilidades: JSON.stringify(["JavaScript", "TypeScript", "Python", "React", "Node.js", "SQL", "Git", "Docker"]),
      isActive: true,
    },
  })

  await prisma.actionLog.create({
    data: {
      action: "Perfil creado",
      details: "Se creó el perfil de usuario inicial con datos de ejemplo",
      fields: JSON.stringify(["nombre", "email", "telefono"]),
      url: "sistema",
      status: "completado",
    },
  })
}

// ==================== PERFIL ACTIVO ====================

export async function getProfile(): Promise<UserProfile> {
  await seedIfEmpty()
  const profile = await prisma.profile.findFirst({ where: { isActive: true } })
    ?? await prisma.profile.findFirst()
  if (!profile) throw new Error("No hay perfiles en la base de datos")
  return parseProfile(profile)
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  await seedIfEmpty()
  const profiles = await prisma.profile.findMany({ orderBy: { createdAt: "asc" } })
  return profiles.map(parseProfile)
}

export async function getActiveProfileId(): Promise<string> {
  await seedIfEmpty()
  const active = await prisma.profile.findFirst({ where: { isActive: true } })
    ?? await prisma.profile.findFirst()
  return active?.id ?? ""
}

export async function setActiveProfile(id: string): Promise<UserProfile | null> {
  const target = await prisma.profile.findUnique({ where: { id } })
  if (!target) return null
  await prisma.profile.updateMany({ data: { isActive: false } })
  const updated = await prisma.profile.update({ where: { id }, data: { isActive: true } })
  return parseProfile(updated)
}

export async function createProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const habilidades = Array.isArray(data.habilidades)
    ? JSON.stringify(data.habilidades)
    : JSON.stringify([])

  const profile = await prisma.profile.create({
    data: {
      nombre: data.nombre ?? "",
      apellido: data.apellido ?? "",
      email: data.email ?? "",
      telefono: data.telefono ?? "",
      linkedin: data.linkedin ?? "",
      portfolio: data.portfolio ?? "",
      ubicacion: data.ubicacion ?? "",
      titulo_profesional: data.titulo_profesional ?? "",
      resumen: data.resumen ?? "",
      experiencia: data.experiencia ?? "",
      educacion: data.educacion ?? "",
      habilidades,
      github: data.github ?? "",
      salario: data.salario ?? "",
      disponibilidad: data.disponibilidad ?? "",
      isActive: false,
    },
  })
  return parseProfile(profile)
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const activeId = await getActiveProfileId()
  return updateProfileById(activeId, data) as Promise<UserProfile>
}

export async function updateProfileById(id: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
  const exists = await prisma.profile.findUnique({ where: { id } })
  if (!exists) return null

  const updateData: Record<string, unknown> = { ...data }
  delete updateData.id
  delete updateData.createdAt
  delete updateData.updatedAt
  delete updateData.isActive

  if (Array.isArray(data.habilidades)) {
    updateData.habilidades = JSON.stringify(data.habilidades)
  } else if (typeof data.habilidades === "string") {
    const raw = data.habilidades as string
    try { JSON.parse(raw); updateData.habilidades = raw }
    catch { updateData.habilidades = JSON.stringify(raw.split(",").map((s: string) => s.trim()).filter(Boolean)) }
  }

  const updated = await prisma.profile.update({ where: { id }, data: updateData })
  return parseProfile(updated)
}

export async function deleteProfile(id: string): Promise<boolean> {
  const count = await prisma.profile.count()
  if (count <= 1) return false

  const target = await prisma.profile.findUnique({ where: { id } })
  if (!target) return false

  await prisma.profile.delete({ where: { id } })

  if (target.isActive) {
    const next = await prisma.profile.findFirst()
    if (next) await prisma.profile.update({ where: { id: next.id }, data: { isActive: true } })
  }
  return true
}

export async function resetProfile(): Promise<UserProfile> {
  const activeId = await getActiveProfileId()
  const reset = await prisma.profile.update({
    where: { id: activeId },
    data: {
      nombre: "Carlos", apellido: "Martínez",
      email: "carlos.martinez@email.com", telefono: "+506 8888-1234",
      linkedin: "linkedin.com/in/carlosmartinez", portfolio: "carlosmartinez.dev",
      ubicacion: "San José, Costa Rica",
      titulo_profesional: "Ingeniero de Software Full-Stack",
      resumen: "Ingeniero de software con 3 años de experiencia en desarrollo web.",
      experiencia: "Desarrollador Full-Stack en TechCorp (2023-presente).",
      educacion: "Bachillerato en Ingeniería en Computación - UCR (2024)",
      habilidades: JSON.stringify(["JavaScript", "TypeScript", "Python", "React", "Node.js"]),
    },
  })
  return parseProfile(reset)
}

// ==================== BITÁCORA ====================

export async function getActionLogs(): Promise<ActionLog[]> {
  const logs = await prisma.actionLog.findMany({ orderBy: { timestamp: "desc" } })
  return logs.map(parseLog)
}

export async function addActionLog(
  log: Omit<ActionLog, "id" | "timestamp">
): Promise<ActionLog> {
  const created = await prisma.actionLog.create({
    data: {
      action: log.action,
      details: log.details,
      fields: JSON.stringify(log.fields ?? []),
      url: log.url ?? "desconocido",
      status: log.status ?? "completado",
    },
  })
  return parseLog(created)
}

export async function clearActionLogs(): Promise<void> {
  await prisma.actionLog.deleteMany()
}
