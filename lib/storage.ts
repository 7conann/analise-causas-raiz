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

Responda SEMPRE em JSON válido:
{
  "categoria": "<uma das 5 categorias>",
  "confianca": 0.0,
  "pontos_chave": [],
  "abas_relevantes": [],
  "dados_faltantes": [],
  "contexto_economico": {
    "duracao_min": 0,
    "reducao_percent": 0,
    "custo_estimado": 0,
    "faturamento_hora": 0,
    "custo_parada_estimado": "se possível calcule"
  }
}`,

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

Responda SEMPRE em JSON válido e curto, em PT-BR:

{
  "categoria_inferida": "<mecânico|elétrico|operacional|instrumentação|outro>",
  "causas": [
    {
      "id": "C1",
      "titulo": "até 6 palavras",
      "hipotese": "1 frase objetiva",
      "evidencias": ["origem no Proman ou indício observado"],
      "verificacoes": ["testes/medições/inspeções recomendadas"],
      "dados_necessarios": ["qual dado faltante confirma/nega"],
      "prioridade": "A|B|C",
      "risco": "Baixo|Médio|Alto",
      "origem_proman": ["Características","Peças","Plano Preventivo","Histórico","OS > Serviços Executados"]
    }
  ],
  "observacoes": "se necessário"
}

Se o texto do Agente-1 não vier em JSON, extraia a categoria do texto livre e siga normalmente.
Não escreva nada fora do JSON.`,

  a3: `Você é o Agente-3 (Investigação).
Você recebe a descrição da falha e um JSON com causas prováveis.
Sua missão é transformar isso em um plano de investigação acionável e aplicar os 5 Porquês.

Considere como fontes de dados as abas do Proman: Localização, Cadastro, Características, Peças, Plano Preventivo, Histórico, OS, Serviços Executados.
Se algum dado faltar, registre em "avisos".

Responda SEMPRE em JSON válido, conciso e acionável, em PT-BR:

{
  "plano_investigacao": [
    {
      "causa_id": "C1",
      "tarefas": [
        {
          "descricao": "verbo no infinitivo, muito objetiva",
          "tipo": "inspecao|medicao|entrevista|documento",
          "responsavel_sugestao": "cargo/função",
          "prazo_dias": 3,
          "criterio_sucesso": "o que confirma/nega",
          "fonte_proman": ["aba utilizada como referência"]
        }
      ]
    }
  ],
  "cinco_porques": [
    {
      "causa_id": "C1",
      "porques": ["1: ...","2: ...","3: ...","4: ...","5: ..."],
      "causa_raiz_hipotese": "1 frase objetiva"
    }
  ],
  "priorizacao": {
    "criterio": "risco x impacto x facilidade",
    "impacto_economico": {
      "duracao_min": 0,
      "reducao_percent": 0,
      "custo_estimado": 0,
      "faturamento_hora": 0,
      "custo_parada_estimado": "se possível calcule"
    }
  },
  "avisos": ["dados faltantes, necessidade de parada programada, etc."]
}

Diretrizes:
- Priorize causas com prioridade A e B; para C gere no máx. 1 tarefa.
- 1–3 tarefas por causa, bem curtas.
- Se faltarem dados, sinalize em "avisos" ou em "criterio_sucesso".
Não escreva nada fora do JSON.`
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
      if (data.a1 && data.a2 && data.a3) {
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
