"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { prompts, webhookUrl } from "@/lib/storage"
import { Send, FileText, Loader2, Info, Clock, DollarSign, TrendingDown, Tag, Hash } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ExecutionPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [webhookURL, setWebhookURL] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingDialog, setShowLoadingDialog] = useState(false)

  const [caseData, setCaseData] = useState({
    duracao_minutos: "",
    reducao_percentual: "",
    custo_estimado: "",
    faturamento_hora: "",
    descricao: "",
    tag_equipamento: "",
    patrimonio: "",
  })

  useEffect(() => {
    setWebhookURL(webhookUrl.load())
  }, [])

  const handleWebhookURLChange = (value: string) => {
    setWebhookURL(value)
    webhookUrl.save(value)
  }

  const handleLoadExampleCase = () => {
    setCaseData({
      duracao_minutos: "78",
      reducao_percentual: "0",
      custo_estimado: "0",
      faturamento_hora: "0",
      descricao:
        "Ruptura dos parafusos responsáveis pela fixação do redutor do decantador 06, que resultou na parada do equipamento. Histórico indica recorrência em safras anteriores. TAG: 351MR06 | Patrimônio: RD-08.009113. Ocorrência com ~78 min de indisponibilidade setorial. Observou-se acúmulo de impurezas/minerais ao longo dos anos e possíveis falhas de proteção/sobrecarga.",
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

  const buildPayload = () => {
    return {
      dur_min: Number.parseInt(caseData.duracao_minutos) || 0,
      reducao_pct: Number.parseFloat(caseData.reducao_percentual) || 0,
      custo: Number.parseFloat(caseData.custo_estimado) || 0,
      faturamento_1h: Number.parseFloat(caseData.faturamento_hora) || 0,
      descricao: caseData.descricao,
      tag: caseData.tag_equipamento,
      patrimonio: caseData.patrimonio,
    }
  }

  const dispatchWebhookComplete = (success: boolean, status: number) => {
    const event = new CustomEvent("webhook-complete", {
      detail: { success, status },
    })
    window.dispatchEvent(event)
  }

  const handleSendViaFetch = async () => {
    if (!validateFields()) return

    setIsLoading(true)
    setShowLoadingDialog(true)

    try {
      const currentPrompts = prompts.load()
      const requestData = {
        prompts: {
          a1: currentPrompts.a1,
          a2: currentPrompts.a2,
          a3: currentPrompts.a3,
        },
        payload: buildPayload(),
      }

      console.log("[v0] Sending request to webhook:", webhookURL)
      console.log("[v0] Request data:", requestData)

      const response = await fetch(webhookURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const responseData = await response.text()
      console.log("[v0] Raw response:", responseData)

      let parsedResponse

      try {
        parsedResponse = JSON.parse(responseData)
        console.log("[v0] Parsed JSON response:", parsedResponse)
      } catch {
        parsedResponse = { html: responseData, raw: responseData }
        console.log("[v0] Response is not JSON, treating as HTML")
      }

      const responseObj = {
        success: response.ok,
        status: response.status,
        data: parsedResponse,
        contentType: response.headers.get("content-type") || "",
        method: "fetch",
        timestamp: new Date().toISOString(),
      }

      console.log("[v0] Saving response to localStorage:", responseObj)
      localStorage.setItem("beely_last_response", JSON.stringify(responseObj))

      const savedResponse = localStorage.getItem("beely_last_response")
      console.log("[v0] Verification - saved response:", savedResponse)

      localStorage.setItem("rca_response", JSON.stringify(responseObj))
      localStorage.setItem("latest_analysis", JSON.stringify(responseObj))

      setShowLoadingDialog(false)

      if (response.ok) {
        toast({
          title: "✅ Análise concluída",
          description: "A análise foi gerada com sucesso! Redirecionando para visualização...",
          duration: 3000,
        })

        const event = new CustomEvent("analysis-complete", {
          detail: responseObj,
        })
        window.dispatchEvent(event)

        setTimeout(() => {
          router.push("/dashboard/output")
        }, 1500)
      }

      dispatchWebhookComplete(response.ok, response.status)
    } catch (err: any) {
      console.log("[v0] Error during fetch:", err)
      setShowLoadingDialog(false)
      toast({
        title: "❌ Erro de conexão",
        description: err.message || "Não foi possível conectar ao sistema. Tente o método alternativo.",
        variant: "destructive",
      })
      dispatchWebhookComplete(false, 0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendViaForm = () => {
    if (!validateFields()) return

    setShowLoadingDialog(true)

    const currentPrompts = prompts.load()
    const requestData = {
      prompts: {
        a1: currentPrompts.a1,
        a2: currentPrompts.a2,
        a3: currentPrompts.a3,
      },
      payload: buildPayload(),
    }

    const form = document.createElement("form")
    form.method = "POST"
    form.action = webhookURL
    form.target = "previewIframe"
    form.style.display = "none"

    const input = document.createElement("input")
    input.type = "hidden"
    input.name = "payload"
    input.value = JSON.stringify(requestData)

    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)

    localStorage.setItem(
      "beely_last_response",
      JSON.stringify({
        success: true,
        status: 200,
        data: { message: "Enviado via método alternativo - verifique a aba Saída" },
        contentType: "text/html",
        method: "form",
      }),
    )

    setTimeout(() => {
      setShowLoadingDialog(false)
      toast({
        title: "✅ Análise enviada",
        description: "Os dados foram enviados. Redirecionando para visualização...",
        duration: 3000,
      })

      setTimeout(() => {
        router.push("/dashboard/output")
      }, 1500)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Análise de Falhas</h1>
        <p className="text-muted-foreground">Preencha os dados da falha para gerar uma análise completa</p>
      </div>

      <Dialog open={showLoadingDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Gerando Análise
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Por favor, aguarde...</div>
              <div className="text-xs text-muted-foreground">
                Os agentes de IA estão processando os dados da falha e gerando uma análise completa.
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

      <div className="grid gap-6">
        {/* Webhook URL Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Sistema</CardTitle>
            <CardDescription>URL do sistema de análise (configurado automaticamente)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL do Sistema de Análise</Label>
              <Input
                id="webhook-url"
                type="url"
                value={webhookURL}
                onChange={(e) => handleWebhookURLChange(e.target.value)}
                placeholder="https://n8n.grupobeely.com.br/webhook/..."
                className="font-mono text-sm border border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Case Data Form */}
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
            {/* Descrição da Falha */}
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

            {/* Informações Técnicas */}
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

            {/* Informações de Impacto */}
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

        {/* Execution Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Gerar Análise</CardTitle>
            <CardDescription>Envie os dados para o sistema de análise de falhas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={handleSendViaFetch}
                disabled={isLoading || !webhookURL || !caseData.descricao.trim()}
                className="flex-1"
                size="lg"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {isLoading ? "Processando Análise..." : "🚀 Gerar Análise"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendViaForm}
                disabled={isLoading || !webhookURL || !caseData.descricao.trim()}
                className="flex-1 bg-transparent"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                Método Alternativo
              </Button>
            </div>

            <Alert>
              <AlertDescription>
                🤖 O sistema irá processar os dados da falha através de três agentes de IA especializados para gerar uma
                análise completa com classificação, causas prováveis e plano de investigação.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
