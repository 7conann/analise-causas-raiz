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
  Send,
  FileText,
  Loader2,
  Info,
  Clock,
  DollarSign,
  TrendingDown,
  Tag,
  Hash,
  CheckCircle,
  Play,
  Pause,
  BookOpen,
  Eye,
  MessageCircle,
  EyeOff,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export default function ExecutionPage() {
  const router = useRouter()

  const [webhookURLs, setWebhookURLs] = useState({
    agent1: "https://n8n.grupobeely.com.br/webhook/d620f8b0-a685-4eb7-a9db-367431e11b8e",
    agent2: "https://n8n.grupobeely.com.br/webhook/segundo",
    agent3: "https://n8n.grupobeely.com.br/webhook/terceiro",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingDialog, setShowLoadingDialog] = useState(false)

  const [executionMode, setExecutionMode] = useState<"auto" | "manual">("auto")
  const [currentAgent, setCurrentAgent] = useState(1)
  const [agentResponses, setAgentResponses] = useState({
    agent1: null,
    agent2: null,
    agent3: null,
  })
  const [agentStatus, setAgentStatus] = useState({
    agent1: "pending", // pending, processing, completed, error
    agent2: "pending",
    agent3: "pending",
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
  })

  const [viewResponseDialog, setViewResponseDialog] = useState<{
    open: boolean
    agentNum: number | null
    lastResponse: string
  }>({
    open: false,
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
  })

  const [continuousInteraction, setContinuousInteraction] = useState({
    agent1: false,
    agent2: false,
    agent3: false,
  })

  const [interactionHistory, setInteractionHistory] = useState({
    agent1: [],
    agent2: [],
    agent3: [],
  })

  const [showPreview, setShowPreview] = useState({
    agent1: false,
    agent2: false,
    agent3: false,
  })

  const [chatMessages, setChatMessages] = useState({
    agent1: [],
    agent2: [],
    agent3: [],
  })

  const [chatInput, setChatInput] = useState({
    agent1: "",
    agent2: "",
    agent3: "",
  })

  const [isSendingMessage, setIsSendingMessage] = useState({
    agent1: false,
    agent2: false,
    agent3: false,
  })

  const [expandedMessages, setExpandedMessages] = useState<{ [key: string]: boolean }>({})

  const [hideLastResponse, setHideLastResponse] = useState(false)

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
        })
      } catch (error) {
        console.error("[v0] Erro ao carregar prompts:", error)
      }
    }

    loadPrompts()
  }, [])

  const sendChatMessage = async (agentNumber: number) => {
    const inputValue = chatInput[`agent${agentNumber}`] || ""
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
    setChatInput((prev) => ({
      ...prev,
      [`agent${agentNumber}`]: "",
    }))

    try {
      const payload = await buildPayload(true)
      const webhookURL = webhookURLs[`agent${agentNumber}`]

      let previousResponse = null
      if (agentNumber > 1) {
        const previousAgentKey = `agent${agentNumber - 1}`
        if (agentResponses[previousAgentKey]?.data) {
          previousResponse = agentResponses[previousAgentKey].data
          console.log(`[v0] Enviando resposta do Agent ${agentNumber - 1} como contexto para Agent ${agentNumber}`)
        }
      }

      const requestData = {
        prompts: { [`a${agentNumber}`]: currentPrompts[`a${agentNumber}`] },
        payload,
        agent: agentNumber,
        chatMessage: message,
        type: "chat_interaction",
        ...(previousResponse && { previousResponse }),
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

        const responseContent =
          responseData.output ||
          responseData.message?.content ||
          (typeof responseData.message === "string" ? responseData.message : JSON.stringify(responseData))

        const safeResponseContent =
          typeof responseContent === "string" ? responseContent : String(responseContent || "")

        if (!safeResponseContent || safeResponseContent.trim() === "" || safeResponseContent === "{}") {
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
        } else {
          const agentMessage = {
            id: Date.now() + 1,
            type: "agent",
            content: responseContent,
            timestamp: new Date().toISOString(),
          }

          setChatMessages((prev) => ({
            ...prev,
            [`agent${agentNumber}`]: [...prev[`agent${agentNumber}`], agentMessage],
          }))

          toast({
            title: "Mensagem Enviada",
            description: `Resposta recebida do Agente ${agentNumber}`,
          })
        }
      } else {
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
              : "Agente de Investigação",
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

  const executeAgent = async (agentNumber: number, inputData?: any) => {
    try {
      setIsLoading(true)
      console.log(`[v0] Executing Agent ${agentNumber}`)

      const payload = buildPayload(true)
      console.log(`[v0] Payload completo para Agent ${agentNumber}:`, payload)
      console.log(`[v0] Descrição com base de conhecimento:`, payload.descricao)

      let requestData

      if (agentNumber === 1) {
        requestData = {
          prompts: { a1: currentPrompts.a1 },
          payload: payload, // Usando payload já construído
          agent: 1,
        }
      } else if (agentNumber === 2) {
        requestData = {
          prompts: { [`a${agentNumber}`]: currentPrompts[`a${agentNumber}`] },
          payload: payload, // Usando payload já construído
          previousResponse: inputData,
          agent: agentNumber,
        }
      } else {
        // Terceiro agente recebe a resposta do agente anterior COM base de conhecimento
        requestData = {
          prompts: { [`a${agentNumber}`]: currentPrompts[`a${agentNumber}`] },
          payload: payload, // Usando payload já construído
          previousResponse: inputData,
          agent: agentNumber,
        }
      }

      const webhookUrl = webhookURLs[`agent${agentNumber}`]
      console.log(`[v0] Sending request to Agent ${agentNumber}:`, webhookUrl)
      console.log(`[v0] Request data completo:`, JSON.stringify(requestData, null, 2)) // Log mais detalhado

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      const responseData = await response.text()
      console.log(`[v0] Agent ${agentNumber} raw response:`, responseData)

      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseData)
      } catch {
        parsedResponse = { html: responseData, raw: responseData }
      }

      let extractedContent = ""
      if (parsedResponse && Array.isArray(parsedResponse) && parsedResponse[0]?.message?.content) {
        // Formato: [{"index": 0, "message": {"role": "assistant", "content": "..."}}]
        extractedContent = parsedResponse[0].message.content
        console.log(`[v0] Extracted content from Agent ${agentNumber}:`, extractedContent)
      } else if (parsedResponse?.message?.content) {
        // Formato: {"message": {"content": "..."}}
        extractedContent = parsedResponse.message.content
      } else if (parsedResponse?.html) {
        // Formato HTML
        extractedContent = parsedResponse.html
      } else if (typeof parsedResponse === "string") {
        // Resposta em texto simples
        extractedContent = parsedResponse
      } else {
        // Fallback para JSON completo
        extractedContent = JSON.stringify(parsedResponse, null, 2)
      }

      const contentAsString = typeof extractedContent === "string" ? extractedContent : JSON.stringify(extractedContent)

      if (!extractedContent || contentAsString.trim() === "" || contentAsString === "{}") {
        console.log(`[v0] Rate limit detectado para Agent ${agentNumber}`)

        const agentResponse = {
          agent: agentNumber,
          success: false,
          status: response.status,
          data: parsedResponse,
          extractedContent:
            "⚠️ Resposta vazia recebida. Isso pode ser devido ao rate limit do serviço. Aguarde até 60 segundos e tente executar novamente.",
          error: "Rate limit ou resposta vazia detectada",
        }

        setAgentResponses((prev) => ({
          ...prev,
          [`agent${agentNumber}`]: agentResponse,
        }))

        toast({
          title: "Rate Limit Detectado",
          description: `Agente ${agentNumber}: Aguarde 60 segundos antes de tentar novamente`,
          variant: "destructive",
        })

        return agentResponse
      }

      const agentResponse = {
        agent: agentNumber,
        success: response.ok,
        status: response.status,
        data: parsedResponse,
        timestamp: new Date().toISOString(),
      }

      const monitoringResponse = {
        id: `agent${agentNumber}_${Date.now()}`,
        agentName:
          agentNumber === 1
            ? "Agente Classificador"
            : agentNumber === 2
              ? "Agente de Causas"
              : "Agente de Investigação",
        status: response.ok ? "completed" : "error",
        timestamp: new Date().toISOString(),
        response: extractedContent,
        processingTime: null,
        error: response.ok ? null : "Erro na resposta do webhook",
      }

      console.log(`[v0] Saving monitoring response for Agent ${agentNumber}:`, monitoringResponse)

      // Salvar resposta individual para monitoramento
      const existingResponses = JSON.parse(localStorage.getItem("rca_agent_responses") || "[]")
      const updatedResponses = [...existingResponses, monitoringResponse]
      localStorage.setItem("rca_agent_responses", JSON.stringify(updatedResponses))

      // Manter formato original para compatibilidade
      localStorage.setItem(`agent${agentNumber}_response`, JSON.stringify(agentResponse))

      window.dispatchEvent(new CustomEvent("agent-response", { detail: monitoringResponse }))

      setAgentResponses((prev) => ({
        ...prev,
        [`agent${agentNumber}`]: agentResponse,
      }))

      setAgentStatus((prev) => ({
        ...prev,
        [`agent${agentNumber}`]: response.ok ? "completed" : "error",
      }))

      console.log(`[v0] Agent ${agentNumber} completed successfully`)

      if (executionMode === "manual") {
        setManualLoadingDialog({ open: false, agent: agentNumber })
        setShowViewResponseButton((prev) => ({
          ...prev,
          [`agent${agentNumber}`]: true,
        }))
      }

      setTimeout(() => saveProgress(), 100)

      return agentResponse
    } catch (error) {
      console.log(`[v0] Error in Agent ${agentNumber}:`, error)

      const errorResponse = {
        id: `agent${agentNumber}_error_${Date.now()}`,
        agentName:
          agentNumber === 1
            ? "Agente Classificador"
            : agentNumber === 2
              ? "Agente de Causas"
              : "Agente de Investigação",
        status: "error" as const,
        timestamp: new Date().toISOString(),
        response: null,
        processingTime: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }

      const existingResponses = JSON.parse(localStorage.getItem("rca_agent_responses") || "[]")
      const updatedResponses = [...existingResponses, errorResponse]
      localStorage.setItem("rca_agent_responses", JSON.stringify(updatedResponses))

      window.dispatchEvent(new CustomEvent("agent-response", { detail: errorResponse }))

      if (executionMode === "manual") {
        setManualLoadingDialog({ open: false, agent: agentNumber })
      }

      setAgentStatus((prev) => ({
        ...prev,
        [`agent${agentNumber}`]: "error",
      }))

      toast({
        title: `❌ Erro no Agente ${agentNumber}`,
        description: `Falha ao processar com o Agente ${agentNumber}`,
        variant: "destructive",
      })

      setTimeout(() => saveProgress(), 100)

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const executeAllAgents = async () => {
    console.log("[v0] Starting automatic sequential execution")

    setIsLoading(true)
    setShowLoadingDialog(true)
    setCurrentAgent(1)

    // Reset status
    setAgentStatus({
      agent1: "pending",
      agent2: "pending",
      agent3: "pending",
    })
    setAgentResponses({
      agent1: null,
      agent2: null,
      agent3: null,
    })

    try {
      // Executar Agente 1
      setCurrentAgent(1)
      const agent1Response = await executeAgent(1)

      // Executar Agente 2 com resposta do Agente 1
      setCurrentAgent(2)
      const agent2Response = await executeAgent(2, agent1Response.data)

      // Executar Agente 3 com resposta do Agente 2
      setCurrentAgent(3)
      const agent3Response = await executeAgent(3, agent2Response.data)

      const finalReport = {
        success: true,
        status: 200,
        data: {
          agent1: agent1Response.data,
          agent2: agent2Response.data,
          agent3: agent3Response.data,
          combined: true,
          timestamp: new Date().toISOString(),
        },
        contentType: "application/json; charset=utf-8",
        method: "fetch",
      }

      const executionId = `agent3_auto_${Date.now()}`
      const historicalExecution = {
        id: executionId,
        agentName: "Agente de Investigação",
        timestamp: new Date().toISOString(),
        response: agent3Response.data,
        agent: 3,
        caseData: caseData,
        mode: "auto",
      }

      // Carregar e atualizar histórico do agente 3
      let agent3History = []
      try {
        const existingHistory = localStorage.getItem("rca_agent3_history")
        if (existingHistory) {
          agent3History = JSON.parse(existingHistory)
        }
      } catch (err) {
        console.error("[v0] Error loading agent 3 history:", err)
      }

      agent3History.unshift(historicalExecution) // Adiciona no início (mais recente primeiro)

      // Limitar histórico a 50 execuções para evitar crescimento excessivo
      if (agent3History.length > 50) {
        agent3History = agent3History.slice(0, 50)
      }

      localStorage.setItem("rca_agent3_history", JSON.stringify(agent3History))
      console.log("[v0] Saved auto mode agent 3 execution to history:", executionId)

      localStorage.setItem("beely_last_response", JSON.stringify(finalReport))
      localStorage.setItem("rca_response", JSON.stringify(finalReport))
      localStorage.setItem("latest_analysis", JSON.stringify(finalReport))

      setShowLoadingDialog(false)
      setIsLoading(false)

      toast({
        title: "✅ Análise completa concluída",
        description:
          "Todos os 3 agentes processaram com sucesso! Use o botão 'Visualizar Resposta' do Agente 3 para ver o relatório.",
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
    if (currentAgent > 3) return

    try {
      let inputData = null
      if (currentAgent === 2 && agentResponses.agent1) {
        inputData = agentResponses.agent1.data
      } else if (currentAgent === 3 && agentResponses.agent2) {
        inputData = agentResponses.agent2.data
      }

      await executeAgent(currentAgent, inputData)

      if (currentAgent < 3) {
        setCurrentAgent((prev) => prev + 1)
        toast({
          title: `✅ Agente ${currentAgent} concluído`,
          description: `Pronto para executar Agente ${currentAgent + 1}`,
        })
      } else {
        // Último agente - gerar relatório final
        toast({
          title: "✅ Todos os agentes concluídos",
          description: "Análise completa! Use o botão 'Visualizar Resposta' do Agente 3 para ver o relatório.",
          duration: 5000,
        })

        // Removido: setTimeout(() => { router.push("/dashboard/output") }, 1500)
      }
    } catch (error) {
      console.log("[v0] Error in manual execution:", error)
    }
  }

  const handleWebhookURLChange = (agent: string, value: string) => {
    setWebhookURLs((prev) => ({ ...prev, [agent]: value }))
    if (agent === "agent1") {
      webhookUrl.save(value) // Manter compatibilidade com storage existente
    }
  }

  const handleLoadExampleCase = () => {
    setCaseData({
      duracao_minutos: "78",
      reducao_percentual: "0",
      custo_estimado: "0",
      faturamento_hora: "0",
      descricao:
        "Ruptura dos parafusos responsáveis pela fixação do redutor do decantador 06, que resultou na parada do equipamento. Histórico indica recorrência em safras anteriores. TAG: 351MR06 | Patrimonio: RD-08.009113. Ocorrência com ~78 min de indisponibilidade setorial. Observou-se acúmulo de impurezas/minerais ao longo dos anos e possíveis falhas de proteção/sobrecarga.",
      tag_equipamento: "351MR06",
      patrimonio: "RD-08.009113",
    })
    toast({
      title: "✅ Exemplo carregado",
      description: "Os dados de exemplo foram preenchidos nos campos.",
    })
  }

  const validateFields = () => {
    if (!caseData.descricao.trim()) {
      toast({
        title: "❌ Campo obrigatório",
        description: "A descrição da falha é obrigatória.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const openViewResponseDialog = (agentNum: number) => {
    const agentResponse = agentResponses[`agent${agentNum}`]
    let lastResponse = ""

    if (agentResponse?.data?.message?.content) {
      lastResponse =
        typeof agentResponse.data.message.content === "string"
          ? agentResponse.data.message.content
          : JSON.stringify(agentResponse.data.message.content, null, 2)
    }

    setViewResponseDialog({
      open: true,
      agentNum,
      lastResponse,
    })
  }

  const buildPayload = (includeKnowledgeBase = false) => {
    let knowledgeBase = ""

    if (includeKnowledgeBase && selectedKnowledgeBase.length > 0) {
      try {
        const savedKnowledge = localStorage.getItem("rca_knowledge_base")
        if (savedKnowledge) {
          const documents = JSON.parse(savedKnowledge)
          const selectedDocs = documents.filter((doc: any) => selectedKnowledgeBase.includes(doc.id))

          if (selectedDocs && selectedDocs.length > 0) {
            knowledgeBase = "\n\n=== BASE DE CONHECIMENTO ===\n"
            selectedDocs.forEach((doc: any, index: number) => {
              knowledgeBase += `\n--- Documento ${index + 1}: ${doc.name} ---\n`
              knowledgeBase += `${doc.content}\n`
            })
            knowledgeBase += "\n=== FIM DA BASE DE CONHECIMENTO ===\n"
            console.log("[v0] Base de conhecimento carregada para todos os agentes:", selectedDocs.length, "documentos")
            console.log("[v0] Conteúdo da base de conhecimento:", knowledgeBase.substring(0, 500) + "...")
          }
        }
      } catch (error) {
        console.error("[v0] Erro ao carregar base de conhecimento:", error)
      }
    } else {
      console.log("[v0] Nenhuma base de conhecimento selecionada ou includeKnowledgeBase é false")
      console.log("[v0] selectedKnowledgeBase:", selectedKnowledgeBase)
      console.log("[v0] includeKnowledgeBase:", includeKnowledgeBase)
    }

    const payload = {
      dur_min: Number.parseInt(caseData.duracao_minutos) || 0,
      reducao_pct: Number.parseFloat(caseData.reducao_percentual) || 0,
      custo: Number.parseFloat(caseData.custo_estimado) || 0,
      faturamento_1h: Number.parseFloat(caseData.faturamento_hora) || 0,
      descricao: caseData.descricao + knowledgeBase, // Adicionando base de conhecimento à descrição
    }

    console.log("[v0] Payload construído:", { includeKnowledgeBase, knowledgeBaseLength: knowledgeBase.length })
    return payload
  }

  const saveProgress = () => {
    const hasCompletedAgents = Object.values(agentStatus).some((status) => status === "completed")
    const hasResponses = Object.values(agentResponses).some((response) => response !== null)

    if (!hasCompletedAgents && !hasResponses && currentAgent === 1) {
      // Don't save empty initial state
      return
    }

    const progressData = {
      executionMode,
      currentAgent,
      agentResponses,
      agentStatus,
      showViewResponseButton,
      caseData,
      webhookURLs,
      selectedKnowledgeBase,
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Saving execution progress:", progressData)
    localStorage.setItem("rca_execution_progress", JSON.stringify(progressData))
  }

  const loadExecutionProgress = () => {
    try {
      const savedProgress = localStorage.getItem("rca_execution_progress")
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress)
        console.log("[v0] Loading saved progress:", progressData)

        let nextAgent = 1
        if (progressData.agentStatus?.agent3 === "completed") {
          nextAgent = 4 // All completed
        } else if (progressData.agentStatus?.agent2 === "completed") {
          nextAgent = 3
        } else if (progressData.agentStatus?.agent1 === "completed") {
          nextAgent = 2
        }

        const hasCompletedAgents = Object.values(progressData.agentStatus || {}).some(
          (status) => status === "completed",
        )

        if (hasCompletedAgents) {
          console.log(`[v0] Found completed agents, setting currentAgent to ${nextAgent}`)
          setCurrentAgent(nextAgent)
          setAgentResponses(progressData.agentResponses || { agent1: null, agent2: null, agent3: null })
          setAgentStatus(progressData.agentStatus || { agent1: "pending", agent2: "pending", agent3: "pending" })
          setShowViewResponseButton(
            progressData.showViewResponseButton || { agent1: false, agent2: false, agent3: false },
          )
        } else {
          // No completed agents, use saved state as-is
          setCurrentAgent(progressData.currentAgent || 1)
          setAgentResponses(progressData.agentResponses || { agent1: null, agent2: null, agent3: null })
          setAgentStatus(progressData.agentStatus || { agent1: "pending", agent2: "pending", agent3: null })
          setShowViewResponseButton(
            progressData.showViewResponseButton || { agent1: false, agent2: false, agent3: false },
          )
        }

        setExecutionMode(progressData.executionMode || "auto")
        setCaseData(
          progressData.caseData || {
            duracao_minutos: "",
            reducao_percentual: "",
            custo_estimado: "",
            faturamento_hora: "",
            descricao: "",
            tag_equipamento: "",
            patrimonio: "",
          },
        )
        setWebhookURLs(
          progressData.webhookURLs || {
            agent1: "https://n8n.grupobeely.com.br/webhook/d620f8b0-a685-4eb7-a9db-367431e11b8e",
            agent2: "https://n8n.grupobeely.com.br/webhook/segundo",
            agent3: "https://n8n.grupobeely.com.br/webhook/terceiro",
          },
        )
        setSelectedKnowledgeBase(progressData.selectedKnowledgeBase || [])

        toast({
          title: "📋 Progresso restaurado",
          description: hasCompletedAgents
            ? `Pronto para executar Agente ${nextAgent > 3 ? "- Todos concluídos" : nextAgent}`
            : "Seu progresso anterior foi carregado automaticamente.",
          duration: 3000,
        })
      }
    } catch (error) {
      console.log("[v0] Error loading saved progress:", error)
    }
  }

  const loadAvailableDocuments = () => {
    try {
      const savedKnowledge = localStorage.getItem("rca_knowledge_base")
      if (savedKnowledge) {
        const documents = JSON.parse(savedKnowledge)
        setAvailableDocuments(documents || [])
        // Selecionar todos por padrão
        setSelectedKnowledgeBase(documents?.map((doc: any) => doc.id) || [])
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar documentos:", error)
    }
  }

  const resetExecution = () => {
    setCurrentAgent(1)
    setAgentResponses({ agent1: null, agent2: null, agent3: null })
    setAgentStatus({ agent1: "pending", agent2: "pending", agent3: "pending" })
    setShowViewResponseButton({ agent1: false, agent2: false, agent3: false })
    setSelectedKnowledgeBase([])
    localStorage.removeItem("agent1_response")
    localStorage.removeItem("agent2_response")
    localStorage.removeItem("agent3_response")
    localStorage.removeItem("rca_execution_progress")

    toast({
      title: "🔄 Execução resetada",
      description: "Todos os dados e progresso foram limpos.",
    })
  }

  const clearProgress = () => {
    setCurrentAgent(1)
    setAgentResponses({ agent1: null, agent2: null, agent3: null })
    setAgentStatus({ agent1: "pending", agent2: "pending", agent3: "pending" })
    setShowViewResponseButton({ agent1: false, agent2: false, agent3: false })
    localStorage.removeItem("rca_execution_progress")

    toast({
      title: "🧹 Progresso limpo",
      description: "Progresso da execução foi limpo, mas os dados do caso foram mantidos.",
    })
  }

  const handleViewResponse = (agentNumber: number) => {
    console.log(`[v0] Viewing response for agent ${agentNumber}`)

    if (agentNumber === 3) {
      const agent3Response = agentResponses.agent3
      if (agent3Response) {
        // Salvar no histórico de execuções do agente 3
        const executionId = `agent3_${Date.now()}`
        const historicalExecution = {
          id: executionId,
          agentName: "Agente de Investigação",
          timestamp: new Date().toISOString(),
          response: agent3Response.data,
          agent: 3,
          caseData: caseData,
        }

        // Carregar histórico existente
        let agent3History = []
        try {
          const existingHistory = localStorage.getItem("rca_agent3_history")
          if (existingHistory) {
            agent3History = JSON.parse(existingHistory)
          }
        } catch (err) {
          console.error("[v0] Error loading agent 3 history:", err)
        }

        // Adicionar nova execução ao histórico
        agent3History.unshift(historicalExecution) // Adiciona no início (mais recente primeiro)

        // Limitar histórico a 50 execuções para evitar crescimento excessivo
        if (agent3History.length > 50) {
          agent3History = agent3History.slice(0, 50)
        }

        // Salvar histórico atualizado
        localStorage.setItem("rca_agent3_history", JSON.stringify(agent3History))
        console.log("[v0] Saved agent 3 execution to history:", executionId)

        // Manter compatibilidade com sistema atual
        localStorage.setItem("rca_response", JSON.stringify(agent3Response))
        localStorage.setItem("latest_analysis", JSON.stringify(agent3Response))

        router.push("/dashboard/output")
      }
    } else {
      // Agentes 1 e 2 vão para monitoramento
      router.push("/dashboard/monitoring")
    }
  }

  const toggleDocumentSelection = (docId: string) => {
    setSelectedKnowledgeBase((prev) => (prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]))
  }

  useEffect(() => {
    if (hasLoadedProgress) {
      // Add a small delay to prevent immediate overwrite
      const timeoutId = setTimeout(() => {
        saveProgress()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [
    executionMode,
    currentAgent,
    agentResponses,
    agentStatus,
    showViewResponseButton,
    caseData,
    webhookURLs,
    selectedKnowledgeBase,
    hasLoadedProgress,
  ])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Análise de Falhas</h1>
        <p className="text-muted-foreground">Sistema de análise com 3 agentes especializados</p>
      </div>

      <Dialog open={showLoadingDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Processando Análise Sequencial
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="w-full space-y-4">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>Agente {currentAgent}/3</span>
              </div>
              <Progress value={(currentAgent / 3) * 100} className="w-full" />
            </div>

            <div className="space-y-3 w-full">
              {[1, 2, 3].map((agentNum) => (
                <div
                  key={agentNum}
                  className={`flex items-center gap-3 p-2 rounded ${
                    agentStatus[`agent${agentNum}`] === "completed"
                      ? "bg-green-50 text-green-700"
                      : agentStatus[`agent${agentNum}`] === "processing"
                        ? "bg-blue-50 text-blue-700"
                        : agentStatus[`agent${agentNum}`] === "error"
                          ? "bg-red-50 text-red-700"
                          : "text-muted-foreground"
                  }`}
                >
                  {agentStatus[`agent${agentNum}`] === "completed" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : agentStatus[`agent${agentNum}`] === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 border-2 border-muted rounded-full" />
                  )}
                  <span className="text-sm">
                    Agente {agentNum}:{" "}
                    {agentNum === 1
                      ? "Classificação da Falha"
                      : agentNum === 2
                        ? "Análise de Causas"
                        : "Plano de Investigação"}
                  </span>
                  <Badge
                    variant={
                      agentStatus[`agent${agentNum}`] === "completed"
                        ? "default"
                        : agentStatus[`agent${agentNum}`] === "processing"
                          ? "secondary"
                          : agentStatus[`agent${agentNum}`] === "error"
                            ? "destructive"
                            : "outline"
                    }
                    className="ml-auto text-xs"
                  >
                    {agentStatus[`agent${agentNum}`] === "completed"
                      ? "Concluído"
                      : agentStatus[`agent${agentNum}`] === "processing"
                        ? "Processando"
                        : agentStatus[`agent${agentNum}`] === "error"
                          ? "Erro"
                          : "Aguardando"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                {currentAgent === 1 && "Classificando tipo de falha..."}
                {currentAgent === 2 && "Analisando causas prováveis..."}
                {currentAgent === 3 && "Gerando plano de investigação..."}
              </div>
              <div className="text-xs text-muted-foreground">
                Executando agentes sequencialmente com base nas respostas anteriores.
              </div>
            </div>

            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={manualLoadingDialog.open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Executando Agente {manualLoadingDialog.agent}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                {manualLoadingDialog.agent === 1 && "Classificando tipo de falha..."}
                {manualLoadingDialog.agent === 2 && "Analisando causas prováveis..."}
                {manualLoadingDialog.agent === 3 && "Gerando plano de investigação..."}
              </div>
              <div className="text-xs text-muted-foreground">
                Por favor, aguarde enquanto o agente processa os dados.
              </div>
            </div>

            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewResponseDialog.open}
        onOpenChange={(open) => {
          setViewResponseDialog((prev) => ({ ...prev, open }))
          if (!open) setHideLastResponse(false)
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Chat com Agente {viewResponseDialog.agentNum}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHideLastResponse(!hideLastResponse)}
                className="flex items-center gap-2"
              >
                {hideLastResponse ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Mostrar Resposta
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Mostrar somente o chat
                  </>
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>

          {viewResponseDialog.agentNum && (
            <div className={`flex flex-col ${hideLastResponse ? "h-[70vh]" : "h-[60vh]"}`}>
              {!hideLastResponse && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Última Resposta:</h4>
                  <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {viewResponseDialog.lastResponse}
                  </div>
                </div>
              )}

              <div
                className={`flex-1 overflow-y-auto space-y-2 p-2 border rounded-lg bg-background ${hideLastResponse ? "min-h-[50vh]" : ""}`}
              >
                {chatMessages[`agent${viewResponseDialog.agentNum}`]?.map((msg) => {
                  const messageContent = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)

                  return (
                    <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                          msg.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <div className="break-words whitespace-pre-wrap">
                          {expandedMessages[msg.id] || messageContent.length <= 200
                            ? messageContent
                            : messageContent.substring(0, 200) + "..."}
                        </div>
                        {messageContent.length > 200 && (
                          <button
                            onClick={() =>
                              setExpandedMessages((prev) => ({
                                ...prev,
                                [msg.id]: !prev[msg.id],
                              }))
                            }
                            className="text-xs underline mt-2 opacity-70 hover:opacity-100 transition-opacity"
                          >
                            {expandedMessages[msg.id] ? "Ver menos" : "Ver mais"}
                          </button>
                        )}
                        <div className="text-xs opacity-60 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  )
                })}
                {chatMessages[`agent${viewResponseDialog.agentNum}`]?.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma mensagem ainda. Comece uma conversa!
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <Textarea
                  placeholder={`Digite sua mensagem para o Agente ${viewResponseDialog.agentNum}...`}
                  value={chatInput[`agent${viewResponseDialog.agentNum}`] || ""}
                  onChange={(e) =>
                    setChatInput((prev) => ({
                      ...prev,
                      [`agent${viewResponseDialog.agentNum}`]: e.target.value,
                    }))
                  }
                  className="min-h-[80px] resize-none w-full"
                />
                <Button
                  onClick={() => sendChatMessage(viewResponseDialog.agentNum!)}
                  disabled={
                    isSendingMessage[`agent${viewResponseDialog.agentNum}`] ||
                    !(chatInput[`agent${viewResponseDialog.agentNum}`] || "").trim()
                  }
                  className="w-full"
                >
                  {isSendingMessage[`agent${viewResponseDialog.agentNum}`] ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração dos Agentes</CardTitle>
            <CardDescription>URLs dos 3 agentes especializados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((agentNum) => (
              <div key={agentNum} className="space-y-2">
                <Label htmlFor={`webhook-agent${agentNum}`}>
                  Agente {agentNum}:{" "}
                  {agentNum === 1
                    ? "Classificação da Falha"
                    : agentNum === 2
                      ? "Análise de Causas"
                      : "Plano de Investigação"}
                </Label>
                <Input
                  id={`webhook-agent${agentNum}`}
                  type="url"
                  value={webhookURLs[`agent${agentNum}`]}
                  onChange={(e) => handleWebhookURLChange(`agent${agentNum}`, e.target.value)}
                  placeholder={`https://n8n.grupobeely.com.br/webhook/${agentNum === 1 ? "d620f8b0-a685-4eb7-a9db-367431e11b8e" : agentNum === 2 ? "segundo" : "terceiro"}`}
                  className="font-mono text-sm border border-border"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dados da Falha</CardTitle>
                <CardDescription>Preencha as informações sobre a falha industrial</CardDescription>
              </div>
              <Button variant="outline" onClick={handleLoadExampleCase} disabled={isLoading}>
                <FileText className="h-4 w-4 mr-2" />
                Carregar Exemplo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="descricao" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Descrição da Falha *
              </Label>
              <Textarea
                id="descricao"
                value={caseData.descricao}
                onChange={(e) => setCaseData((prev) => ({ ...prev, descricao: e.target.value }))}
                className="min-h-[120px] border border-border"
                placeholder="Descreva detalhadamente o que aconteceu, quando ocorreu, equipamentos envolvidos..."
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tag" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  TAG do Equipamento
                </Label>
                <Input
                  id="tag"
                  value={caseData.tag_equipamento}
                  onChange={(e) => setCaseData((prev) => ({ ...prev, tag_equipamento: e.target.value }))}
                  placeholder="Ex: 351MR06"
                  className="border border-border"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patrimonio" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Número do Patrimônio
                </Label>
                <Input
                  id="patrimonio"
                  value={caseData.patrimonio}
                  onChange={(e) => setCaseData((prev) => ({ ...prev, patrimonio: e.target.value }))}
                  placeholder="Ex: RD-08.009113"
                  className="border border-border"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duracao" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duração (minutos)
                </Label>
                <Input
                  id="duracao"
                  type="number"
                  value={caseData.duracao_minutos}
                  onChange={(e) => setCaseData((prev) => ({ ...prev, duracao_minutos: e.target.value }))}
                  placeholder="78"
                  className="border border-border"
                  disabled={isLoading}
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
                  step="0.1"
                  value={caseData.reducao_percentual}
                  onChange={(e) => setCaseData((prev) => ({ ...prev, reducao_percentual: e.target.value }))}
                  placeholder="0"
                  className="border border-border"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custo" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Custo Estimado (R$)
                </Label>
                <Input
                  id="custo"
                  type="number"
                  step="0.01"
                  value={caseData.custo_estimado}
                  onChange={(e) => setCaseData((prev) => ({ ...prev, custo_estimado: e.target.value }))}
                  placeholder="0"
                  className="border border-border"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faturamento" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Faturamento/Hora (R$)
                </Label>
                <Input
                  id="faturamento"
                  type="number"
                  step="0.01"
                  value={caseData.faturamento_hora}
                  onChange={(e) => setCaseData((prev) => ({ ...prev, faturamento_hora: e.target.value }))}
                  placeholder="0"
                  className="border border-border"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>💡 Dica:</strong> Use o botão "Carregar Exemplo" para ver como preencher os campos com um caso
                real de falha industrial. Todos os campos são opcionais exceto a descrição.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {availableDocuments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Base de Conhecimento
              </CardTitle>
              <CardDescription>
                Selecione os documentos que serão enviados para o Agente 3 (Investigação)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={doc.id}
                      checked={selectedKnowledgeBase.includes(doc.id)}
                      onCheckedChange={() => toggleDocumentSelection(doc.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={doc.id} className="text-sm font-medium cursor-pointer">
                        {doc.name}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {doc.type === "pdf" ? "PDF" : "Texto"} • {doc.content.length} caracteres
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {doc.type === "pdf" ? "PDF" : "TXT"}
                    </Badge>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    {selectedKnowledgeBase.length} de {availableDocuments.length} documentos selecionados
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedKnowledgeBase([])}
                      disabled={selectedKnowledgeBase.length === 0}
                    >
                      Desmarcar Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedKnowledgeBase(availableDocuments.map((doc) => doc.id))}
                      disabled={selectedKnowledgeBase.length === availableDocuments.length}
                    >
                      Marcar Todos
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Executar Análise</CardTitle>
            <CardDescription>Escolha o modo de execução dos agentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seletor de modo */}
            <div className="flex gap-4">
              <Button
                variant={executionMode === "auto" ? "default" : "outline"}
                onClick={() => setExecutionMode("auto")}
                disabled={isLoading}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Automático
              </Button>
              <Button
                variant={executionMode === "manual" ? "default" : "outline"}
                onClick={() => setExecutionMode("manual")}
                disabled={isLoading}
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Manual
              </Button>
            </div>

            {/* Status dos agentes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((agentNum) => (
                <div key={agentNum} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Agente {agentNum}</span>
                    <Badge
                      variant={
                        agentStatus[`agent${agentNum}`] === "completed"
                          ? "default"
                          : agentStatus[`agent${agentNum}`] === "processing"
                            ? "secondary"
                            : agentStatus[`agent${agentNum}`] === "error"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {agentStatus[`agent${agentNum}`] === "completed"
                        ? "Concluído"
                        : agentStatus[`agent${agentNum}`] === "processing"
                          ? "Processando"
                          : agentStatus[`agent${agentNum}`] === "error"
                            ? "Erro"
                            : "Aguardando"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {agentNum === 1 ? "Classificação" : agentNum === 2 ? "Análise de Causas" : "Plano de Investigação"}
                  </p>

                  {agentResponses[`agent${agentNum}`] && (
                    <div className="mb-3 space-y-2">
                      <div className="text-xs font-medium">Chat com Agente {agentNum}</div>

                      {/* Mensagens do chat */}
                      {chatMessages[`agent${agentNum}`].length > 0 && (
                        <div className="max-h-32 overflow-y-auto space-y-1 bg-muted/50 p-2 rounded text-xs">
                          {chatMessages[`agent${agentNum}`].map((msg) => (
                            <div key={msg.id} className={`${msg.type === "user" ? "text-right" : "text-left"}`}>
                              <div
                                className={`max-w-[80%] p-2 rounded-lg text-sm ${
                                  msg.type === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                <div className="break-words">
                                  {(() => {
                                    const messageContent =
                                      typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
                                    return expandedMessages[msg.id] || messageContent.length <= 100
                                      ? messageContent
                                      : messageContent.substring(0, 100) + "..."
                                  })()}
                                </div>
                                {(() => {
                                  const messageContent =
                                    typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
                                  return (
                                    messageContent.length > 100 && (
                                      <button
                                        onClick={() =>
                                          setExpandedMessages((prev) => ({
                                            ...prev,
                                            [msg.id]: !prev[msg.id],
                                          }))
                                        }
                                        className="text-xs underline mt-1 opacity-70 hover:opacity-100"
                                      >
                                        {expandedMessages[msg.id] ? "Ver menos" : "Ver mais"}
                                      </button>
                                    )
                                  )
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input do chat */}
                      <div className="flex gap-1 flex-col">
                        <Textarea
                          placeholder={`Digite sua mensagem para o Agente ${agentNum}...`}
                          value={chatInput[`agent${agentNum}`]}
                          onChange={(e) =>
                            setChatInput((prev) => ({
                              ...prev,
                              [`agent${agentNum}`]: e.target.value,
                            }))
                          }
                          className="min-h-[80px] resize-none"
                        />
                        <Button
                          onClick={() => sendChatMessage(agentNum)}
                          disabled={
                            isSendingMessage[`agent${agentNum}`] || !(chatInput[`agent${agentNum}`] || "").trim()
                          }
                          className="w-full"
                        >
                          {isSendingMessage[`agent${agentNum}`] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {showViewResponseButton[`agent${agentNum}`] && (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => openViewResponseDialog(agentNum)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar Resposta
                      </Button>
                      <Button
                        onClick={() => startContinuousInteraction(agentNum)}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Continuar Interação
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Botões de execução */}
            <div className="space-y-4">
              {executionMode === "auto" ? (
                <div className="space-y-2">
                  <Button
                    onClick={executeAllAgents}
                    disabled={isLoading || !caseData.descricao.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                    {isLoading ? "Executando Sequencialmente..." : "🚀 Executar Todos os Agentes"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Executa os 3 agentes automaticamente em sequência
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={executeNextAgent}
                      disabled={isLoading || !caseData.descricao.trim() || currentAgent > 3}
                      className="flex-1"
                      size="lg"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Executar Agente {currentAgent}
                    </Button>
                    <Button variant="outline" onClick={clearProgress} disabled={isLoading} size="sm">
                      Limpar Progresso
                    </Button>
                    <Button variant="outline" onClick={resetExecution} disabled={isLoading} size="sm">
                      Reset Completo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Execute um agente por vez para controle manual
                  </p>
                </div>
              )}
            </div>

            <Alert>
              <AlertDescription>
                🤖 <strong>Modo Automático:</strong> Executa os 3 agentes sequencialmente. Cada agente usa a resposta do
                anterior.
                <br />
                ⏸️ <strong>Modo Manual:</strong> Permite executar um agente por vez para análise detalhada de cada etapa.
                <br />💾 <strong>Progresso Salvo:</strong> Seu progresso é salvo automaticamente e restaurado ao voltar
                à página.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
