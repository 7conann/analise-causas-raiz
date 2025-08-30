"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bot, FileText, Search, Clock, CheckCircle, AlertCircle, RefreshCw, Activity, Eye } from "lucide-react"

interface AgentResponse {
  id: string
  agentName: string
  status: "pending" | "processing" | "completed" | "error"
  timestamp: string
  response?: any
  processingTime?: number
  error?: string
}

export default function MonitoringPage() {
  const [responses, setResponses] = useState<AgentResponse[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null)

  const agentConfigs = [
    {
      key: "a1",
      name: "Agente Classificador",
      description: "Resumo Técnico da Falha",
      icon: <Bot className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    {
      key: "a2",
      name: "Agente de Causas",
      description: "Plano de Investigação",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-green-500",
    },
    {
      key: "a3",
      name: "Agente de Investigação",
      description: "Investigação + 5 Porquês",
      icon: <Search className="h-5 w-5" />,
      color: "bg-purple-500",
    },
  ]

  useEffect(() => {
    // Carregar dados do localStorage
    loadResponses()

    // Escutar por novas respostas
    const handleNewResponse = (event: CustomEvent) => {
      const newResponse = event.detail
      setResponses((prev) => [...prev, newResponse])
    }

    window.addEventListener("agent-response" as any, handleNewResponse)
    return () => window.removeEventListener("agent-response" as any, handleNewResponse)
  }, [])

  const loadResponses = () => {
    try {
      const stored = localStorage.getItem("rca_agent_responses")
      if (stored) {
        setResponses(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Erro ao carregar respostas:", error)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      loadResponses()
      setIsRefreshing(false)
    }, 1000)
  }

  const clearResponses = () => {
    setResponses([])
    localStorage.removeItem("rca_agent_responses")
  }

  const processResponse = (response: any) => {
    if (typeof response === "string") {
      return response
    }

    if (typeof response === "object" && response !== null) {
      if (response.categoria_inferida || response.causas || response.observacoes) {
        let formatted = ""
        if (response.categoria_inferida) {
          formatted += `**Categoria:** ${response.categoria_inferida}\n\n`
        }
        if (response.causas) {
          formatted += `**Causas:**\n`
          if (Array.isArray(response.causas)) {
            response.causas.forEach((causa: any, index: number) => {
              if (typeof causa === "object" && causa !== null) {
                formatted += `\n${index + 1}. **${causa.titulo || causa.id || `Causa ${index + 1}`}**\n`
                if (causa.hipotese) formatted += `   • Hipótese: ${causa.hipotese}\n`
                if (causa.evidencias && Array.isArray(causa.evidencias)) {
                  formatted += `   • Evidências: ${causa.evidencias.join(", ")}\n`
                }
                if (causa.verificacoes && Array.isArray(causa.verificacoes)) {
                  formatted += `   • Verificações: ${causa.verificacoes.join(", ")}\n`
                }
                if (causa.prioridade) formatted += `   • Prioridade: ${causa.prioridade}\n`
                if (causa.risco) formatted += `   • Risco: ${causa.risco}\n`
              } else {
                formatted += `${index + 1}. ${causa}\n`
              }
            })
          } else {
            formatted += `${response.causas}\n`
          }
          formatted += `\n`
        }
        if (response.observacoes) {
          formatted += `**Observações:** ${response.observacoes}\n\n`
        }
        return formatted.trim()
      }

      // Para outros objetos, usar JSON.stringify formatado
      return JSON.stringify(response, null, 2)
    }

    return String(response)
  }

  const getStatusIcon = (status: AgentResponse["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: AgentResponse["status"]) => {
    const variants = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      error: "destructive",
    } as const

    const labels = {
      pending: "Aguardando",
      processing: "Processando",
      completed: "Concluído",
      error: "Erro",
    }

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Monitoramento de Agentes
          </h1>
          <p className="text-muted-foreground text-lg">
            Acompanhe o status e respostas de cada agente de IA em tempo real
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button onClick={clearResponses} variant="outline">
            Limpar Histórico
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Total de respostas: {responses.length}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {agentConfigs.map((agent) => {
          const agentResponses = responses.filter((r) => r.agentName === agent.name)
          const latestResponse = agentResponses[agentResponses.length - 1]

          return (
            <Card key={agent.key} className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-4 w-full sm:w-auto">
                    <div className={`${agent.color} p-3 rounded-xl text-white shadow-lg flex-shrink-0`}>
                      {agent.icon}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="text-xl font-semibold">{agent.name}</CardTitle>
                      <CardDescription className="text-base">{agent.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    {latestResponse && getStatusBadge(latestResponse.status)}
                    <Badge variant="outline" className="whitespace-nowrap">
                      {agentResponses.length} resposta{agentResponses.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {agentResponses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="space-y-2">
                      <Clock className="h-8 w-8 mx-auto opacity-50" />
                      <p>Nenhuma resposta recebida ainda</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agentResponses.map((response, index) => (
                      <Card key={response.id} className="border border-border/50 bg-background/50">
                        <CardHeader className="pb-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(response.status)}
                              <span className="text-sm font-medium">Resposta #{index + 1}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-muted-foreground">
                              <span>{new Date(response.timestamp).toLocaleString("pt-BR")}</span>
                              {response.processingTime && <span>• {response.processingTime}ms</span>}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {response.response && (
                            <div className="bg-muted/30 rounded-lg border">
                              <ScrollArea className="max-h-[250px] p-4 overflow-hidden">
                                <div className="prose prose-sm max-w-none overflow-hidden">
                                  <div className="text-sm leading-relaxed break-words hyphens-auto whitespace-pre-wrap font-sans overflow-hidden word-break-break-all max-w-full">
                                    {processResponse(response.response)}
                                  </div>
                                </div>
                              </ScrollArea>
                              <div className="border-t border-border/50 p-3 bg-muted/20">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full bg-transparent"
                                      onClick={() => setSelectedResponse(processResponse(response.response))}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Ver Resposta Completa
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh]">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        {agent.icon}
                                        {agent.name} - Resposta #{index + 1}
                                      </DialogTitle>
                                      <DialogDescription>
                                        {new Date(response.timestamp).toLocaleString("pt-BR")}
                                        {response.processingTime && ` • Processado em ${response.processingTime}ms`}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="max-h-[60vh] mt-4">
                                      <div className="prose prose-sm max-w-none">
                                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans p-4 bg-muted/30 rounded-lg border">
                                          {selectedResponse}
                                        </div>
                                      </div>
                                    </ScrollArea>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          )}
                          {response.error && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                              <p className="text-sm text-destructive font-medium">Erro:</p>
                              <p className="text-xs text-destructive/80 mt-1 break-words">{response.error}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
