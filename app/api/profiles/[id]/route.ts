import { NextResponse } from "next/server"
import { deleteProfile, getAllProfiles } from "@/lib/store"

// DELETE: eliminar un perfil por ID (HU-10)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const deleted = deleteProfile(id)

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

// GET: obtener un perfil por ID (HU-10)
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const profiles = getAllProfiles()
  const profile = profiles.find((p) => p.id === id)

  if (!profile) {
    return NextResponse.json(
      { success: false, message: "Perfil no encontrado" },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: profile })
}
