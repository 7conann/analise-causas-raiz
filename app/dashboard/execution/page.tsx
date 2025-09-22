"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { webhookUrl, prompts } from "@/lib/storage"
import {
  FileText,
  Loader2,
  Info,
  Clock,
  DollarSign,
  TrendingDown,
  Play,
  Eye,
  RotateCcw,
  RefreshCw,
  Trash2,
  Send,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog" // Import DialogDescription
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox" // Import Checkbox

const agentDescriptions = {
  1: "Classificação de falhas industriais",
  2: "Identificação de causas prováveis",
  3: "Plano de investigação estruturado",
  4: "Aplicação da técnica dos 5 Porquês",
}

export default function ExecutionPage() {
  const router = useRouter()

  const [sessionId, setSessionId] = useState<string>("")

  const [webhookURLs, setWebhookURLs] = useState({
    agent1: "https://n8n.grupobeely.com.br/webhook/d620f8b0-a685-4eb7-a9db-367431e11b8e",
    agent2: "https://n8n.grupobeely.com.br/webhook/segundo",
    agent3: "https://n8n.grupobeely.com.br/webhook/terceiro",
    agent4: "https://n8n.grupobeely.com.br/webhook/quarto",
  })

  const reportWebhookUrl = "https://n8n.grupobeely.com.br/webhook/f9a6c0de-6b5a-4169-81a2-8adfed0138c3"

  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingDialog, setShowLoadingDialog] = useState(false)

  const [executionMode, setExecutionMode] = useState<"auto" | "manual">("auto")
  const [currentAgent, setCurrentAgent] = useState(1)
  const [agentResponses, setAgentResponses] = useState({
    agent1: null,
    agent2: null,
    agent3: null,
    agent4: null,
  })
  const [agentStatus, setAgentStatus] = useState({
    agent1: "pending", // pending, processing, completed, error
    agent2: "pending",
    agent3: "pending",
    agent4: "pending",
  })

  const [caseData, setCaseData] = useState({
    duracao_minutos: "",
    reducao_percentual: "",
    custo_estimado: "",
    faturamento_hora: "",
    descricao: "",
    tag_equipamento: "",
    patrimonio: "",
  })

  const [manualLoadingDialog, setManualLoadingDialog] = useState({
    open: false,
    agent: 1,
  })
  const [showViewResponseButton, setShowViewResponseButton] = useState({
    agent1: false,
    agent2: false,
    agent3: false,
    agent4: false,
  })

  const [viewResponseDialog, setViewResponseDialog] = useState<{
    isOpen: boolean
    agentNum: number | null
    lastResponse: string
  }>({
    isOpen: false,
    agentNum: null,
    lastResponse: "",
  })

  const [hasLoadedProgress, setHasLoadedProgress] = useState(false)
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([])
  const [currentPrompts, setCurrentPrompts] = useState({
    a1: "Prompt for Agent 1",
    a2: "Prompt for Agent 2",
    a3: "Prompt for Agent 3",
    a4: "Prompt for Agent 4",
  })

  const [continuousInteraction, setContinuousInteraction] = useState({
    agent1: false,
    agent2: false,
    agent3: false,
    agent4: false,
  })

  const [interactionHistory, setInteractionHistory] = useState({
    agent1: [],
    agent2: [],
    agent3: [],
    agent4: [],
  })

  const [showPreview, setShowPreview] = useState({
    agent1: false,
    agent2: false,
    agent3: false,
    agent4: false,
  })

  const [chatMessages, setChatMessages] = useState({
    agent1: [],
    agent2: [],
    agent3: [],
    agent4: [],
  })

  const [chatInputs, setChatInputs] = useState({
    agent1: "",
    agent2: "",
    agent3: "",
    agent4: "",
  })

  const [isSendingMessage, setIsSendingMessage] = useState({
    agent1: false,
    agent2: false,
    agent3: false,
    agent4: false,
  })

  const [expandedMessages, setExpandedMessages] = useState<{ [key: string]: boolean }>({})

  const [hideLastResponse, setHideLastResponse] = useState(false)

  const loadExample = () => {
    const exampleData = {
      duracao_minutos: "78",
      reducao_percentual: "15",
      custo_estimado: "5000",
      faturamento_hora: "12000",
      descricao:
        "Ruptura dos parafusos de fixação do redutor do decantador durante operação normal. Equipamento apresentou vibração excessiva antes da falha.",
      tag_equipamento: "351MR06",
      patrimonio: "RD-08.009113",
    }

    setCaseData(exampleData)

    toast({
      title: "✅ Exemplo carregado",
      description: "Dados de exemplo foram carregados nos campos.",
    })
  }

  useEffect(() => {
    // Carregar sessionId do localStorage se existir
    const savedSessionId = localStorage.getItem("rca_session_id")
    if (savedSessionId) {
      setSessionId(savedSessionId)
    }

    // Carregar progresso de execução do localStorage
    const savedProgress = localStorage.getItem("rca_execution_progress")
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress)
        if (progress.sessionId) {
          setSessionId(progress.sessionId)
        }
        if (progress.agentResponses) {
          setAgentResponses(progress.agentResponses)
        }
        if (progress.caseData) {
          setCaseData(progress.caseData)
        }
        if (progress.selectedDocuments) {
          setSelectedKnowledgeBase(progress.selectedDocuments) // Use setSelectedKnowledgeBase here
        }
        console.log("[v0] Loaded execution progress from localStorage:", progress)
      } catch (error) {
        console.error("[v0] Error loading execution progress:", error)
      }
    }
  }, [])

  useEffect(() => {
    const savedUrl = webhookUrl.load()
    if (savedUrl) {
      setWebhookURLs((prev) => ({ ...prev, agent1: savedUrl }))
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedProgress) {
      loadExecutionProgress()
      setHasLoadedProgress(true)
    }

    // Carregar documentos disponíveis
    loadAvailableDocuments()
  }, [hasLoadedProgress])

  useEffect(() => {
    const loadPrompts = () => {
      try {
        const loadedPrompts = prompts.load()
        console.log("[v0] Prompts carregados do localStorage:", loadedPrompts)
        setCurrentPrompts({
          a1: loadedPrompts.a1 || "Prompt for Agent 1",
          a2: loadedPrompts.a2 || "Prompt for Agent 2",
          a3: loadedPrompts.a3 || "Prompt for Agent 3",
          a4: loadedPrompts.a4 || "Prompt for Agent 4",
        })
      } catch (error) {
        console.error("[v0] Erro ao carregar prompts:", error)
      }
    }

    loadPrompts()
  }, [])

  const generateNewSessionId = () => {
    const newSessionId = crypto.randomUUID()
    setSessionId(newSessionId)
    console.log("[v0] Generated new sessionId:", newSessionId)
    return newSessionId
  }

  const saveProgress = () => {
    const progress = {
      sessionId,
      timestamp: new Date().toISOString(),
      agentResponses,
      caseData,
      selectedDocuments: selectedKnowledgeBase, // Save selectedKnowledgeBase
    }
    localStorage.setItem("rca_execution_progress", JSON.stringify(progress))
    localStorage.setItem("rca_session_id", sessionId)
    console.log("[v0] Progress saved to localStorage")
  }

  const loadExecutionProgress = () => {
    const savedProgress = localStorage.getItem("rca_execution_progress")
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress)
        if (progress.sessionId) {
          setSessionId(progress.sessionId)
        }
        if (progress.agentResponses) {
          setAgentResponses(progress.agentResponses)
        }
        if (progress.caseData) {
          setCaseData(progress.caseData)
        }
        if (progress.selectedDocuments) {
          setSelectedKnowledgeBase(progress.selectedDocuments)
        }
        toast({
          title: "✅ Progresso carregado",
          description: "Dados da execução anterior foram restaurados.",
        })
        console.log("[v0] Execution progress loaded from localStorage")
      } catch (error) {
        console.error("[v0] Error loading execution progress:", error)
        toast({
          title: "❌ Erro ao carregar progresso",
          description: "Não foi possível restaurar os dados salvos.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "ℹ️ Nenhum progresso salvo",
        description: "Não há dados de execução anteriores para carregar.",
      })
    }
  }

  const loadAvailableDocuments = () => {
    try {
      const documents = JSON.parse(localStorage.getItem("rca_knowledge_base") || "[]")
      setAvailableDocuments(documents)
    } catch (error) {
      console.error("[v0] Error loading available documents:", error)
      setAvailableDocuments([])
    }
  }

  const resetExecution = () => {
    const newSessionId = crypto.randomUUID()
    setSessionId(newSessionId)
    setAgentResponses({
      agent1: null,
      agent2: null,
      agent3: null,
      agent4: null,
    })
    setAgentStatus({
      agent1: "pending",
      agent2: "pending",
      agent3: "pending",
      agent4: "pending",
    })
    setShowViewResponseButton({
      agent1: false,
      agent2: false,
      agent3: false,
      agent4: false,
    })
    setChatMessages({
      agent1: [],
      agent2: [],
      agent3: [],
      agent4: [],
    })
    setInteractionHistory({
      agent1: [],
      agent2: [],
      agent3: [],
      agent4: [],
    })
    setCaseData({
      // Reset caseData as well
      duracao_minutos: "",
      reducao_percentual: "",
      custo_estimado: "",
      faturamento_hora: "",
      descricao: "",
      tag_equipamento: "",
      patrimonio: "",
    })
    setSelectedKnowledgeBase([]) // Clear selected documents

    // Limpar localStorage
    localStorage.removeItem("rca_execution_progress")
    localStorage.removeItem("rca_agent_responses")
    localStorage.removeItem("rca_session_id") // Remove old session ID
    localStorage.removeItem("rca_report_data") // Remove old report data

    // Save the new session ID
    localStorage.setItem("rca_session_id", newSessionId)

    toast({
      title: "✅ Execução resetada",
      description: `Nova sessão iniciada: ${newSessionId.slice(0, 8)}...`,
    })
    console.log("[v0] Execution reset with new sessionId:", newSessionId)
  }

  const clearProgress = () => {
    const newSessionId = crypto.randomUUID()
    setSessionId(newSessionId)
    setAgentResponses({})

    // Limpar localStorage mas manter dados do caso
    const currentProgress = JSON.parse(localStorage.getItem("rca_execution_progress") || "{}")
    const clearedProgress = {
      sessionId: newSessionId,
      timestamp: new Date().toISOString(),
      agentResponses: {},
      caseData: currentProgress.caseData || caseData, // Keep existing caseData if available
      selectedDocuments: currentProgress.selectedDocuments || selectedKnowledgeBase, // Keep existing selectedDocuments if available
    }
    localStorage.setItem("rca_execution_progress", JSON.stringify(clearedProgress))
    localStorage.setItem("rca_session_id", newSessionId)

    toast({
      title: "🧹 Progresso limpo",
      description: `Respostas dos agentes removidas. Nova sessão: ${newSessionId.substring(0, 8)}...`,
    })
    console.log("[v0] Progress cleared with new sessionId:", newSessionId)
  }

  const executeAgent = async (agentNumber: number, inputData?: string) => {
    console.log(`[v0] Executing Agent ${agentNumber}`)

    // Gerar sessionId se não existir
    let currentSessionId = sessionId
    if (!currentSessionId) {
      currentSessionId = generateNewSessionId()
    }

    try {
      setIsLoading(true)
      setAgentStatus((prev) => ({ ...prev, [`agent${agentNumber}`]: "loading" }))

      const agentKey = `agent${agentNumber}` as keyof typeof webhookURLs
      const webhookUrl = webhookURLs[agentKey]

      console.log(`[v0] Checking webhook for Agent ${agentNumber}:`, webhookUrl)
      console.log(`[v0] Available webhooks:`, webhookURLs)

      if (!webhookUrl) {
        throw new Error(`Webhook URL não encontrada para Agent ${agentNumber}`)
      }

      const payload: any = {
        dur_min: caseData.duracao_minutos,
        reducao_pct: caseData.reducao_percentual,
        custo: caseData.custo_estimado,
        faturamento_1h: caseData.faturamento_hora,
        descricao: caseData.descricao,
      }

      // Adicionar resposta do agente anterior se não for o primeiro agente e não houver interação do usuário
      if (agentNumber > 1 && !inputData) {
        const previousAgentKey = `agent${agentNumber - 1}`
        const previousResponse = agentResponses[previousAgentKey]
        if (previousResponse?.data?.output) {
          payload.previousAgentResponse = previousResponse.data.output
          console.log(`[v0] Adicionando resposta do Agent ${agentNumber - 1} como input para Agent ${agentNumber}`)
        }
      }

      // Se houver inputData (interação do usuário), usar ela
      if (inputData) {
        payload.userInput = inputData
        console.log(`[v0] Usando input do usuário para Agent ${agentNumber}:`, inputData)
      }

      // Adicionar base de conhecimento se selecionada
      const includeKnowledgeBase = true
      if (includeKnowledgeBase && selectedKnowledgeBase.length > 0) {
        payload.knowledgeBase = selectedKnowledgeBase
        console.log(`[v0] Adicionando base de conhecimento: ${selectedKnowledgeBase.length} arquivos`)
      } else {
        console.log(`[v0] Nenhuma base de conhecimento selecionada ou includeKnowledgeBase é false`)
        console.log(`[v0] selectedKnowledgeBase:`, selectedKnowledgeBase)
        console.log(`[v0] includeKnowledgeBase:`, includeKnowledgeBase)

        const knowledgePayload = {
          includeKnowledgeBase,
          knowledgeBaseLength: selectedKnowledgeBase.length,
        }
        console.log(`[v0] Payload construído:`, knowledgePayload)
      }

      console.log(`[v0] Payload completo para Agent ${agentNumber}:`, payload)

      const requestData = {
        prompts: currentPrompts,
        payload: payload,
        agent: agentNumber,
        id: currentSessionId, // Enviando sessionId como "id"
      }

      console.log(`[v0] Sending request to Agent ${agentNumber}:`, webhookUrl)
      console.log(`[v0] Request data completo:`, JSON.stringify(requestData, null, 2))

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`[v0] Agent ${agentNumber} raw response:`, data)

        // Salvar resposta para monitoramento
        const monitoringResponse = {
          id: `agent${agentNumber}_${Date.now()}`,
          agentName: getAgentName(agentNumber),
          status: "completed" as const,
          timestamp: new Date().toISOString(),
          response: JSON.stringify(data, null, 2),
        }

        console.log(`[v0] Saving monitoring response for Agent ${agentNumber}:`, monitoringResponse)

        const existingResponses = JSON.parse(localStorage.getItem("rca_agent_responses") || "[]")
        existingResponses.push(monitoringResponse)
        localStorage.setItem("rca_agent_responses", JSON.stringify(existingResponses))

        setAgentResponses((prev) => ({
          ...prev,
          [`agent${agentNumber}`]: {
            agent: agentNumber,
            success: true,
            status: response.status,
            data: data,
            extractedContent: data.output || data.html || JSON.stringify(data), // Add extractedContent
            timestamp: new Date().toISOString(), // Add timestamp
          },
        }))

        setAgentStatus((prev) => ({ ...prev, [`agent${agentNumber}`]: "completed" }))
        setShowViewResponseButton((prev) => ({ ...prev, [`agent${agentNumber}`]: true }))

        console.log(`[v0] Agent ${agentNumber} completed successfully`)

        setTimeout(() => {
          saveProgress()
        }, 100)

        toast({
          title: `✅ Agent ${agentNumber} concluído`,
          description: `O Agent ${agentNumber} foi executado com sucesso.`,
        })

        return { success: true, data: data }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error(`[v0] Error executing Agent ${agentNumber}:`, error)
      setAgentStatus((prev) => ({ ...prev, [`agent${agentNumber}`]: "error" }))

      toast({
        title: `❌ Erro no Agent ${agentNumber}`,
        description: `Ocorreu um erro ao executar o Agent ${agentNumber}. Tente novamente.`,
        variant: "destructive",
      })

      return { success: false, error: error }
    } finally {
      setIsLoading(false)
      setManualLoadingDialog({ open: false, agent: agentNumber })
    }
  }

  const generateReport = async () => {
    if (!sessionId) {
      toast({
        title: "❌ Erro",
        description: "Nenhuma sessão ativa encontrada. Execute os agentes primeiro.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Coletar todas as respostas dos agentes
      const allAgentResponses = {
        agent1: agentResponses.agent1?.data?.output || null,
        agent2: agentResponses.agent2?.data?.output || null,
        agent3: agentResponses.agent3?.data?.output || null,
        agent4: agentResponses.agent4?.data?.output || null,
      }

      const payload = {
        id: sessionId, // Enviando sessionId como "id"
        timestamp: new Date().toISOString(),
        caseData: caseData,
        agentResponses: allAgentResponses, // Enviando todas as respostas dos 4 agentes
      }

      console.log("[v0] Generating report with payload:", payload)

      const response = await fetch(reportWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const responseText = await response.text()

        console.log("[v0] Raw response received:", responseText)
        console.log("[v0] Response type:", typeof responseText)
        console.log("[v0] Response length:", responseText.length)

        let reportHtml = responseText

        try {
          // Tentar parsear como JSON primeiro
          const jsonResponse = JSON.parse(responseText)
          console.log("[v0] Parsed JSON response:", jsonResponse)

          // Extrair HTML do JSON se existir
          if (jsonResponse.message && jsonResponse.message.content) {
            reportHtml = jsonResponse.message.content
          } else if (jsonResponse.content) {
            reportHtml = jsonResponse.content
          } else if (typeof jsonResponse === "string") {
            reportHtml = jsonResponse
          }

          console.log("[v0] Extracted HTML before unescape:", reportHtml.substring(0, 200) + "...")

          // Fazer unescape dos caracteres escapados
          reportHtml = reportHtml
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, "\\")
            .replace(/\\t/g, "\t")
            .replace(/\\r/g, "\r")

          console.log("[v0] Final HTML after unescape:", reportHtml.substring(0, 200) + "...")
        } catch (parseError) {
          console.log("[v0] Response is not JSON, using as plain text")
          // Se não for JSON, usar como está
        }

        const reportData = {
          html: reportHtml,
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          agentResponses: allAgentResponses,
        }

        localStorage.setItem("rca_report_data", JSON.stringify(reportData))

        toast({
          title: "✅ Relatório gerado",
          description: "O relatório foi gerado e salvo. Redirecionando para visualização...",
        })

        setTimeout(() => {
          window.location.href = "/dashboard/output"
        }, 1000)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Error generating report:", error)
      toast({
        title: "❌ Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateAgentResponseFromChat = (agentNumber: number, newResponse: string) => {
    console.log(`[v0] Atualizando resposta do Agent ${agentNumber} após interação no chat`)

    const updatedResponse = {
      agent: agentNumber,
      success: true,
      status: 200,
      data: { output: newResponse },
      extractedContent: newResponse,
      timestamp: new Date().toISOString(),
      updatedFromChat: true,
    }

    setAgentResponses((prev) => ({
      ...prev,
      [`agent${agentNumber}`]: updatedResponse,
    }))

    console.log(`[v0] Resposta do Agent ${agentNumber} atualizada:`, updatedResponse)
  }

  const sendChatMessage = async (agentNumber: number) => {
    const inputValue = chatInputs[`agent${agentNumber}`] || ""
    const message = inputValue.trim()
    if (!message) return

    setIsSendingMessage((prev) => ({
      ...prev,
      [`agent${agentNumber}`]: true,
    }))

    // Adicionar mensagem do usuário ao chat
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    }

    setChatMessages((prev) => ({
      ...prev,
      [`agent${agentNumber}`]: [...prev[`agent${agentNumber}`], userMessage],
    }))

    // Limpar input
    setChatInputs((prev) => ({
      ...prev,
      [`agent${agentNumber}`]: "",
    }))

    try {
      const interactionPayload = {
        dur_min: Number.parseInt(caseData.duracao_minutos) || 0,
        reducao_pct: Number.parseFloat(caseData.reducao_percentual) || 0,
        custo: Number.parseFloat(caseData.custo_estimado) || 0,
        faturamento_1h: Number.parseFloat(caseData.faturamento_hora) || 0,
        descricao: message, // Enviar apenas a mensagem como descrição
      }

      const webhookURL = webhookURLs[`agent${agentNumber}`]

      const requestData = {
        prompts: { [`a${agentNumber}`]: currentPrompts[`a${agentNumber}`] },
        payload: interactionPayload, // Usar payload de interação
        agent: agentNumber,
        chatMessage: message,
        type: "chat_interaction",
        id: sessionId, // Adicionando sessionId nas interações
      }

      let previousResponse = null
      if (agentNumber > 1) {
        const previousAgentKey = `agent${agentNumber - 1}`
        if (agentResponses[previousAgentKey]?.data) {
          previousResponse = agentResponses[previousAgentKey].data
          console.log(`[v0] Enviando resposta do Agent ${agentNumber - 1} como contexto para Agent ${agentNumber}`)
        }
      }

      // Adicionar contexto anterior se disponível
      if (previousResponse) {
        requestData.previousResponse = previousResponse
      }

      console.log(`[v0] Enviando mensagem de chat para Agent ${agentNumber}:`, message)
      console.log(
        `[v0] Contexto anterior (Agent ${agentNumber - 1}):`,
        previousResponse ? "Incluído" : "Não disponível",
      )

      const response = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log(`[v0] Chat response from Agent ${agentNumber}:`, responseData)

        let extractedContent = ""
        if (responseData && responseData.output) {
          extractedContent = responseData.output
          const agentMessage = {
            id: Date.now(),
            type: "agent",
            content: extractedContent,
            timestamp: new Date().toISOString(),
          }

          setChatMessages((prev) => ({
            ...prev,
            [`agent${agentNumber}`]: [...prev[`agent${agentNumber}`], agentMessage],
          }))

          updateAgentResponseFromChat(agentNumber, extractedContent)

          setTimeout(() => {
            saveProgress()
          }, 100)

          toast({
            title: "Mensagem Enviada",
            description: `Resposta recebida do Agente ${agentNumber}`,
          })
        } else {
          const rateLimitMessage = {
            id: Date.now(),
            type: "system",
            content:
              "⚠️ Não foi possível obter resposta do agente. Isso pode ser devido ao rate limit do serviço. Aguarde até 60 segundos e tente novamente.",
            timestamp: new Date().toISOString(),
          }

          setChatMessages((prev) => ({
            ...prev,
            [`agent${agentNumber}`]: [...prev[`agent${agentNumber}`], rateLimitMessage],
          }))

          toast({
            title: "Rate Limit Detectado",
            description: "Aguarde 60 segundos antes de tentar novamente",
            variant: "destructive",
          })
        }
      } else {
        console.error(`[v0] Chat error from Agent ${agentNumber}:`, response.status)
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error(`[v0] Erro ao enviar mensagem para Agent ${agentNumber}:`, error)

      const errorMessage = {
        id: Date.now() + 2,
        type: "system",
        content:
          "❌ Erro ao enviar mensagem. Se o problema persistir, pode ser devido ao rate limit. Aguarde até 60 segundos e tente novamente.",
        timestamp: new Date().toISOString(),
      }

      setChatMessages((prev) => ({
        ...prev,
        [`agent${agentNumber}`]: [...prev[`agent${agentNumber}`], errorMessage],
      }))

      toast({
        title: "Erro no Chat",
        description: `Falha ao enviar mensagem para Agente ${agentNumber}`,
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage((prev) => ({
        ...prev,
        [`agent${agentNumber}`]: false,
      }))
    }
  }

  const togglePreview = (agentNumber: number) => {
    setShowPreview((prev) => ({
      ...prev,
      [`agent${agentNumber}`]: !prev[`agent${agentNumber}`],
    }))
  }

  const renderResponsePreview = (agentNumber: number) => {
    const response = agentResponses[`agent${agentNumber}`]
    if (!response) return <p className="text-muted-foreground">Nenhuma resposta disponível</p>

    let content = ""
    if (response.data && Array.isArray(response.data) && response.data[0]?.message?.content) {
      content = response.data[0].message.content
    } else if (response.data?.message?.content) {
      content = response.data.message.content
    } else if (response.data?.output) {
      content = response.data.output
    } else if (response.data?.html) {
      content = response.data.html
    } else {
      content = JSON.stringify(response.data, null, 2)
    }

    return (
      <div className="max-h-60 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">
          {content.length > 500 ? content.substring(0, 500) + "..." : content}
        </pre>
      </div>
    )
  }

  const resendResponseToWebhook = async (
    agentNumber: number,
    responseContent: string,
    conversationHistory: any[] = [],
  ) => {
    try {
      console.log(`[v0] Reenviando resposta para Agent ${agentNumber}`)

      const webhookUrl = webhookURLs[`agent${agentNumber}`]

      const requestData = {
        type: "continue_conversation",
        previousResponse: responseContent,
        conversationHistory: conversationHistory,
        timestamp: new Date().toISOString(),
        agent: agentNumber,
      }

      console.log(`[v0] Dados de continuação para Agent ${agentNumber}:`, requestData)

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      const responseData = await response.text()
      console.log(`[v0] Agent ${agentNumber} resposta de continuação:`, responseData)

      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseData)
      } catch {
        parsedResponse = { html: responseData, raw: responseData }
      }

      // Extrair conteúdo da resposta
      let extractedContent = ""
      if (parsedResponse && Array.isArray(parsedResponse) && parsedResponse[0]?.message?.content) {
        extractedContent = parsedResponse[0].message.content
      } else if (parsedResponse?.message?.content) {
        extractedContent = parsedResponse.message.content
      } else if (parsedResponse?.html) {
        extractedContent = parsedResponse.html
      } else if (typeof parsedResponse === "string") {
        extractedContent = parsedResponse
      } else {
        extractedContent = JSON.stringify(parsedResponse, null, 2)
      }

      // Atualizar histórico de interações
      setInteractionHistory((prev) => ({
        ...prev,
        [`agent${agentNumber}`]: [
          ...prev[`agent${agentNumber}`],
          {
            type: "continuation",
            timestamp: new Date().toISOString(),
            sent: responseContent,
            received: extractedContent,
          },
        ],
      }))

      // Salvar resposta de continuação
      const continuationResponse = {
        id: `agent${agentNumber}_continuation_${Date.now()}`,
        agentName:
          agentNumber === 1
            ? "Agente Classificador"
            : agentNumber === 2
              ? "Agente de Causas"
              : agentNumber === 3
                ? "Agente de Investigação"
                : "Agente 4", // Added Agent 4 name
        status: response.ok ? "completed" : "error",
        timestamp: new Date().toISOString(),
        response: extractedContent,
        processingTime: null,
        error: response.ok ? null : "Erro na continuação da conversa",
        type: "continuation",
      }

      const existingResponses = JSON.parse(localStorage.getItem("rca_agent_responses") || "[]")
      const updatedResponses = [...existingResponses, continuationResponse]
      localStorage.setItem("rca_agent_responses", JSON.stringify(updatedResponses))

      window.dispatchEvent(new CustomEvent("agent-response", { detail: continuationResponse }))

      return { success: true, content: extractedContent, response: parsedResponse }
    } catch (error) {
      console.log(`[v0] Erro ao reenviar para Agent ${agentNumber}:`, error)
      return { success: false, error: error.message }
    }
  }

  const startContinuousInteraction = async (agentNumber: number) => {
    const lastResponse = agentResponses[`agent${agentNumber}`]
    if (!lastResponse) {
      toast({
        title: "Erro",
        description: "Nenhuma resposta encontrada para continuar a interação",
        variant: "destructive",
      })
      return
    }

    setContinuousInteraction((prev) => ({
      ...prev,
      [`agent${agentNumber}`]: true,
    }))

    // Extrair conteúdo da última resposta
    let responseContent = ""
    if (lastResponse.data && Array.isArray(lastResponse.data) && lastResponse.data[0]?.message?.content) {
      responseContent = lastResponse.data[0].message.content
    } else if (lastResponse.data?.message?.content) {
      responseContent = lastResponse.data.message.content
    } else if (lastResponse.data?.html) {
      responseContent = lastResponse.data.html
    } else {
      responseContent = JSON.stringify(lastResponse.data, null, 2)
    }

    const result = await resendResponseToWebhook(
      agentNumber,
      responseContent,
      interactionHistory[`agent${agentNumber}`],
    )

    if (result.success) {
      toast({
        title: "Interação Contínua",
        description: `Resposta reenviada para Agente ${agentNumber} com sucesso`,
      })
    } else {
      toast({
        title: "Erro na Interação",
        description: `Falha ao reenviar para Agente ${agentNumber}: ${result.error}`,
        variant: "destructive",
      })
    }

    setContinuousInteraction((prev) => ({
      ...prev,
      [`agent${agentNumber}`]: false,
    }))
  }

  const getAgentName = (agentNumber: number) => {
    switch (agentNumber) {
      case 1:
        return "Agente Classificador"
      case 2:
        return "Agente de Causas"
      case 3:
        return "Agente de Investigação"
      case 4:
        return "Agente 4"
      default:
        return "Agente Desconhecido"
    }
  }

  const executeIndividualAgent = async (agentNumber: number) => {
    console.log(`[v0] Executing individual Agent ${agentNumber}`)

    // Verificar se há resposta do agente anterior (exceto para o Agente 1)
    let previousResponse = null
    if (agentNumber > 1) {
      const previousAgentKey = `agent${agentNumber - 1}`
      const previousAgentResponse = agentResponses[previousAgentKey]

      if (previousAgentResponse && previousAgentResponse.success) {
        previousResponse = previousAgentResponse.data
        console.log(`[v0] Using previous agent response for Agent ${agentNumber}:`, previousResponse)
      }
    }

    setManualLoadingDialog({ open: true, agent: agentNumber })
    setAgentStatus((prev) => ({
      ...prev,
      [`agent${agentNumber}`]: "loading",
    }))

    try {
      await executeAgent(agentNumber, previousResponse?.output)
    } catch (error) {
      console.error(`[v0] Error executing Agent ${agentNumber}:`, error)
    }
  }

  const executeAllAgents = async () => {
    console.log("[v0] Starting automatic sequential execution")

    const newSessionId = generateNewSessionId()

    setIsLoading(true)
    setShowLoadingDialog(true)
    setCurrentAgent(1)

    // Reset status
    setAgentStatus({
      agent1: "pending",
      agent2: "pending",
      agent3: "pending",
      agent4: "pending", // Reset status for Agent 4
    })
    setAgentResponses({
      agent1: null,
      agent2: null,
      agent3: null,
      agent4: null, // Reset responses for Agent 4
    })

    try {
      // Executar Agente 1
      setCurrentAgent(1)
      const agent1Response = await executeAgent(1)

      // Executar Agente 2 com resposta do Agente 1
      setCurrentAgent(2)
      const agent2Response = await executeAgent(2, agent1Response?.data)

      // Executar Agente 3 com resposta do Agente 2
      setCurrentAgent(3)
      const agent3Response = await executeAgent(3, agent2Response?.data)

      // Executar Agente 4 com resposta do Agente 3
      setCurrentAgent(4)
      const agent4Response = await executeAgent(4, agent3Response?.data)

      const finalReport = {
        success: true,
        status: 200,
        data: {
          agent1: agent1Response?.data,
          agent2: agent2Response?.data,
          agent3: agent3Response?.data,
          agent4: agent4Response?.data, // Include Agent 4 data
          combined: true,
          timestamp: new Date().toISOString(),
        },
        contentType: "application/json; charset=utf-8",
        method: "fetch",
      }

      const executionId = `agent4_auto_${Date.now()}`
      const historicalExecution = {
        id: executionId,
        agentName: "Agente 4", // Agent 4 name
        timestamp: new Date().toISOString(),
        response: agent4Response?.data,
        agent: 4,
        caseData: caseData,
        mode: "auto",
      }

      // Carregar e atualizar histórico do agente 4
      let agent4History = []
      try {
        const existingHistory = localStorage.getItem("rca_agent4_history")
        if (existingHistory) {
          agent4History = JSON.parse(existingHistory)
        }
      } catch (err) {
        console.error("[v0] Error loading agent 4 history:", err)
      }

      agent4History.unshift(historicalExecution) // Adiciona no início (mais recente primeiro)

      // Limitar histórico a 50 execuções para evitar crescimento excessivo
      if (agent4History.length > 50) {
        agent4History = agent4History.slice(0, 50)
      }

      localStorage.setItem("rca_agent4_history", JSON.stringify(agent4History))
      console.log("[v0] Saved auto mode agent 4 execution to history:", executionId)

      localStorage.setItem("beely_last_response", JSON.stringify(finalReport))
      localStorage.setItem("rca_response", JSON.stringify(finalReport))
      localStorage.setItem("latest_analysis", JSON.stringify(finalReport))

      setShowLoadingDialog(false)
      setIsLoading(false)

      toast({
        title: "✅ Análise completa concluída",
        description:
          "Todos os 4 agentes processaram com sucesso! Use o botão 'Visualizar Resposta' do Agente 4 para ver o relatório.",
        duration: 5000,
      })

      // Removido: setTimeout(() => { router.push("/dashboard/output") }, 1500)
    } catch (error) {
      setShowLoadingDialog(false)
      setIsLoading(false)
      console.log("[v0] Error in sequential execution:", error)
    }
  }

  const executeNextAgent = async () => {
    if (currentAgent > 4) return // Check for Agent 4

    try {
      const inputData = null
      if (currentAgent === 2 && agentResponses.agent1?.data) {
        // Use output from agent1 if available
        await executeAgent(currentAgent, agentResponses.agent1.data.output)
      } else if (currentAgent === 3 && agentResponses.agent2?.data) {
        // Use output from agent2 if available
        await executeAgent(currentAgent, agentResponses.agent2.data.output)
      } else if (currentAgent === 4 && agentResponses.agent3?.data) {
        // Use output from agent3 if available
        await executeAgent(currentAgent, agentResponses.agent3.data.output)
      } else if (currentAgent === 1) {
        // Execute agent 1 without previous input
        await executeAgent(currentAgent)
      } else {
        // Fallback for other agents or if previous response is missing
        await executeAgent(currentAgent)
      }
      setCurrentAgent((prev) => prev + 1)
    } catch (error) {
      console.error(`[v0] Error executing next agent (Agent ${currentAgent}):`, error)
      // Optionally handle error, e.g., set status to error for currentAgent
    }
  }

  const openViewResponseDialog = (agentNumber: number) => {
    const response = agentResponses[`agent${agentNumber}`]
    if (!response) return

    let content = ""
    if (response.data?.output) {
      content = response.data.output
    } else if (response.data?.html) {
      content = response.data.html
    } else {
      content = JSON.stringify(response.data, null, 2)
    }

    setViewResponseDialog({
      isOpen: true,
      agentNum: agentNumber,
      lastResponse: content,
    })
  }

  // Função para iniciar a execução sequencial (pode ser renomeada ou integrada se necessário)
  const startSequentialExecution = async () => {
    console.log("[v0] Starting sequential execution flow")
    // Esta função pode ser usada para orquestrar a execução de todos os agentes em sequência
    // Se executeAllAgents já faz isso, esta pode ser removida ou adaptada.
    await executeAllAgents()
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Execução de Análise RCA</h1>
        <p className="text-muted-foreground">
          Execute os agentes de análise de causa raiz para processar falhas industriais
        </p>
      </div>

      {/* Dados do Caso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Dados do Caso
          </CardTitle>
          <CardDescription>Insira as informações da falha para análise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={loadExample}
              variant="outline"
              disabled={isLoading}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            >
              <FileText className="mr-2 h-4 w-4" />
              Carregar Exemplo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracao" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duração (min)
              </Label>
              <Input
                id="duracao"
                type="number"
                placeholder="78"
                value={caseData.duracao_minutos}
                onChange={(e) => setCaseData((prev) => ({ ...prev, duracao_minutos: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reducao" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Redução (%)
              </Label>
              <Input
                id="reducao"
                type="number"
                placeholder="0"
                value={caseData.reducao_percentual}
                onChange={(e) => setCaseData((prev) => ({ ...prev, reducao_percentual: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custo" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Custo Estimado
              </Label>
              <Input
                id="custo"
                type="number"
                placeholder="0"
                value={caseData.custo_estimado}
                onChange={(e) => setCaseData((prev) => ({ ...prev, custo_estimado: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faturamento" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Faturamento/Hora
              </Label>
              <Input
                id="faturamento"
                type="number"
                placeholder="0"
                value={caseData.faturamento_hora}
                onChange={(e) => setCaseData((prev) => ({ ...prev, faturamento_hora: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição da Falha</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva detalhadamente a falha ocorrida..."
              value={caseData.descricao}
              onChange={(e) => setCaseData((prev) => ({ ...prev, descricao: e.target.value }))}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Base de Conhecimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Base de Conhecimento
          </CardTitle>
          <CardDescription>
            Selecione documentos da base de conhecimento para incluir como contexto na análise
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableDocuments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum documento disponível</p>
              <p className="text-sm">Adicione documentos na seção de Treinamento</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedKnowledgeBase.length} de {availableDocuments.length} documentos selecionados
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedKnowledgeBase(availableDocuments.map((doc) => doc.content))}
                  >
                    Selecionar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedKnowledgeBase([])}>
                    Limpar Seleção
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {availableDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-3 p-2 border rounded-lg">
                    <Checkbox
                      id={`doc-${doc.id}`}
                      checked={selectedKnowledgeBase.includes(doc.content)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedKnowledgeBase((prev) => [...prev, doc.content])
                        } else {
                          setSelectedKnowledgeBase((prev) => prev.filter((content) => content !== doc.content))
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`doc-${doc.id}`} className="text-sm font-medium cursor-pointer">
                        {doc.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {doc.type.toUpperCase()} • {new Date(doc.uploadDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(doc.content.length / 1000)}k chars
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de Controle */}
      <div className="flex flex-col gap-4 items-center">
        <div className="flex justify-center mb-6">
          <Button
            onClick={startSequentialExecution} // Usando a função orquestradora
            disabled={isLoading || !caseData.descricao.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <Play className="mr-2 h-5 w-5" />
            Executar Todos os Agentes
          </Button>
        </div>

        <Button
          onClick={generateReport}
          disabled={isLoading || !sessionId}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <FileText className="mr-2 h-5 w-5" />
          Gerar Relatório
        </Button>

        <div className="flex gap-4">
          <Button
            onClick={resetExecution}
            variant="outline"
            className="px-6 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl bg-transparent"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset Completo
          </Button>

          <Button
            onClick={clearProgress}
            variant="outline"
            className="px-6 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl bg-transparent"
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Limpar Progresso
          </Button>
        </div>
      </div>

      {sessionId && <div className="text-center text-sm text-muted-foreground">Sessão: {sessionId.slice(0, 8)}...</div>}

      {/* Status dos agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agente 1 */}
        <Card className="relative border-border bg-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                  1
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Agente 1</CardTitle>
                  <CardDescription className="text-sm text-foreground/70">{agentDescriptions[1]}</CardDescription>
                </div>
              </div>
              <Badge
                variant={
                  agentStatus.agent1 === "completed"
                    ? "default"
                    : agentStatus.agent1 === "loading"
                      ? "secondary"
                      : "outline"
                }
              >
                {agentStatus.agent1 === "completed"
                  ? "Concluído"
                  : agentStatus.agent1 === "loading"
                    ? "Executando"
                    : "Pendente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => executeIndividualAgent(1)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Executar Novamente
              </Button>

              {showViewResponseButton.agent1 && (
                <Button onClick={() => openViewResponseDialog(1)} variant="outline" size="sm" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar Resposta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agente 2 */}
        <Card className="relative border-border bg-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                  2
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Agente 2</CardTitle>
                  <CardDescription className="text-sm text-foreground/70">{agentDescriptions[2]}</CardDescription>
                </div>
              </div>
              <Badge
                variant={
                  agentStatus.agent2 === "completed"
                    ? "default"
                    : agentStatus.agent2 === "loading"
                      ? "secondary"
                      : "outline"
                }
              >
                {agentStatus.agent2 === "completed"
                  ? "Concluído"
                  : agentStatus.agent2 === "loading"
                    ? "Executando"
                    : "Pendente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => executeIndividualAgent(2)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Executar Novamente
              </Button>

              {showViewResponseButton.agent2 && (
                <Button onClick={() => openViewResponseDialog(2)} variant="outline" size="sm" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar Resposta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agente 3 */}
        <Card className="relative border-border bg-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                  3
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Agente 3</CardTitle>
                  <CardDescription className="text-sm text-foreground/70">{agentDescriptions[3]}</CardDescription>
                </div>
              </div>
              <Badge
                variant={
                  agentStatus.agent3 === "completed"
                    ? "default"
                    : agentStatus.agent3 === "loading"
                      ? "secondary"
                      : "outline"
                }
              >
                {agentStatus.agent3 === "completed"
                  ? "Concluído"
                  : agentStatus.agent3 === "loading"
                    ? "Executando"
                    : "Pendente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => executeIndividualAgent(3)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Executar Novamente
              </Button>

              {showViewResponseButton.agent3 && (
                <Button onClick={() => openViewResponseDialog(3)} variant="outline" size="sm" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar Resposta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agente 4 */}
        <Card className="relative border-border bg-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                  4
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Agente 4</CardTitle>
                  <CardDescription className="text-sm text-foreground/70">{agentDescriptions[4]}</CardDescription>
                </div>
              </div>
              <Badge
                variant={
                  agentStatus.agent4 === "completed"
                    ? "default"
                    : agentStatus.agent4 === "loading"
                      ? "secondary"
                      : "outline"
                }
              >
                {agentStatus.agent4 === "completed"
                  ? "Concluído"
                  : agentStatus.agent4 === "loading"
                    ? "Executando"
                    : "Pendente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => executeIndividualAgent(4)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Executar Novamente
              </Button>

              {showViewResponseButton.agent4 && (
                <Button onClick={() => openViewResponseDialog(4)} variant="outline" size="sm" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar Resposta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Loading Manual */}
      <Dialog
        open={manualLoadingDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setManualLoadingDialog({ open: false, agent: manualLoadingDialog.agent })
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Executando Agente {manualLoadingDialog.agent}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground text-center">
              {manualLoadingDialog.agent === 1 && "Classificando falha industrial..."}
              {manualLoadingDialog.agent === 2 && "Identificando causas prováveis..."}
              {manualLoadingDialog.agent === 3 && "Criando plano de investigação..."}
              {manualLoadingDialog.agent === 4 && "Aplicando a técnica dos 5 Porquês..."}
              <br />
              Por favor, aguarde enquanto o agente processa os dados.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Resposta */}
      <Dialog
        open={viewResponseDialog.isOpen}
        onOpenChange={(open) => setViewResponseDialog((prev) => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resposta do Agente {viewResponseDialog.agentNum}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{viewResponseDialog.lastResponse}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Resposta e Interação com Agentes */}
      <Dialog
        open={viewResponseDialog.isOpen}
        onOpenChange={(open) => setViewResponseDialog({ ...viewResponseDialog, isOpen: open })}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agente {viewResponseDialog.agentNum} - Conversa</DialogTitle>
            <DialogDescription>Visualize a resposta e interaja com o agente</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resposta inicial do agente */}
            {viewResponseDialog.agentNum && agentResponses[`agent${viewResponseDialog.agentNum}`] && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Resposta Inicial:</h4>
                <div className="whitespace-pre-wrap text-sm">
                  {agentResponses[`agent${viewResponseDialog.agentNum}`].extractedContent ||
                    agentResponses[`agent${viewResponseDialog.agentNum}`].data?.output ||
                    "Nenhuma resposta disponível"}
                </div>
              </div>
            )}

            {/* Histórico de chat */}
            {viewResponseDialog.agentNum &&
              chatMessages[`agent${viewResponseDialog.agentNum}`] &&
              chatMessages[`agent${viewResponseDialog.agentNum}`].length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Conversa:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded">
                    {chatMessages[`agent${viewResponseDialog.agentNum}`].map((message) => (
                      <div
                        key={message.id}
                        className={`p-2 rounded text-sm ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground ml-8"
                            : message.type === "agent"
                              ? "bg-muted mr-8"
                              : "bg-destructive/10 text-destructive text-center"
                        }`}
                      >
                        <div className="font-medium text-xs mb-1">
                          {message.type === "user"
                            ? "Você"
                            : message.type === "agent"
                              ? `Agente ${viewResponseDialog.agentNum}`
                              : "Sistema"}
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Input para nova mensagem */}
            {viewResponseDialog.agentNum && (
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={chatInputs[`agent${viewResponseDialog.agentNum}`] || ""}
                  onChange={(e) =>
                    setChatInputs((prev) => ({
                      ...prev,
                      [`agent${viewResponseDialog.agentNum}`]: e.target.value,
                    }))
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage(viewResponseDialog.agentNum)
                    }
                  }}
                  disabled={isSendingMessage[`agent${viewResponseDialog.agentNum}`]}
                />
                <Button
                  onClick={() => sendChatMessage(viewResponseDialog.agentNum)}
                  disabled={
                    isSendingMessage[`agent${viewResponseDialog.agentNum}`] ||
                    !chatInputs[`agent${viewResponseDialog.agentNum}`]?.trim()
                  }
                  size="sm"
                >
                  {isSendingMessage[`agent${viewResponseDialog.agentNum}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Loading Automático */}
      <Dialog open={showLoadingDialog} onOpenChange={setShowLoadingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Executando Análise Automática</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <div className="text-center space-y-2">
              <p className="font-medium">Executando Agente {currentAgent}</p>
              <p className="text-sm text-muted-foreground">
                {currentAgent === 1 && "Classificando falha industrial..."}
                {currentAgent === 2 && "Identificando causas prováveis..."}
                {currentAgent === 3 && "Criando plano de investigação..."}
                {currentAgent === 4 && "Aplicando a técnica dos 5 Porquês..."}
              </p>
              <Progress value={(currentAgent - 1) * 25} className="w-full" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
