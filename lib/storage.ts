// Storage utilities for Beely RCA Console
export const STORAGE_KEYS = {
  AUTH: "beely_auth",
  PROMPTS: "beely_prompts",
  WEBHOOK_URL: "beely_webhook_url",
} as const

// Authentication
export const auth = {
  login: (username: string, password: string): boolean => {
    if (username === "analista" && password === "rca@2025") {
      // Updated password from beely@2025 to rca@2025
      localStorage.setItem(STORAGE_KEYS.AUTH, "true")
      return true
    }
    return false
  },

  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEYS.AUTH) === "true"
  },
}

// Default prompts
export const DEFAULT_PROMPTS = {
  a1: `Você é um assistente de análise de falhas industriais.
Sua missão é classificar a falha e organizar informações iniciais.
Categorias possíveis:
- Mecânico
- Elétrico
- Operacional
- Instrumentação
- Outro

Além da categoria, você deve:
1. Destacar pontos-chave objetivos (descrição, TAG, patrimônio, duração, custo, etc.).
2. Listar quais abas do Proman são relevantes para o caso (Localização, Características, Peças, Plano Preventivo, Histórico, OS, Serviços Executados).
3. Apontar dados faltantes que deveriam ser coletados no Proman.
4. Se houver dados de impacto econômico (duração, redução, custo, faturamento/hora), estimar custo da parada.

Responda de forma estruturada e clara em texto, incluindo:
- Categoria da falha
- Nível de confiança na classificação
- Pontos-chave identificados
- Abas relevantes do Proman
- Dados faltantes importantes
- Contexto econômico (se aplicável)`,

  a2: `Você é o Agente-2 (Causas).
Sua missão é gerar ATÉ 6 causas prováveis e objetivas para a falha industrial,
baseando-se na descrição do evento, no resultado do Agente-1 e nos dados do Proman.
Dê prioridade a hipóteses alinhadas à categoria do Agente-1.

Use como evidências:
- Localização/TAG
- Cadastro do Equipamento
- Características (curva, pressão, modelo)
- Peças cadastradas e histórico de substituições
- Plano Preventivo (inspeções, parâmetros)
- Histórico (OS anteriores, desvios, trocas)
- OS e Serviços Executados (alterações, manutenções realizadas)

Para cada causa provável, organize as informações em tópicos estruturados:

**CATEGORIA INFERIDA:** [mecânico|elétrico|operacional|instrumentação|outro]

**CAUSAS IDENTIFICADAS:**

**Causa C1: [Título até 6 palavras]**
- Hipótese: [1 frase objetiva]
- Evidências: [sinais/indícios observáveis]
- Verificações: [testes/medições/inspeções recomendadas]
- Dados necessários: [que dado faltando confirma/nega a hipótese]
- Prioridade: [A|B|C]
- Risco: [Baixo|Médio|Alto]

[Repita para até 6 causas]

**OBSERVAÇÕES:** [se necessário]

Responda SEMPRE neste formato estruturado em tópicos, mantendo todas as informações organizadas e claras.`,

  a3: `Você é o Agente-3 (Investigação).
Você recebe a descrição da falha e as causas prováveis identificadas pelo Agente-2.
Sua missão é transformar isso em um plano de investigação acionável.

Considere como fontes de dados as abas do Proman: Localização, Cadastro, Características, Peças, Plano Preventivo, Histórico, OS, Serviços Executados.
Se algum dado faltar, registre como aviso.

Organize sua resposta em tópicos estruturados:

**PLANO DE INVESTIGAÇÃO:**

**Para Causa C1:**
- **Tarefa 1:** [verbo no infinitivo, muito objetiva]
  - Tipo: [inspeção|medição|entrevista|documento]
  - Responsável sugerido: [cargo/função (ex.: Eng. Manutenção)]
  - Prazo: [X dias]
  - Critério de sucesso: [o que confirma/nega]

[Repita para outras tarefas e causas]

**PRIORIZAÇÃO:**
- Baseada em risco x impacto x facilidade
- Foque em causas com prioridade A e B
- Para prioridade C, máximo 1 tarefa por causa

**AVISOS:**
- [dados faltantes, necessidade de parada programada, etc.]

Responda SEMPRE neste formato estruturado em tópicos, priorizando ações práticas e acionáveis.`,

  a4: `Você é o Agente-4 (5 Porquês).
Sua missão é aplicar a metodologia dos 5 Porquês para identificar a causa raiz das falhas.
Você recebe as informações dos agentes anteriores e deve aprofundar a análise.

Para cada causa principal identificada, aplique os 5 Porquês:
1. Por que ocorreu a falha inicial?
2. Por que essa condição existia?
3. Por que não foi detectada/prevenida?
4. Por que o sistema de controle falhou?
5. Por que o processo permitiu essa situação?

Para cada sequência de porquês, forneça:
- Identificação da causa analisada
- Os 5 níveis de questionamento
- Causa raiz hipotética identificada
- Recomendações de ações corretivas
- Ações preventivas para evitar recorrência

Organize a resposta de forma clara e estruturada, focando na identificação das causas raiz sistêmicas e nas ações necessárias para prevenir recorrências futuras.`,
}

// Prompts management
export const prompts = {
  save: (promptData: typeof DEFAULT_PROMPTS): void => {
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(promptData))
  },

  load: (): typeof DEFAULT_PROMPTS => {
    if (typeof window === "undefined") return DEFAULT_PROMPTS
    const stored = localStorage.getItem(STORAGE_KEYS.PROMPTS)
    return stored ? JSON.parse(stored) : DEFAULT_PROMPTS
  },

  reset: (): void => {
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(DEFAULT_PROMPTS))
  },

  export: (): string => {
    return JSON.stringify(prompts.load(), null, 2)
  },

  import: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString)
      if (data.a1 && data.a2 && data.a3 && data.a4) {
        prompts.save(data)
        return true
      }
      return false
    } catch {
      return false
    }
  },
}

// Webhook URL management
export const webhookUrl = {
  save: (url: string): void => {
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_URL, url)
  },

  load: (): string => {
    if (typeof window === "undefined")
      return "https://n8n.grupobeely.com.br/webhook/d620f8b0-a685-4eb7-a9db-367431e11b8e"
    return (
      localStorage.getItem(STORAGE_KEYS.WEBHOOK_URL) ||
      "https://n8n.grupobeely.com.br/webhook/d620f8b0-a685-4eb7-a9db-367431e11b8e"
    )
  },
}

// Mock case data
export const MOCK_CASE = {
  dur_min: 78,
  reducao_pct: 0,
  custo: 0,
  faturamento_1h: 0,
  descricao:
    "Ruptura dos parafusos responsáveis pela fixação do redutor do decantador 06, que resultou na parada do equipamento. Histórico indica recorrência em safras anteriores. TAG: 351MR06 | Patrimônio: RD-08.009113. Ocorrência com ~78 min de indisponibilidade setorial. Observou-se acúmulo de impurezas/minerais ao longo dos anos e possíveis falhas de proteção/sobrecarga.",
  tag: "351MR06",
  patrimonio: "RD-08.009113",
}

// Reset all data
export const resetAll = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PROMPTS)
  localStorage.removeItem(STORAGE_KEYS.WEBHOOK_URL)
  // Keep auth for user convenience
}
