import { NextResponse } from "next/server"
import { getAllProfiles, createProfile, getActiveProfileId, addActionLog } from "@/lib/store"

// GET: obtener todos los perfiles y cuál está activo (HU-10)
export async function GET() {
  const profiles = getAllProfiles()
  const activeProfileId = getActiveProfileId()
  return NextResponse.json({
    success: true,
    data: profiles,
    activeProfileId,
    message: "Perfiles obtenidos exitosamente",
  })
}

// POST: crear un nuevo perfil (HU-10)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newProfile = createProfile(body)
    try {
      addActionLog({ action: "Perfil creado", details: `Perfil ${newProfile.id} creado`, fields: ["nombre","email"], url: "sistema", status: "completado" })
    } catch (e) {}
    return NextResponse.json({
      success: true,
      data: newProfile,
      message: "Perfil creado exitosamente",
    })
  } catch {
    return NextResponse.json(
      { success: false, message: "Error al crear el perfil" },
      { status: 400 }
    )
  }
}
