import { NextResponse } from "next/server"
import { getActionLogs, addActionLog, clearActionLogs } from "@/lib/store"

export async function GET() {
  const logs = await getActionLogs()
  return NextResponse.json({ success: true, data: logs, total: logs.length, message: "Bitacora obtenida exitosamente" })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.action === "clear") {
      await clearActionLogs()
      return NextResponse.json({ success: true, message: "Bitacora limpiada exitosamente" })
    }

    const { action, details, fields, url, status } = body
    if (!action || !details) {
      return NextResponse.json({ success: false, message: "Faltan campos requeridos: action, details" }, { status: 400 })
    }

    const newLog = await addActionLog({
      action,
      details,
      fields: fields || [],
      url: url || "desconocido",
      status: status || "completado",
    })
    return NextResponse.json({ success: true, data: newLog, message: "Accion registrada en la bitacora" })
  } catch {
    return NextResponse.json({ success: false, message: "Error al registrar la accion" }, { status: 400 })
  }
}
