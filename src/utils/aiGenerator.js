// src/utils/aiGenerator.js

// 1. O PROMPT DO SISTEMA (A "Ditadura" de Formatação)
// Este texto é injetado antes da história do utilizador.
// Serve para forçar a IA a cuspir APENAS código Twee, sem introduções simpáticas.
const SYSTEM_PROMPT = `
És um compilador estrito de formato Twee 3 para SugarCube.
A tua tarefa é ler a história fornecida e convertê-la num grafo narrativo válido.
Regras absolutas:
1. Começa sempre com os nós obrigatórios: :: StoryTitle e :: StoryData [secreto]
2. O StoryData tem de ser um JSON válido com "format": "SugarCube" e "start": "NomeDoPrimeiroNo".
3. Identifica as opções na história e cria ligações usando o formato [[Texto da Escolha|Nome do Nó Alvo]].
4. Não adiciones blocos de código markdown (\`\`\`twee). Retorna apenas o texto puro.
5. Não digas "Aqui está a história" nem faças comentários fora do formato Twee.
6. Se detetares necessidade de inventário, usa <<set $variavel = valor>> no texto e <<if>> nas escolhas.
7. Se o destino de uma escolha for uma variável (ex: $proximoNo) ou contiver expressões matemáticas, ignora essa escolha no grafo visual e não a adiciones.
8. O nó inicial do jogo deve ser identificado claramente no StoryData e deve ser o primeiro nó listado.
9. Se a história contiver macros do SugarCube (ex: <<link>>, <<goto>>, <<set>>), processa-as corretamente para extrair as escolhas e destinos.
10. Não adiciones texto explicativo, apenas o código Twee formatado corretamente.
11. Se a história tiver formatação inválida ou faltar informações essenciais, tenta corrigir o melhor que puderes, mas mantém o formato Twee estrito.
12. O output deve ser um grafo narrativo completo e funcional, pronto para ser importado para um motor de jogos baseado em SugarCube.
13. Variáveis devem ser definidas usando <<set>> e não podem ser usadas como destinos de escolhas visuais. Se uma escolha depender de uma variável, ela deve ser ignorada no grafo visual.

História para converter:
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