"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileTab from "@/components/profile-tab"
import TestFormTab from "@/components/test-form-tab"
import LogsTab from "@/components/logs-tab"
import ApiViewer from "@/components/api-viewer"
import { fetchUserProfile, fetchActionLogs, type UserProfile, type ActionLog } from "@/lib/api"

/**
 * Página principal de SmartApply
 * 
 * Proporciona las secciones para:
 * - Gestionar el perfil del usuario
 * - Probar autocompletado con formularios
 * - Explorar los endpoints de la API
 * - Visualizar el historial de acciones
 */
export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])

  /**
   * Carga el perfil del usuario desde la API
   */
  async function loadUserProfile() {
    const userData = await fetchUserProfile()
    if (userData) {
      setProfile(userData)
    }
  }

  /**
   * Carga el historial de acciones desde la API
   */
  async function loadActionHistory() {
    const logs = await fetchActionLogs()
    setActionLogs(logs)
  }

  /**
   * Recarga ambos datos (perfil e historial)
   * Se usa luego de guardar cambios
   */
  async function refreshAllData() {
    await loadUserProfile()
    await loadActionHistory()
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUserProfile()
    loadActionHistory()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Encabezado de la aplicación */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          {/* Logo */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            SA
          </div>
          
          {/* Información de la aplicación */}
          <div>
            <h1 className="text-lg font-semibold text-foreground">SmartApply</h1>
            <p className="text-xs text-muted-foreground">
              POC - Extension para autocompletar formularios
            </p>
          </div>
        </div>
      </header>

      {/* Contenido principal con pestañas */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Tabs defaultValue="perfil" className="w-full">
          {/* Navegación de pestañas */}
          <TabsList className="mb-6 grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="demo">Demo</TabsTrigger>
            <TabsTrigger value="logs">Bitácora</TabsTrigger>
          </TabsList>

          {/* Pestaña: Gestión del perfil */}
          <TabsContent value="perfil">
            <ProfileTab 
              profile={profile} 
              onSave={refreshAllData}
            />
          </TabsContent>

          {/* Pestaña: Explorador de API */}
          <TabsContent value="api">
            <ApiViewer />
          </TabsContent>

          {/* Pestaña: Demo de autocompletado */}
          <TabsContent value="demo">
            <TestFormTab 
              profile={profile} 
              onAction={loadActionHistory} 
            />
          </TabsContent>

          {/* Pestaña: Historial de acciones */}
          <TabsContent value="logs">
            <LogsTab 
              logs={actionLogs} 
              onRefresh={loadActionHistory} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
