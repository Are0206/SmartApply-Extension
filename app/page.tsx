"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileTab from "@/components/profile-tab"
import TestFormTab from "@/components/test-form-tab"
import LogsTab from "@/components/logs-tab"
import ApiViewer from "@/components/api-viewer"
import {
  fetchUserProfile,
  fetchAllProfiles,
  fetchActionLogs,
  type UserProfile,
  type ActionLog,
} from "@/lib/api"

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string>("")
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])

  async function loadUserProfile() {
    const userData = await fetchUserProfile()
    if (userData) setProfile(userData)
  }

  async function loadAllProfiles() {
    const result = await fetchAllProfiles()
    if (result) {
      setProfiles(result.profiles)
      setActiveProfileId(result.activeProfileId)
    }
  }

  async function loadActionHistory() {
    const logs = await fetchActionLogs()
    setActionLogs(logs)
  }

  async function refreshAllData() {
    await Promise.all([loadUserProfile(), loadAllProfiles(), loadActionHistory()])
  }

  useEffect(() => {
    refreshAllData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            SA
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">SmartApply</h1>
            <p className="text-xs text-muted-foreground">
              POC - Extension para autocompletar formularios
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="demo">Demo</TabsTrigger>
            <TabsTrigger value="logs">Bitácora</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <ProfileTab
              profile={profile}
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSave={refreshAllData}
            />
          </TabsContent>

          <TabsContent value="api">
            <ApiViewer />
          </TabsContent>

          <TabsContent value="demo">
            <TestFormTab profile={profile} onAction={loadActionHistory} />
          </TabsContent>

          <TabsContent value="logs">
            <LogsTab logs={actionLogs} onRefresh={loadActionHistory} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
