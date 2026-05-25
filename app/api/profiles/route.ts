import { NextResponse } from "next/server"
import { getAllProfiles, createProfile, getActiveProfileId, addActionLog } from "@/lib/store"

export async function GET() {
  const profiles = await getAllProfiles()
  const activeProfileId = await getActiveProfileId()
  return NextResponse.json({ success: true, data: profiles, activeProfileId, message: "Perfiles obtenidos exitosamente" })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newProfile = await createProfile(body)
    await addActionLog({
      action: "Perfil creado",
      details: `Perfil ${newProfile.id} creado`,
      fields: ["nombre", "email"],
      url: "sistema",
      status: "completado",
    })
    return NextResponse.json({ success: true, data: newProfile, message: "Perfil creado exitosamente" })
  } catch {
    return NextResponse.json({ success: false, message: "Error al crear el perfil" }, { status: 400 })
  }
}
