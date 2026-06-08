// src/utils/aiGenerator.js

// FIX #5: Gerar um IFID válido (UUID v4 em maiúsculas) para injetar no prompt dinamicamente,
// em vez de usar o placeholder fixo "12345".
function generateIfid() {
  return crypto.randomUUID().toUpperCase();
}

// 1. O PROMPT DO SISTEMA (A "Ditadura" de Formatação)
// Este texto é injetado antes da história do utilizador.
// Serve para forçar a IA a cuspir APENAS código Twee, sem introduções simpáticas.
// FIX #4: Tag do StoryData corrigida — removido [secreto] (placeholder de desenvolvimento).
// O IFID é gerado dinamicamente por generateIfid() antes de cada chamada.
function buildSystemPrompt(ifid) {
  return `És um conversor estrito de texto para código Twee 3 (SugarCube). A tua única função é devolver código. Não podes falar, não podes explicar, e não podes usar blocos de código markdown (como \`\`\`twee).

REGRAS OBRIGATÓRIAS:
1. O ficheiro arranca obrigatoriamente com os nós :: StoryTitle e :: StoryData.
2. O cabeçalho de CADA nova cena tem de começar com ":: " seguido do nome. Nunca uses parênteses retos para cabeçalhos.
3. Para criar opções no final das cenas, usa estritamente o formato [[Texto|Nome da Cena]].

EXEMPLO DE ENTRADA DE TEXTO:
Acordas num quarto. Podes explorar a sala ou voltar a dormir. Se explorares a sala, encontras uma espada. Se dormires, o jogo acaba.

EXEMPLO DA SAÍDA ESPERADA:
:: StoryTitle
História Gerada

:: StoryData
{
  "ifid": "${ifid}",
  "format": "SugarCube",
  "format-version": "2.36.0",
  "start": "Inicio",
  "zoom": 1
}

:: Inicio
Acordas num quarto.
[[Explorar a sala|Sala]]
[[Voltar a dormir|Fim]]

:: Sala
Encontras uma espada.

:: Fim
O jogo acaba.

AGORA CONVERTE ESTA HISTÓRIA EXATAMENTE COM O MESMO PADRÃO:
`;
}

// FIX #7: Limpeza de markdown mais robusta.
// Remove blocos de código com qualquer capitalização e corta tudo o que
// apareça antes do primeiro "::" (texto introdutório da IA).
function cleanGeneratedText(text) {
  let cleaned = text
    .replace(/```twee\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  const firstPassage = cleaned.indexOf('::');
  if (firstPassage > 0) {
    cleaned = cleaned.slice(firstPassage);
  }

  return cleaned.trim();
}

// 2. FUNÇÃO DE CHAMADA AO GEMINI
// Algoritmo que constrói o pedido REST para a API oficial da Google.
export async function generateFromGemini(storyText, apiKey) {
  if (!apiKey) throw new Error("API Key do Gemini em falta.");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const fullPrompt = buildSystemPrompt(generateIfid()) + storyText;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        // Forçamos o modelo a ter uma temperatura baixa (0.2) para ser menos criativo e mais matemático/lógico na formatação.
        generationConfig: {
          temperature: 0.2,
        }
      })
    });

    // FIX #1: Ler o corpo do erro da API para uma mensagem útil ao utilizador.
    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errorDetail = errData?.error?.message || errorDetail;
      } catch (_) { /* ignora falha ao ler o corpo do erro */ }
      throw new Error(`Erro na API Gemini: ${errorDetail}`);
    }

    const data = await response.json();

    // FIX #2: Verificar se candidates existe e não está vazio antes de aceder.
    // A API pode devolver candidates vazio por filtros de segurança ou quota excedida.
    if (!data.candidates || data.candidates.length === 0) {
      const reason = data.promptFeedback?.blockReason || 'resposta vazia ou bloqueada pelos filtros de segurança';
      throw new Error(`O Gemini não devolveu conteúdo: ${reason}`);
    }

    const candidate = data.candidates[0];
    if (!candidate.content?.parts?.[0]?.text) {
      const reason = candidate.finishReason || 'conteúdo em falta na resposta';
      throw new Error(`O Gemini terminou sem gerar texto: ${reason}`);
    }

    return cleanGeneratedText(candidate.content.parts[0].text);

  } catch (error) {
    console.error("Falha ao comunicar com Gemini:", error);
    throw error;
  }
}

// 3. FUNÇÃO DE CHAMADA AO OLLAMA (Local)
// Algoritmo que comunica com o servidor Ollama a correr na máquina do próprio utilizador.
export async function generateFromOllama(storyText, modelName = 'llama3') {
  // O endpoint padrão onde o Ollama escuta pedidos locais
  const endpoint = 'http://localhost:11434/api/generate';
  const fullPrompt = buildSystemPrompt(generateIfid()) + storyText;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: fullPrompt,
        stream: false, // Pedimos a resposta toda de uma vez em vez de aos bochechos
        options: {
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      // FIX #1 (Ollama): Tentar extrair mensagem de erro do corpo da resposta.
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errorDetail = errData?.error || errorDetail;
      } catch (_) { /* ignora falha ao ler o corpo do erro */ }
      throw new Error(`Erro no Ollama: ${errorDetail}`);
    }

    const data = await response.json();

    // O Ollama devolve a string completa na propriedade 'response'
    return cleanGeneratedText(data.response);

  } catch (error) {
    // FIX #3: Distinguir erro de rede (Ollama não está a correr) de erro do servidor.
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Não foi possível ligar ao Ollama. Verifica se o servidor está a correr em localhost:11434.");
    }
    console.error("Falha ao comunicar com Ollama:", error);
    throw error;
  }
}