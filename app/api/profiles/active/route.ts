import { NextResponse } from "next/server"
import { setActiveProfile, getActiveProfileId, getProfile } from "@/lib/store"

export async function GET() {
  const profile = await getProfile()
  const activeProfileId = await getActiveProfileId()
  return NextResponse.json({ success: true, data: profile, activeProfileId, message: "Perfil activo obtenido exitosamente" })
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    if (!id) {
      return NextResponse.json({ success: false, message: "Falta el campo requerido: id" }, { status: 400 })
    }
    const active = await setActiveProfile(id)
    if (!active) {
      return NextResponse.json({ success: false, message: "Perfil no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: active, message: "Perfil activo actualizado exitosamente" })
  } catch {
    return NextResponse.json({ success: false, message: "Error al cambiar el perfil activo" }, { status: 400 })
  }
}
