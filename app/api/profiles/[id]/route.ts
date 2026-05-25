import { NextResponse } from "next/server"
import { deleteProfile, getAllProfiles } from "@/lib/store"

// DELETE: eliminar un perfil por ID (HU-10)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const normalizedId = typeof id === 'string' ? decodeURIComponent(id).trim() : id
  const deleted = deleteProfile(normalizedId)

  if (!deleted) {
    return NextResponse.json(
      { success: false, message: "No se puede eliminar el único perfil existente" },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    message: "Perfil eliminado exitosamente",
  })
}

// PUT: actualizar un perfil por ID (HU-06)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const normalizedId = typeof id === 'string' ? decodeURIComponent(id).trim() : id
  try {
    const body = await request.json()
    // debug
    try { console.log('[API DEBUG] PUT /api/profiles/:id received id ->', JSON.stringify(normalizedId)); } catch (e) {}
    try { console.log('[API DEBUG] PUT body ->', JSON.stringify(body)); } catch (e) {}
    // lazy import to avoid circular
    const { updateProfileById } = await import("@/lib/store")
    const updated = updateProfileById(normalizedId, body)
    if (!updated) {
      return NextResponse.json({ success: false, message: "Perfil no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: updated, message: "Perfil actualizado" })
  } catch {
    return NextResponse.json({ success: false, message: "Error al actualizar perfil" }, { status: 400 })
  }
}

// GET: obtener un perfil por ID (HU-10)
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const normalizedId = typeof id === 'string' ? decodeURIComponent(id).trim() : id
  // DEBUG: log received id and available ids
  try { console.log('[API DEBUG] GET /api/profiles/:id received id ->', JSON.stringify(normalizedId)); } catch (e) {}
  const profiles = getAllProfiles()
  try { console.log('[API DEBUG] Available profile ids ->', profiles.map(p=>p.id)); } catch (e) {}
  const profile = profiles.find((p) => p.id === normalizedId)

  if (!profile) {
    return NextResponse.json(
      { success: false, message: "Perfil no encontrado" },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: profile })
}
