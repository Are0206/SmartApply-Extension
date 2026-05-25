import { NextResponse } from "next/server"
import { updateProfileById } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body || {}
    if (!id) {
      return NextResponse.json({ success: false, message: "Falta el campo id" }, { status: 400 })
    }
    const updated = await updateProfileById(String(id).trim(), data)
    if (!updated) {
      return NextResponse.json({ success: false, message: "Perfil no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: updated, message: "Perfil actualizado (via /update)" })
  } catch {
    return NextResponse.json({ success: false, message: "Error al procesar la solicitud" }, { status: 400 })
  }
}
