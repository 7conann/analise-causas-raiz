"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  FileText,
  Play,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface DashboardStats {
  totalAnalyses: number
  successfulAnalyses: number
  failedAnalyses: number
  lastAnalysisDate: string | null
  avgProcessingTime: number
  promptsConfigured: number
  analysisHistory: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalyses: 0,
    successfulAnalyses: 0,
    failedAnalyses: 0,
    lastAnalysisDate: null,
    avgProcessingTime: 0,
    promptsConfigured: 3,
    analysisHistory: [],
  })

  useEffect(() => {
    const loadStats = () => {
      try {
        const analysisHistory = JSON.parse(localStorage.getItem("rca_analysis_history") || "[]")
        const lastResponse = localStorage.getItem("rca_last_response")
        const executionHistory = JSON.parse(localStorage.getItem("rca_execution_history") || "[]")

        const totalAnalyses = analysisHistory.length + executionHistory.length
        const successfulAnalyses =
          analysisHistory.filter((a: any) => a.success).length + executionHistory.filter((e: any) => e.success).length
        const failedAnalyses = totalAnalyses - successfulAnalyses

        let lastAnalysisDate = null
        if (lastResponse) {
          const response = JSON.parse(lastResponse)
          lastAnalysisDate = response.timestamp || new Date().toISOString()
        }

        let chartData = []
        if (executionHistory.length > 0) {
          chartData = executionHistory.slice(-7).map((item: any, index: number) => ({
            day: `Dia ${index + 1}`,
            analyses: item.analyses || 0,
            success: item.success || 0,
            failed: item.failed || 0,
          }))
        } else {
          chartData = Array.from({ length: 7 }, (_, index) => ({
            day: `Dia ${index + 1}`,
            analyses: 0,
            success: 0,
            failed: 0,
          }))
        }

        setStats({
          totalAnalyses,
          successfulAnalyses,
          failedAnalyses,
          lastAnalysisDate,
          avgProcessingTime:
            executionHistory.length > 0
              ? executionHistory.reduce((acc: number, curr: any) => acc + (curr.processingTime || 0), 0) /
                executionHistory.length
              : 0,
          promptsConfigured: 3,
          analysisHistory: chartData,
        })
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
        setStats({
          totalAnalyses: 0,
          successfulAnalyses: 0,
          failedAnalyses: 0,
          lastAnalysisDate: null,
          avgProcessingTime: 0,
          promptsConfigured: 3,
          analysisHistory: Array.from({ length: 7 }, (_, index) => ({
            day: `Dia ${index + 1}`,
            analyses: 0,
            success: 0,
            failed: 0,
          })),
        })
      }
    }

    loadStats()
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const successRate = stats.totalAnalyses > 0 ? (stats.successfulAnalyses / stats.totalAnalyses) * 100 : 0

  const pieData = [
    { name: "Sucesso", value: stats.successfulAnalyses, color: "#22c55e" },
    { name: "Falha", value: stats.failedAnalyses, color: "#ef4444" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📊 Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua plataforma de análise de falhas industriais</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Análises</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">Análises realizadas até agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Análise</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastAnalysisDate ? new Date(stats.lastAnalysisDate).toLocaleDateString("pt-BR") : "Nunca"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastAnalysisDate
                ? new Date(stats.lastAnalysisDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                : "Execute sua primeira análise"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime.toFixed(0)}s</div>
            <p className="text-xs text-muted-foreground">Processamento por análise</p>
          </CardContent>
        </Card>
      </div>

      {stats.totalAnalyses === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma análise realizada ainda</h3>
            <p className="text-muted-foreground mb-4">Execute sua primeira análise para ver dados reais na dashboard</p>
            <Link href="/dashboard/execution">
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Executar Primeira Análise
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>📈 Histórico de Análises</CardTitle>
            <CardDescription>Análises realizadas nos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.analysisHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="analyses" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Taxa de Sucesso</CardTitle>
            <CardDescription>Distribuição de análises bem-sucedidas vs falhas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.totalAnalyses > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Nenhum dado para exibir</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Status do Sistema
            </CardTitle>
            <CardDescription>Estado atual dos componentes da plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Agentes de IA</span>
              </div>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configurados
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span className="text-sm">Sistema de Execução</span>
              </div>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operacional
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm">Visualização</span>
              </div>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Funcionando
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Armazenamento Local</span>
              </div>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🚀 Ações Rápidas</CardTitle>
            <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/execution">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Nova Análise de Falha
              </Button>
            </Link>

            <Link href="/dashboard/prompts">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Configurar Agentes
              </Button>
            </Link>

            <Link href="/dashboard/output">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Ver Último Relatório
              </Button>
            </Link>

            <Link href="/dashboard/help">
              <Button className="w-full justify-start" variant="ghost">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Precisa de Ajuda?
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📊 Análises por Período</CardTitle>
          <CardDescription>Comparativo de sucessos e falhas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.analysisHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="success" fill="#22c55e" name="Sucessos" />
                <Bar dataKey="failed" fill="#ef4444" name="Falhas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📈 Resumo das Análises</CardTitle>
          <CardDescription>Estatísticas detalhadas sobre suas análises de falha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-500">{stats.successfulAnalyses}</div>
              <p className="text-sm text-muted-foreground">Análises Bem-sucedidas</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-500">{stats.failedAnalyses}</div>
              <p className="text-sm text-muted-foreground">Análises com Erro</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{stats.promptsConfigured}</div>
              <p className="text-sm text-muted-foreground">Agentes Configurados</p>
            </div>
          </div>

          {stats.totalAnalyses === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dados de exemplo sendo exibidos</h3>
              <p className="text-muted-foreground mb-4">Execute sua primeira análise para ver dados reais</p>
              <Link href="/dashboard/execution">
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Primeira Análise
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
