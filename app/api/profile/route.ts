import { NextResponse } from "next/server"
import { getProfile, updateProfile, resetProfile } from "@/lib/store"

// GET profile from API
export async function GET() {
  const profile = getProfile()
  return NextResponse.json({
    success: true,
    data: profile,
    message: "Perfil obtenido exitosamente",
  })
}

// PUT to update profile
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const updated = updateProfile(body)
    return NextResponse.json({
      success: true,
      data: updated,
      message: "Perfil actualizado exitosamente",
    })
  } catch {
    return NextResponse.json(
      { success: false, message: "Error al actualizar el perfil" },
      { status: 400 }
    )
  }
}

// POST to reset profile to defaults
export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (body.action === "reset") {
      const reset = resetProfile()
      return NextResponse.json({
        success: true,
        data: reset,
        message: "Perfil restablecido a valores predeterminados",
      })
    }
    return NextResponse.json(
      { success: false, message: "Accion no reconocida" },
      { status: 400 }
    )
  } catch {
    return NextResponse.json(
      { success: false, message: "Error en la solicitud" },
      { status: 400 }
    )
  }
}
