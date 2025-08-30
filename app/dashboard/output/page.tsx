"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Download, Printer, Copy, Eye, EyeOff, Maximize, Minimize } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface WebhookResponse {
  success: boolean
  status: number
  data: any
  contentType: string
  method: string
}

const possibleKeys = ["rca_last_response", "beely_last_response", "last_webhook_response"]

export default function OutputPage() {
  const { toast } = useToast()
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [response, setResponse] = useState<WebhookResponse | null>(null)
  const [showJson, setShowJson] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const loadResponse = () => {
      console.log("[v0] Loading response from localStorage...")

      let stored = null
      let usedKey = null

      for (const key of possibleKeys) {
        stored = localStorage.getItem(key)
        if (stored) {
          usedKey = key
          console.log(`[v0] Found response in key: ${key}`)
          break
        }
      }

      console.log("[v0] Stored response:", stored)

      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          console.log("[v0] Parsed response:", parsed)
          setResponse(parsed)

          if (parsed.success && parsed.data?.html) {
            console.log("[v0] Found HTML in response data, processing...")
            console.log("[v0] HTML content length:", parsed.data.html.length)

            const enhancedHtml = `
              <html>
                <head>
                  <meta charset="utf-8" />
                  <title>Relatório de Análise RCA</title>
                  <style>
                    * { box-sizing: border-box; }
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                      margin: 0; 
                      padding: 24px; 
                      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                      color: #f1f5f9;
                      line-height: 1.6;
                    }
                    .container {
                      max-width: 1200px;
                      margin: 0 auto;
                      background: #1e293b;
                      border-radius: 16px;
                      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                      overflow: hidden;
                      border: 1px solid #334155;
                    }
                    .header {
                      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                      color: white;
                      padding: 32px;
                      text-align: center;
                    }
                    .header h1 { 
                      margin: 0; 
                      font-size: 2.5rem; 
                      font-weight: 700;
                      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }
                    .content { padding: 32px; }
                    h2 { 
                      color: #60a5fa; 
                      margin: 32px 0 20px 0; 
                      font-size: 1.75rem;
                      font-weight: 600;
                      border-bottom: 3px solid #475569; 
                      padding-bottom: 12px; 
                    }
                    h3 {
                      color: #e2e8f0;
                      font-size: 1.25rem;
                      font-weight: 600;
                      margin: 20px 0 12px 0;
                    }
                    .card { 
                      background: linear-gradient(135deg, #334155 0%, #475569 100%);
                      border: 1px solid #64748b; 
                      border-radius: 12px;
                      padding: 24px; 
                      margin: 20px 0; 
                      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                      transition: transform 0.2s ease, box-shadow 0.2s ease;
                    }
                    .card:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 8px 15px rgba(0,0,0,0.3);
                    }
                    .subcard { 
                      background: #1e293b;
                      border: 2px dashed #64748b; 
                      padding: 20px; 
                      margin: 16px 0; 
                      border-radius: 8px;
                      position: relative;
                    }
                    .subcard::before {
                      content: '';
                      position: absolute;
                      top: -1px;
                      left: -1px;
                      right: -1px;
                      bottom: -1px;
                      background: linear-gradient(45deg, #3b82f6, #8b5cf6);
                      border-radius: 8px;
                      z-index: -1;
                      opacity: 0;
                      transition: opacity 0.3s ease;
                    }
                    .subcard:hover::before {
                      opacity: 0.2;
                    }
                    .avisos { 
                      background: linear-gradient(135deg, #451a03 0%, #78350f 100%);
                      border: 2px solid #f59e0b;
                      color: #fbbf24;
                    }
                    .avisos h3 {
                      color: #fbbf24;
                      display: flex;
                      align-items: center;
                      gap: 8px;
                    }
                    .avisos h3::before {
                      content: '⚠️';
                      font-size: 1.2em;
                    }
                    ul { 
                      margin: 12px 0; 
                      padding-left: 24px; 
                    }
                    li {
                      margin: 8px 0;
                      padding: 4px 0;
                    }
                    .subcard div {
                      margin: 8px 0;
                      padding: 4px 0;
                    }
                    .subcard b {
                      color: #60a5fa;
                      font-weight: 600;
                      display: inline-block;
                      min-width: 140px;
                    }
                    .causa-badge {
                      display: inline-block;
                      background: #3b82f6;
                      color: white;
                      padding: 4px 12px;
                      border-radius: 20px;
                      font-size: 0.875rem;
                      font-weight: 500;
                      margin-bottom: 12px;
                    }
                    .task-type {
                      display: inline-block;
                      padding: 2px 8px;
                      border-radius: 12px;
                      font-size: 0.75rem;
                      font-weight: 500;
                      text-transform: uppercase;
                      margin-left: 8px;
                    }
                    .task-type.inspecao { background: #1e40af; color: #dbeafe; }
                    .task-type.documento { background: #166534; color: #dcfce7; }
                    .task-type.medicao { background: #92400e; color: #fef3c7; }
                    @media (max-width: 768px) {
                      body { padding: 12px; }
                      .header { padding: 20px; }
                      .header h1 { font-size: 2rem; }
                      .content { padding: 20px; }
                      .card { padding: 16px; }
                      .subcard { padding: 16px; }
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>Relatório A3 – Análise de Falha</h1>
                    </div>
                    <div class="content">
                      ${parsed.data.html.replace(/<body[^>]*>(.*)<\/body>/s, "$1").replace(/<html[^>]*>|<\/html>|<head[^>]*>.*?<\/head>/gs, "")}
                    </div>
                  </div>
                  <script>
                    document.querySelectorAll('.subcard').forEach(card => {
                      const tipoDiv = Array.from(card.querySelectorAll('div')).find(div => 
                        div.innerHTML.includes('<b>Tipo:</b>')
                      );
                      if (tipoDiv) {
                        const tipo = tipoDiv.textContent.split(':')[1]?.trim();
                        if (tipo) {
                          const badge = document.createElement('span');
                          badge.className = 'task-type ' + tipo;
                          badge.textContent = tipo;
                          tipoDiv.appendChild(badge);
                        }
                      }
                    });
                    
                    document.querySelectorAll('.card h3').forEach(h3 => {
                      if (h3.textContent.includes('Causa')) {
                        const badge = document.createElement('div');
                        badge.className = 'causa-badge';
                        badge.textContent = h3.textContent;
                        h3.parentNode.insertBefore(badge, h3);
                        h3.style.display = 'none';
                      }
                    });
                  </script>
                </body>
              </html>
            `
            console.log("[v0] Enhanced HTML created, setting content...")
            setHtmlContent(enhancedHtml)
          } else if (parsed.success && parsed.contentType?.includes("text/html") && typeof parsed.data === "string") {
            console.log("[v0] Found HTML string in response data...")
            setHtmlContent(parsed.data)
          } else {
            console.log("[v0] No HTML found in response. Response structure:", {
              success: parsed.success,
              hasData: !!parsed.data,
              dataType: typeof parsed.data,
              hasHtml: !!parsed.data?.html,
              contentType: parsed.contentType,
            })
          }
        } catch (err) {
          console.error("[v0] Error parsing stored response:", err)
        }
      } else {
        console.log("[v0] No stored response found in localStorage")
      }
    }

    const pollForData = () => {
      const interval = setInterval(() => {
        console.log("[v0] Polling for new data...")
        loadResponse()

        // Parar polling se encontrou dados
        if (response) {
          clearInterval(interval)
        }
      }, 1000)

      // Limpar após 30 segundos
      setTimeout(() => {
        clearInterval(interval)
      }, 30000)

      return interval
    }

    loadResponse()
    const pollingInterval = pollForData()

    const handleWebhookComplete = (event: CustomEvent) => {
      console.log("[v0] Webhook complete event received:", event.detail)
      const { success, status } = event.detail

      if (success) {
        toast({
          title: "✅ Análise Concluída!",
          description: "O relatório foi gerado com sucesso. Redirecionando para visualização...",
          duration: 3000,
        })

        setTimeout(() => {
          console.log("[v0] Reloading response after webhook completion...")
          loadResponse()
        }, 500)
      } else {
        console.log("[v0] Webhook failed with status:", status)
        toast({
          title: "❌ Erro na Análise",
          description: `Falha ao gerar o relatório (Status: ${status})`,
          variant: "destructive",
          duration: 5000,
        })
      }
    }

    window.addEventListener("webhook-complete", handleWebhookComplete as EventListener)

    const handleStorageChange = (e: StorageEvent) => {
      console.log("[v0] Storage change detected:", e.key, e.newValue)
      if (possibleKeys.includes(e.key || "")) {
        loadResponse()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(pollingInterval)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("webhook-complete", handleWebhookComplete as EventListener)
    }
  }, [toast, router])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleDownloadHtml = () => {
    if (!htmlContent) {
      toast({
        title: "Nenhum HTML disponível",
        description: "Não há conteúdo HTML para download.",
        variant: "destructive",
      })
      return
    }

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `relatorio-rca-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.html`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "HTML baixado",
      description: "Arquivo HTML salvo com sucesso.",
    })
  }

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.print()
      } catch (err) {
        toast({
          title: "Erro ao imprimir",
          description: "Não foi possível imprimir o conteúdo.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Nenhum conteúdo para imprimir",
        description: "Não há conteúdo carregado no preview.",
        variant: "destructive",
      })
    }
  }

  const handleCopyJson = async () => {
    if (!response?.data) {
      toast({
        title: "Nenhum JSON disponível",
        description: "Não há dados JSON para copiar.",
        variant: "destructive",
      })
      return
    }

    try {
      const jsonString = JSON.stringify(response.data, null, 2)
      await navigator.clipboard.writeText(jsonString)
      toast({
        title: "JSON copiado",
        description: "Dados JSON copiados para a área de transferência.",
      })
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o JSON.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: number) => {
    if (status >= 200 && status < 300) return "default"
    if (status >= 400) return "destructive"
    return "secondary"
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Relatório de Análise - Tela Cheia</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadHtml} disabled={!htmlContent}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!htmlContent}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Minimize className="h-4 w-4 mr-2" />
              Sair da Tela Cheia
            </Button>
          </div>
        </div>
        <div className="h-[calc(100vh-73px)]">
          {htmlContent ? (
            <iframe
              ref={iframeRef}
              name="previewIframe"
              srcDoc={htmlContent}
              className="w-full h-full bg-slate-900"
              title="Webhook Response Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhum conteúdo disponível para preview</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📊 Visualização do Relatório</h1>
          <p className="text-muted-foreground">Visualize e gerencie o relatório de análise gerado</p>
        </div>

        {response && (
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(response.status)}>{response.status}</Badge>
            <Badge variant="outline">{response.method.toUpperCase()}</Badge>
          </div>
        )}
      </div>

      {!response ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Nenhuma resposta disponível</p>
              <p className="text-sm text-muted-foreground">
                Execute uma análise na aba Execução para ver os resultados aqui
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>🛠️ Ações</CardTitle>
              <CardDescription>Gerencie a saída do relatório</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleDownloadHtml} disabled={!htmlContent}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar HTML
                </Button>
                <Button variant="outline" onClick={handlePrint} disabled={!htmlContent}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="outline" onClick={toggleFullscreen} disabled={!htmlContent}>
                  <Maximize className="h-4 w-4 mr-2" />
                  Tela Cheia
                </Button>
                {response.data && typeof response.data === "object" && (
                  <Button variant="ghost" size="sm" onClick={() => setShowJson(!showJson)}>
                    {showJson ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showJson ? "Ocultar" : "Ver"} Dados Técnicos
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {showJson && response.data && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dados Técnicos (JSON)</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyJson}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words word-wrap-break-word font-mono">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Preview Frame */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Relatório de Análise</CardTitle>
              <CardDescription>
                Visualização do relatório gerado
                {response.contentType && ` (${response.contentType})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {htmlContent ? (
                <div className="border border-border rounded-md overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    name="previewIframe"
                    srcDoc={htmlContent}
                    className="w-full h-[700px] bg-slate-900"
                    title="Webhook Response Preview"
                    sandbox="allow-scripts allow-same-origin"
                    onLoad={() => console.log("[v0] Iframe loaded successfully")}
                    onError={() => console.log("[v0] Iframe failed to load")}
                  />
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Nenhum conteúdo disponível para preview.
                    {response && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Debug: Success={response.success ? "true" : "false"}, HasData={response.data ? "true" : "false"}
                        , ContentType={response.contentType || "none"}
                        {response.data && typeof response.data === "object" && (
                          <div>HasHTML={response.data.html ? "true" : "false"}</div>
                        )}
                      </div>
                    )}
                    {response?.method === "form" && " O resultado será exibido aqui quando recebido."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">📈 Status da Execução</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={getStatusBadgeVariant(response.status)} className="text-xs">
                    {response.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Método:</span>
                  <Badge variant="outline" className="text-xs">
                    {response.method.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Resultado:</span>
                  <span className={response.success ? "text-green-500" : "text-red-500"}>
                    {response.success ? "✅ Sucesso" : "❌ Erro"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
