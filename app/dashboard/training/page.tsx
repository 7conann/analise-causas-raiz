"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, Trash2, Download, Plus, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface KnowledgeDocument {
  id: string
  name: string
  content: string
  uploadDate: string
  size: number
  type: "pdf" | "text"
}

export default function TrainingPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [manualText, setManualText] = useState("")
  const [manualTitle, setManualTitle] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = () => {
    try {
      const saved = localStorage.getItem("rca_knowledge_base")
      if (saved) {
        setDocuments(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    }
  }

  const saveDocuments = (docs: KnowledgeDocument[]) => {
    try {
      localStorage.setItem("rca_knowledge_base", JSON.stringify(docs))
      setDocuments(docs)
    } catch (error) {
      console.error("Erro ao salvar documentos:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar documento na base de conhecimento",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === "application/pdf" || file.type === "text/plain") {
        setSelectedFile(file)
      } else {
        toast({
          title: "Formato não suportado",
          description: "Apenas arquivos PDF e TXT são aceitos",
          variant: "destructive",
        })
      }
    }
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      console.log("[v0] Iniciando extração de PDF:", file.name)

      return new Promise((resolve, reject) => {
        // Verificar se PDF.js já está carregado
        if (window.pdfjsLib) {
          if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
          }
          processPDF(file, window.pdfjsLib).then(resolve).catch(reject)
          return
        }

        // Carregar PDF.js dinamicamente
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        script.onload = () => {
          // Aguardar o PDF.js estar disponível
          const checkPdfJs = () => {
            if (window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

              console.log("[v0] PDF.js carregado e worker configurado")
              processPDF(file, window.pdfjsLib).then(resolve).catch(reject)
            } else {
              setTimeout(checkPdfJs, 100)
            }
          }
          checkPdfJs()
        }
        script.onerror = () => {
          reject(new Error("Falha ao carregar PDF.js"))
        }
        document.head.appendChild(script)
      })
    } catch (error) {
      console.error("[v0] Erro na extração de PDF:", error)
      console.log("[v0] Usando fallback: salvando PDF sem extração de texto")
      return `[PDF] ${file.name}\n\nNota: O texto não pôde ser extraído automaticamente deste PDF. Por favor, adicione o conteúdo manualmente se necessário.`
    }
  }

  const processPDF = async (file: File, pdfjsLib: any): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    console.log("[v0] PDF carregado, páginas:", pdf.numPages)

    let fullText = ""

    // Extrair texto de todas as páginas
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      const pageText = textContent.items.map((item: any) => item.str).join(" ")
      fullText += `\n--- Página ${pageNum} ---\n${pageText}\n`

      console.log("[v0] Página", pageNum, "processada, caracteres:", pageText.length)
    }

    console.log("[v0] Extração concluída, total de caracteres:", fullText.length)
    return fullText.trim()
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      console.log("[v0] Iniciando upload do arquivo:", selectedFile.name, selectedFile.type)

      let content = ""

      if (selectedFile.type === "application/pdf") {
        content = await extractTextFromPDF(selectedFile)
      } else {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsText(selectedFile)
        })
      }

      if (!content.trim()) {
        throw new Error("Não foi possível extrair texto do arquivo")
      }

      const newDocument: KnowledgeDocument = {
        id: Date.now().toString(),
        name: selectedFile.name,
        content,
        uploadDate: new Date().toISOString(),
        size: selectedFile.size,
        type: selectedFile.type === "application/pdf" ? "pdf" : "text",
      }

      const updatedDocs = [...documents, newDocument]
      saveDocuments(updatedDocs)

      toast({
        title: "Sucesso",
        description: `Documento "${selectedFile.name}" processado e adicionado à base de conhecimento`,
      })

      console.log("[v0] Documento salvo com sucesso:", newDocument.name)

      setSelectedFile(null)
      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("[v0] Erro ao processar arquivo:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar o arquivo",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleManualAdd = () => {
    if (!manualTitle.trim() || !manualText.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive",
      })
      return
    }

    const newDocument: KnowledgeDocument = {
      id: Date.now().toString(),
      name: manualTitle.trim(),
      content: manualText.trim(),
      uploadDate: new Date().toISOString(),
      size: new Blob([manualText]).size,
      type: "text",
    }

    const updatedDocs = [...documents, newDocument]
    saveDocuments(updatedDocs)

    toast({
      title: "Sucesso",
      description: `Documento "${manualTitle}" adicionado à base de conhecimento`,
    })

    setManualTitle("")
    setManualText("")
  }

  const handleDeleteDocument = (id: string) => {
    const updatedDocs = documents.filter((doc) => doc.id !== id)
    saveDocuments(updatedDocs)

    toast({
      title: "Documento removido",
      description: "Documento removido da base de conhecimento",
    })
  }

  const exportKnowledgeBase = () => {
    const dataStr = JSON.stringify(documents, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `base-conhecimento-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
        <p className="text-muted-foreground">
          Gerencie documentos e textos que serão utilizados como contexto adicional nas análises
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload de Arquivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Documento
            </CardTitle>
            <CardDescription>Faça upload de arquivos PDF ou TXT para adicionar à base de conhecimento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Selecionar Arquivo</Label>
              <Input id="file-upload" type="file" accept=".pdf,.txt" onChange={handleFileSelect} className="mt-1" />
              {selectedFile && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
              )}
            </div>
            <Button onClick={handleFileUpload} disabled={!selectedFile || isUploading} className="w-full">
              {isUploading ? "Processando..." : "Adicionar à Base"}
            </Button>
          </CardContent>
        </Card>

        {/* Adição Manual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Texto Manual
            </CardTitle>
            <CardDescription>Adicione texto diretamente sem fazer upload de arquivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manual-title">Título do Documento</Label>
              <Input
                id="manual-title"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Ex: Procedimentos de Manutenção"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="manual-text">Conteúdo</Label>
              <Textarea
                id="manual-text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Digite ou cole o conteúdo do documento..."
                className="mt-1 min-h-[120px]"
              />
            </div>
            <Button onClick={handleManualAdd} className="w-full">
              Adicionar à Base
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos na Base ({documents.length})
              </CardTitle>
              <CardDescription>Documentos disponíveis para uso nas análises</CardDescription>
            </div>
            {documents.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportKnowledgeBase}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Base
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento na base de conhecimento</p>
              <p className="text-sm">Adicione documentos para começar</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {documents.map((doc, index) => (
                  <div key={doc.id}>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{doc.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {doc.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>{new Date(doc.uploadDate).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(doc)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>{doc.name}</DialogTitle>
                              <DialogDescription>
                                Adicionado em {new Date(doc.uploadDate).toLocaleDateString("pt-BR")} •{" "}
                                {formatFileSize(doc.size)}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[60vh] mt-4">
                              <div className="whitespace-pre-wrap text-sm p-4 bg-muted rounded-md">{doc.content}</div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {index < documents.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
