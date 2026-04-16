import { NextResponse } from "next/server"
import { setActiveProfile, getActiveProfileId, getProfile } from "@/lib/store"

// GET: obtener el perfil activo (HU-10)
export async function GET() {
  const profile = getProfile()
  const activeProfileId = getActiveProfileId()
  return NextResponse.json({
    success: true,
    data: profile,
    activeProfileId,
    message: "Perfil activo obtenido exitosamente",
  })
}

// PUT: cambiar el perfil activo (HU-10)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Falta el campo requerido: id" },
        { status: 400 }
      )
    }

    const active = setActiveProfile(id)
    if (!active) {
      return NextResponse.json(
        { success: false, message: "Perfil no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: active,
      message: "Perfil activo actualizado exitosamente",
    })
  } catch {
    return NextResponse.json(
      { success: false, message: "Error al cambiar el perfil activo" },
      { status: 400 }
    )
  }
}
