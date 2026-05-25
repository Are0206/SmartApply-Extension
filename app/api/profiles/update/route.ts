import { NextResponse } from "next/server"

// Endpoint alternativo para actualizar perfil por id vía POST.
// Esto evita problemas con rutas dinámicas en entornos POC.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body || {}
    if (!id) {
      return NextResponse.json({ success: false, message: "Falta el campo id" }, { status: 400 })
    }

    const { updateProfileById } = await import("@/lib/store")
    const updated = updateProfileById(String(id).trim(), data)
    if (!updated) {
      return NextResponse.json({ success: false, message: "Perfil no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated, message: "Perfil actualizado (via /update)" })
  } catch (err) {
    return NextResponse.json({ success: false, message: "Error al procesar la solicitud" }, { status: 400 })
  }
}
