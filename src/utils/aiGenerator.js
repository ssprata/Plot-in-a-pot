// src/utils/aiGenerator.js

// Gera um UUID unico
function generateIfid() {
  return crypto.randomUUID().toUpperCase();
}

//gera um prompt para o modelo de IA, com instruções detalhadas sobre como formatar a saída em Twee 3 (SugarCube)
function buildSystemPrompt(ifid) {
  return `[ATENÇÃO: Se fores um modelo de raciocínio (CoT/thinking), limita o teu raciocínio ao mínimo absoluto. Vai direto ao ponto.]
Converte a história fornecida em código fonte no formato Twee 3 com macros SugarCube.

Estrutura obrigatória do ficheiro:
:: StoryTitle
Fuga da Prisao

:: StoryData
{
  "ifid": "${ifid}",
  "format": "SugarCube",
  "format-version": "2.36.0",
  "start": "Inicio",
  "zoom": 1
}

:: StoryInit
<<set $moedas to 0>>

:: Inicio
[Texto da cena inicial com links no formato [[Texto|Identificador]]]

Regras de Formatação:
- Inicializa as variáveis na secção ":: StoryInit" usando a macro <<set $variavel to valor>>.
- Cada nó começa com "::" seguido de um identificador alfanumérico simples sem espaços ou acentos (ex: :: CenaCorredor).
- Usa o formato de links nativos: [[Texto de Exibição|Identificador]].
- Não incluas blocos de código Markdown (sem aspas triplas \`\`\`), notas introdutórias ou conversação. Devolve apenas o código Twee 3 bruto.

História para converter:
`;
}


// Limpa o texto gerado pelo modelo de IA, removendo blocos de código e espaços em excesso
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


// função para chamar o gemini (verificado a dia 9 de julho)
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
        generationConfig: {
          "temperature": 0.2,
          "num_predict": -1,
          "num_ctx": 8192
        }
      })
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errorDetail = errData?.error?.message || errorDetail;
      } catch (_) { /* ignora falha ao ler o corpo do erro */ }
      throw new Error(`Erro na API Gemini: ${errorDetail}`);
    }

    const data = await response.json();

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

// chamada para o Ollama
export async function generateFromOllama(storyText, modelName = 'llama3') {
  // O endpoint padrão onde o Ollama escuta pedidos locais
  const endpoint = 'http://localhost:11434/api/generate';
  const systemPrompt = buildSystemPrompt(generateIfid());

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        system: systemPrompt,
        prompt: storyText,
        stream: false,
        options: {
          temperature: 0.7,
          repeat_penalty: 1.2,
          num_predict: 8192,
          num_ctx: 16384
        }
      })
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errorDetail = errData?.error || errorDetail;
      } catch (_) { /* ignora falha ao ler o corpo do erro */ }
      throw new Error(`Erro no Ollama: ${errorDetail}`);
    }

    const data = await response.json();

    return cleanGeneratedText(data.response);

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Não foi possível ligar ao Ollama. Verifica se o servidor está a correr em localhost:11434.");
    }
    console.error("Falha ao comunicar com Ollama:", error);
    throw error;
  }
}