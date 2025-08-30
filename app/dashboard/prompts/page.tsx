"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { prompts, DEFAULT_PROMPTS } from "@/lib/storage"
import { Copy, Save, RotateCcw, Download, Upload, Bot, FileText, Search } from "lucide-react"

export default function PromptsPage() {
  const { toast } = useToast()
  const [promptData, setPromptData] = useState(DEFAULT_PROMPTS)
  const [charCounts, setCharCounts] = useState({
    a1: 0,
    a2: 0,
    a3: 0,
  })
  const [savingStates, setSavingStates] = useState({
    a1: false,
    a2: false,
    a3: false,
  })

  useEffect(() => {
    const loaded = prompts.load()
    setPromptData(loaded)
    setCharCounts({
      a1: loaded.a1.length,
      a2: loaded.a2.length,
      a3: loaded.a3.length,
    })
  }, [])

  const handlePromptChange = (key: keyof typeof promptData, value: string) => {
    setPromptData((prev) => ({ ...prev, [key]: value }))
    setCharCounts((prev) => ({ ...prev, [key]: value.length }))
  }

  const handleSaveIndividual = (key: keyof typeof promptData, title: string) => {
    setSavingStates((prev) => ({ ...prev, [key]: true }))

    setTimeout(() => {
      const currentPrompts = prompts.load()
      const updatedPrompts = { ...currentPrompts, [key]: promptData[key] }
      prompts.save(updatedPrompts)

      setSavingStates((prev) => ({ ...prev, [key]: false }))

      toast({
        title: "✅ Prompt salvo",
        description: `${title} foi salvo com sucesso.`,
      })
    }, 500)
  }

  const handleSave = () => {
    prompts.save(promptData)
    toast({
      title: "✅ Todos os prompts salvos",
      description: "Todos os prompts foram salvos com sucesso.",
    })
  }

  const handleReset = () => {
    setPromptData(DEFAULT_PROMPTS)
    setCharCounts({
      a1: DEFAULT_PROMPTS.a1.length,
      a2: DEFAULT_PROMPTS.a2.length,
      a3: DEFAULT_PROMPTS.a3.length,
    })
    prompts.reset()
    toast({
      title: "🔄 Prompts restaurados",
      description: "Os prompts foram restaurados para os valores padrão.",
    })
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "📋 Copiado",
        description: `${label} copiado para a área de transferência.`,
      })
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    const dataStr = prompts.export()
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "rca-prompts.json"
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "📁 Exportado",
      description: "Prompts exportados com sucesso.",
    })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        if (prompts.import(content)) {
          const imported = prompts.load()
          setPromptData(imported)
          setCharCounts({
            a1: imported.a1.length,
            a2: imported.a2.length,
            a3: imported.a3.length,
          })
          toast({
            title: "✅ Importado",
            description: "Prompts importados com sucesso.",
          })
        } else {
          throw new Error("Formato inválido")
        }
      } catch (err) {
        toast({
          title: "❌ Erro",
          description: "Arquivo JSON inválido.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const promptConfigs = [
    {
      key: "a1" as const,
      title: "Agente Classificador",
      description: "Classifica problemas em categorias industriais específicas",
      icon: <Bot className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    {
      key: "a2" as const,
      title: "Agente de Causas",
      description: "Identifica e gera causas prováveis em formato estruturado",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-green-500",
    },
    {
      key: "a3" as const,
      title: "Agente de Investigação",
      description: "Desenvolve plano de investigação e análise dos 5 Porquês",
      icon: <Search className="h-5 w-5" />,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Configuração de Prompts</h1>
          <p className="text-muted-foreground text-lg">
            Configure os prompts dos agentes de IA para análise de falhas industriais
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" onClick={handleExport} className="shadow-sm bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" asChild className="shadow-sm bg-transparent">
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Importar
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </Button>
            <Button variant="outline" onClick={handleReset} className="shadow-sm bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          </div>
          <Button onClick={handleSave} className="shadow-lg w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar Todos os Prompts
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        {promptConfigs.map((config, index) => (
          <Card key={config.key} className="prompt-editor shadow-lg border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-4 w-full sm:w-auto">
                  <div className={`${config.color} p-3 rounded-xl text-white shadow-lg flex-shrink-0`}>
                    {config.icon}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-xl font-semibold">{config.title}</CardTitle>
                    <CardDescription className="text-base">{config.description}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <Badge variant="secondary" className="px-3 py-1 font-medium whitespace-nowrap">
                    {charCounts[config.key].toLocaleString()} caracteres
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(promptData[config.key], config.title)}
                    className="shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor={config.key} className="text-sm font-medium text-foreground">
                  Conteúdo do Prompt
                </Label>
                <Textarea
                  id={config.key}
                  value={promptData[config.key]}
                  onChange={(e) => handlePromptChange(config.key, e.target.value)}
                  className="min-h-[240px] font-mono text-sm leading-relaxed resize-none border-border/50 focus:border-accent bg-background/50 backdrop-blur-sm w-full"
                  placeholder={`Digite o prompt para o ${config.title.toLowerCase()}...`}
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                <span>Linhas: {promptData[config.key].split("\n").length}</span>
                <span>Palavras: {promptData[config.key].split(/\s+/).filter((word) => word.length > 0).length}</span>
                <span>Caracteres: {charCounts[config.key]}</span>
              </div>
              <Button
                onClick={() => handleSaveIndividual(config.key, config.title)}
                disabled={savingStates[config.key]}
                className="w-full shadow-md"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingStates[config.key] ? "Salvando..." : `Salvar ${config.title}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
