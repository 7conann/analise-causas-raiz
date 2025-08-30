"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/storage"
import { Activity, Lock, User, Shield } from "lucide-react"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate loading for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (auth.login(username, password)) {
      router.push("/dashboard")
    } else {
      setError("Credenciais inválidas. Verifique usuário e senha.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-8 xl:p-12">
          <div className="mb-6 xl:mb-8">
            <img
              src="/industrial-factory-analysis-dashboard-with-charts-.png"
              alt="Análise Industrial"
              className="rounded-2xl shadow-2xl max-w-full h-auto max-h-[300px] xl:max-h-[400px] object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl xl:text-4xl font-bold mb-3 xl:mb-4">RCA Console</h1>
            <p className="text-lg xl:text-xl text-white/90 mb-4 xl:mb-6">Sistema Inteligente de Análise de Falhas</p>
            <div className="flex items-center gap-4 text-white/80 text-sm xl:text-base">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 xl:h-5 xl:w-5" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 xl:h-5 xl:w-5" />
                <span>Intuitivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="text-center mb-6 sm:mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-2xl mb-3 sm:mb-4 shadow-lg">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">RCA Console</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Sistema de Análise de Causa Raiz</p>
          </div>

          <Card className="shadow-2xl border border-border/50 bg-card">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                Bem-vindo de volta
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm lg:text-base">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="username" className="text-xs sm:text-sm font-semibold text-foreground">
                    Nome de Usuário
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Digite seu nome de usuário"
                      className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-base border-2 border-border focus:border-primary transition-all duration-200 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-foreground">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-base border-2 border-border focus:border-primary transition-all duration-200 rounded-lg"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                    <AlertDescription className="text-xs sm:text-sm font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-12 text-sm sm:text-base button-primary rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span className="text-xs sm:text-sm">Entrando no sistema...</span>
                    </div>
                  ) : (
                    "Entrar no Sistema"
                  )}
                </Button>
              </form>

              <div className="text-center pt-3 sm:pt-4 border-t border-border/50">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Credenciais de acesso:</p>
                <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                  <p className="text-xs font-mono">
                    <strong>Usuário:</strong> analista
                  </p>
                  <p className="text-xs font-mono">
                    <strong>Senha:</strong> rca@2025
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
