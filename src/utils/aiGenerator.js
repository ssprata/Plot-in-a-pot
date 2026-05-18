// src/utils/aiGenerator.js

// 1. O PROMPT DO SISTEMA (A "Ditadura" de Formatação)
// Este texto é injetado antes da história do utilizador.
// Serve para forçar a IA a cuspir APENAS código Twee, sem introduções simpáticas.
const SYSTEM_PROMPT = `És um conversor estrito de texto para código Twee 3 (SugarCube). A tua única função é devolver código. Não podes falar, não podes explicar, e não podes usar blocos de código markdown (como \`\`\`twee).

REGRAS OBRIGATÓRIAS:
1. O ficheiro arranca obrigatoriamente com os nós :: StoryTitle e :: StoryData [secreto].
2. O cabeçalho de CADA nova cena tem de começar com ":: " seguido do nome. Nunca uses parênteses retos para cabeçalhos.
3. Para criar opções no final das cenas, usa estritamente o formato [[Texto|Nome da Cena]].

EXEMPLO DE ENTRADA DE TEXTO:
Acordas num quarto. Podes explorar a sala ou voltar a dormir. Se explorares a sala, encontras uma espada. Se dormires, o jogo acaba.

EXEMPLO DA SAÍDA ESPERADA:
:: StoryTitle
História Gerada

:: StoryData [secreto]
{
  "ifid": "12345",
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

// 2. FUNÇÃO DE CHAMADA AO GEMINI
// Algoritmo que constrói o pedido REST para a API oficial da Google.
export async function generateFromGemini(storyText, apiKey) {
    if (!apiKey) throw new Error("API Key do Gemini em falta.");

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const fullPrompt = SYSTEM_PROMPT + storyText;

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

        if (!response.ok) {
            throw new Error(`Erro na API Gemini: ${response.status}`);
        }

        const data = await response.json();
        // Navegamos pelo objeto de resposta da Google para extrair apenas o texto gerado
        const generatedText = data.candidates[0].content.parts[0].text;

        // Limpeza de segurança caso a IA decida usar formatação markdown ignorando as ordens
        return generatedText.replace(/```twee\n?/gi, '').replace(/```\n?/g, '').trim();

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
    const fullPrompt = SYSTEM_PROMPT + storyText;

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
            throw new Error(`Erro no Ollama: ${response.status}. Verifica se o servidor local está a correr.`);
        }

        const data = await response.json();

        // O Ollama devolve a string completa na propriedade 'response'
        return data.response.replace(/```twee\n?/gi, '').replace(/```\n?/g, '').trim();

    } catch (error) {
        console.error("Falha ao comunicar com Ollama:", error);
        throw error;
    }
}