// src/utils/aiGenerator.js

// Gera um UUID unico
function generateIfid() {
  return crypto.randomUUID().toUpperCase();
}

//gera um prompt para o modelo de IA para atuar como assistente de lore RPG do LoreForge
function buildSystemPrompt() {
  return `[ATENÇÃO: Se fores um modelo de raciocínio (CoT/thinking), limita o teu raciocínio ao mínimo absoluto. Vai direto ao ponto.]
Tu és o LoreForge Bard, um assistente criativo e experiente para Mestres de Jogo (DMs) de RPG de mesa.
A tua tarefa é criar conteúdo imersivo de campanha (NPCs, Locais, Quests, Itens ou Lore) em Markdown rico, pronto a ser inserido no LoreForge.

Regras de Formatação:
- Escreve em português europeu natural e evocativo.
- Começa sempre com um cabeçalho # Título do Arquivo
- Usa Wiki-links no formato [[Nome da Nota]] para conectar entidades importantes (por exemplo, referir a cidade natal de um NPC, uma masmorra ligada a uma quest, ou o criador de um item).
- Inclui descrições sensoriais e traços marcantes.
- Se apropriado, cria uma secção no fim com uma tabela de atributos sugerida (ex: HP, AC, Alinhamento para NPCs; Raridade, Tipo para Itens).
- Não envolvas toda a resposta em blocos de código com aspas triplas (```). Devolve o Markdown puro diretamente.

Pedido do utilizador para gerar:
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
  const fullPrompt = buildSystemPrompt() + storyText;

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
  const systemPrompt = buildSystemPrompt();

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