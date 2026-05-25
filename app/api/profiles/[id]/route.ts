import { NextResponse } from "next/server"
import { deleteProfile, getAllProfiles, updateProfileById } from "@/lib/store"

type Params = Promise<{ id: string }>

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { id } = await params
  const decoded = decodeURIComponent(id).trim()
  const deleted = await deleteProfile(decoded)
  if (!deleted) {
    return NextResponse.json({ success: false, message: "No se puede eliminar el único perfil existente" }, { status: 400 })
  }
  return NextResponse.json({ success: true, message: "Perfil eliminado exitosamente" })
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = await params
  const decoded = decodeURIComponent(id).trim()
  try {
    const body = await request.json()
    const updated = await updateProfileById(decoded, body)
    if (!updated) {
      return NextResponse.json({ success: false, message: "Perfil no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: updated, message: "Perfil actualizado" })
  } catch {
    return NextResponse.json({ success: false, message: "Error al actualizar perfil" }, { status: 400 })
  }
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params
  const decoded = decodeURIComponent(id).trim()
  const profiles = await getAllProfiles()
  const profile = profiles.find((p) => p.id === decoded)
  if (!profile) {
    return NextResponse.json({ success: false, message: "Perfil no encontrado" }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: profile })
}
