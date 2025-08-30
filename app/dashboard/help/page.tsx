"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Play, Eye, Settings, Lightbulb, AlertTriangle, CheckCircle } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">❓ Central de Ajuda</h1>
        <p className="text-muted-foreground">Aprenda como usar a plataforma de análise de falhas industriais</p>
      </div>

      <div className="grid gap-6">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />O que é esta plataforma?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Esta é uma plataforma de <strong>Análise de Causa Raiz (RCA)</strong> que ajuda você a investigar falhas
              industriais de forma sistemática e profissional.
            </p>
            <p>
              A plataforma usa <strong>3 agentes de inteligência artificial</strong> especializados que trabalham em
              conjunto para analisar problemas e gerar relatórios detalhados no formato A3.
            </p>
          </CardContent>
        </Card>

        {/* Como funciona */}
        <Card>
          <CardHeader>
            <CardTitle>🔄 Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Configure os Agentes</h4>
                  <p className="text-sm text-muted-foreground">
                    Na aba "Prompts", você pode personalizar como cada agente de IA vai analisar o problema.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Descreva o Problema</h4>
                  <p className="text-sm text-muted-foreground">
                    Na aba "Execução", preencha os dados sobre a falha que aconteceu.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Execute a Análise</h4>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Executar Análise" e aguarde os agentes processarem as informações.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">Visualize o Relatório</h4>
                  <p className="text-sm text-muted-foreground">
                    Na aba "Visualização", veja o relatório A3 completo gerado automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              Os 3 Agentes de IA
            </CardTitle>
            <CardDescription>Cada agente tem uma especialidade diferente na análise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">🔍 Agente 1</Badge>
                  <h4 className="font-semibold">Classificador</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Analisa e classifica o tipo de falha, identifica padrões e categoriza o problema de acordo com
                  metodologias industriais estabelecidas.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">🎯 Agente 2</Badge>
                  <h4 className="font-semibold">Investigador de Causas</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Investiga as possíveis causas raiz do problema usando técnicas como os "5 Porquês" e análise de causa
                  e efeito.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">📋 Agente 3</Badge>
                  <h4 className="font-semibold">Planejador de Ações</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cria um plano de ação detalhado com tarefas específicas, responsáveis e prazos para resolver o
                  problema e evitar recorrências.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seções da plataforma */}
        <Card>
          <CardHeader>
            <CardTitle>🧭 Navegando pela Plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Bot className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Prompts</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure como cada agente de IA vai trabalhar. Você pode personalizar as instruções ou usar as
                    configurações padrão que já funcionam muito bem.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Play className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Execução</h4>
                  <p className="text-sm text-muted-foreground">
                    Preencha os dados sobre a falha: descrição do problema, equipamento afetado, tempo de parada,
                    custos, etc. Não precisa ser técnico!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Visualização</h4>
                  <p className="text-sm text-muted-foreground">
                    Veja o relatório A3 completo, imprima, baixe em HTML ou visualize em tela cheia. Perfeito para
                    apresentações e documentação.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Configurações</h4>
                  <p className="text-sm text-muted-foreground">
                    Gerencie suas configurações, faça backup dos dados, configure temas e redefina a plataforma quando
                    necessário.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Dicas para Melhores Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-sm">
                <strong>Seja específico:</strong> Quanto mais detalhes você fornecer sobre a falha, melhor será a
                análise dos agentes.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm">
                <strong>Use o caso exemplo:</strong> Se não souber como preencher, clique em "Usar Caso de Exemplo" para
                ver um modelo.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-sm">
                <strong>Salve regularmente:</strong> Seus dados ficam salvos automaticamente, mas é sempre bom fazer
                backup nas configurações.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm">
                <strong>Revise o relatório:</strong> O relatório gerado pode ser editado e personalizado antes da
                impressão ou apresentação.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Problemas comuns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Problemas Comuns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-sm">A análise não está funcionando</h4>
              <p className="text-sm text-muted-foreground">
                Verifique se todos os campos obrigatórios estão preenchidos e se a URL do webhook está configurada
                corretamente nas configurações.
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-sm">O relatório não aparece</h4>
              <p className="text-sm text-muted-foreground">
                Aguarde alguns segundos após a execução. Se o problema persistir, tente usar o método "Enviar via Form"
                na página de execução.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-sm">Perdi meus dados</h4>
              <p className="text-sm text-muted-foreground">
                Os dados ficam salvos no seu navegador. Se limpou o cache, use a função de importar nas configurações
                para restaurar um backup.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
