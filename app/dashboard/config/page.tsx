"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { webhookUrl, resetAll } from "@/lib/storage"
import { Save, RotateCcw, AlertTriangle, Settings, Moon, Sun, Monitor, Download, Upload, Palette } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ConfigPage() {
  const { toast } = useToast()
  const [webhookURL, setWebhookURL] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState("dark")
  const [autoSave, setAutoSave] = useState(true)
  const [notifications, setNotifications] = useState(true)

  useEffect(() => {
    setWebhookURL(webhookUrl.load())
    const savedTheme = localStorage.getItem("rca_theme") || "dark"
    const savedAutoSave = localStorage.getItem("rca_auto_save") !== "false"
    const savedNotifications = localStorage.getItem("rca_notifications") !== "false"

    setTheme(savedTheme)
    setAutoSave(savedAutoSave)
    setNotifications(savedNotifications)

    // Aplicar tema imediatamente
    applyTheme(savedTheme)
  }, [])

  const handleSaveWebhookURL = () => {
    setIsLoading(true)

    setTimeout(() => {
      webhookUrl.save(webhookURL)
      setIsLoading(false)
      toast({
        title: "✅ Configuração salva",
        description: "URL do webhook foi salva com sucesso.",
      })
    }, 300)
  }

  const handleSavePreferences = () => {
    localStorage.setItem("rca_theme", theme)
    localStorage.setItem("rca_auto_save", autoSave.toString())
    localStorage.setItem("rca_notifications", notifications.toString())

    applyTheme(theme)

    toast({
      title: "✅ Preferências salvas",
      description: "Suas configurações foram salvas com sucesso.",
    })
  }

  const handleExportData = () => {
    try {
      const data = {
        prompts: JSON.parse(localStorage.getItem("rca_prompts") || "{}"),
        webhookUrl: localStorage.getItem("rca_webhook_url") || "",
        theme: localStorage.getItem("rca_theme") || "dark",
        autoSave: localStorage.getItem("rca_auto_save") !== "false",
        notifications: localStorage.getItem("rca_notifications") !== "false",
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `rca-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: "📁 Backup criado",
        description: "Seus dados foram exportados com sucesso.",
      })
    } catch (error) {
      toast({
        title: "❌ Erro no backup",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      })
    }
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (data.prompts) localStorage.setItem("rca_prompts", JSON.stringify(data.prompts))
        if (data.webhookUrl) localStorage.setItem("rca_webhook_url", data.webhookUrl)
        if (data.theme) localStorage.setItem("rca_theme", data.theme)
        if (typeof data.autoSave === "boolean") localStorage.setItem("rca_auto_save", data.autoSave.toString())
        if (typeof data.notifications === "boolean")
          localStorage.setItem("rca_notifications", data.notifications.toString())

        // Recarregar configurações
        setWebhookURL(webhookUrl.load())
        setTheme(data.theme || "dark")
        setAutoSave(data.autoSave !== false)
        setNotifications(data.notifications !== false)

        toast({
          title: "✅ Dados importados",
          description: "Backup restaurado com sucesso.",
        })
      } catch (error) {
        toast({
          title: "❌ Erro na importação",
          description: "Arquivo de backup inválido.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = "" // Reset input
  }

  const handleResetAll = () => {
    resetAll()
    setWebhookURL(webhookUrl.load())
    setTheme("dark")
    setAutoSave(true)
    setNotifications(true)
    toast({
      title: "🔄 Dados resetados",
      description: "Todos os dados foram resetados para os valores padrão. A autenticação foi mantida.",
    })
  }

  const isValidURL = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const applyTheme = (selectedTheme: string) => {
    const root = document.documentElement

    if (selectedTheme === "light") {
      root.classList.remove("dark")
      root.classList.add("light")
    } else if (selectedTheme === "dark") {
      root.classList.remove("light")
      root.classList.add("dark")
    } else {
      // Sistema - detectar preferência do sistema
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.remove("light", "dark")
      root.classList.add(systemPrefersDark ? "dark" : "light")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">⚙️ Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema RCA Console</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência e Preferências
            </CardTitle>
            <CardDescription>Personalize a interface e comportamento da aplicação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-select">Tema da Interface</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Escuro
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Claro
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Sistema
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Salvamento Automático</Label>
                  <p className="text-sm text-muted-foreground">Salvar automaticamente as alterações nos prompts</p>
                </div>
                <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notificações</Label>
                  <p className="text-sm text-muted-foreground">Mostrar notificações de sucesso e erro</p>
                </div>
                <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
              </div>
            </div>

            <Button onClick={handleSavePreferences}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração do Webhook
            </CardTitle>
            <CardDescription>Configure a URL padrão do webhook que será usada na execução</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL do Webhook</Label>
              <Input
                id="webhook-url"
                type="url"
                value={webhookURL}
                onChange={(e) => setWebhookURL(e.target.value)}
                placeholder="https://exemplo.com/webhook/..."
                className="font-mono text-sm"
              />
              {webhookURL && !isValidURL(webhookURL) && <p className="text-sm text-destructive">URL inválida</p>}
            </div>

            <Button onClick={handleSaveWebhookURL} disabled={!webhookURL || !isValidURL(webhookURL) || isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar URL"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💾 Backup e Restauração</CardTitle>
            <CardDescription>Faça backup dos seus dados ou restaure de um arquivo anterior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Dados
                </Button>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O backup inclui prompts, configurações de webhook, tema e preferências. Dados de execução não são
                incluídos por questões de privacidade.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Informações do Sistema</CardTitle>
            <CardDescription>Detalhes sobre a aplicação e configurações atuais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Aplicação:</span> RCA Console
                </div>
                <div>
                  <span className="font-medium">Versão:</span> 2.0.0
                </div>
                <div>
                  <span className="font-medium">Ambiente:</span> Produção
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Agentes:</span> 3 (A1, A2, A3)
                </div>
                <div>
                  <span className="font-medium">Armazenamento:</span> localStorage
                </div>
                <div>
                  <span className="font-medium">Tema:</span>{" "}
                  {theme === "dark" ? "Escuro" : theme === "light" ? "Claro" : "Sistema"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Gerenciamento de Dados
            </CardTitle>
            <CardDescription>Opções para resetar e gerenciar os dados armazenados localmente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> O reset irá apagar todos os prompts personalizados, configurações de webhook e
                dados de execução. A autenticação será mantida.
              </AlertDescription>
            </Alert>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar tudo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar reset completo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá resetar todos os dados para os valores padrão:
                    <br />• Prompts dos agentes (A1, A2, A3) • URL do webhook • Dados de execução anteriores •
                    Configurações de tema e preferências
                    <br />
                    <br />
                    <strong>A autenticação será mantida.</strong> Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll} className="bg-destructive hover:bg-destructive/90">
                    Resetar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Storage Information */}
        <Card>
          <CardHeader>
            <CardTitle>💽 Armazenamento Local</CardTitle>
            <CardDescription>Informações sobre os dados armazenados no navegador</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Prompts salvos:</span>
                <span className="text-muted-foreground">
                  {localStorage.getItem("rca_prompts") ? "Personalizados" : "Padrão"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>URL do webhook:</span>
                <span className="text-muted-foreground">
                  {localStorage.getItem("rca_webhook_url") ? "Personalizada" : "Padrão"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Última execução:</span>
                <span className="text-muted-foreground">
                  {localStorage.getItem("rca_last_response") ? "Disponível" : "Nenhuma"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Autenticação:</span>
                <span className="text-muted-foreground">{localStorage.getItem("rca_auth") ? "Ativa" : "Inativa"}</span>
              </div>
              <div className="flex justify-between">
                <span>Tema:</span>
                <span className="text-muted-foreground">
                  {theme === "dark" ? "Escuro" : theme === "light" ? "Claro" : "Sistema"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
