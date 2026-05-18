import React, { useState, useEffect } from 'react';
import { generateFromGemini, generateFromOllama } from '../utils/aiGenerator';
import { useInfoPopout } from '../contexts/InfoPopoutContext';

export default function AiImportModal({ isOpen, onClose, onImportSuccess }) {
  // Contexto para a janela de ajuda
  const { showInfoPopout } = useInfoPopout();

  const openHelp = (title, subtitle, content) => {
    showInfoPopout({ title, subtitle, content });
  };

  const helpButtonClass = "w-6 h-6 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:shadow-none cursor-pointer text-xs";

  // 1. ESTADOS DA INTERFACE
  const [storyText, setStoryText] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  
  // 2. ESTADOS DE SISTEMA
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 3. PERSISTÊNCIA DA CHAVE API
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });

  useEffect(() => {
    localStorage.setItem('gemini-api-key', apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  // 4. FUNÇÃO PRINCIPAL DE GERAÇÃO
  const handleGenerate = async () => {
    if (!storyText.trim()) {
      setError("Por favor, escreve alguma história primeiro.");
      return;
    }
    if (provider === 'gemini' && !apiKey.trim()) {
      setError("A chave da API do Gemini é obrigatória.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      let generatedTwee = '';

      if (provider === 'gemini') {
        generatedTwee = await generateFromGemini(storyText, apiKey);
      } else {
        generatedTwee = await generateFromOllama(storyText, ollamaModel);
      }

      onImportSuccess(generatedTwee);
      
      setStoryText('');
      onClose();

    } catch (err) {
      setError(err.message || "Ocorreu um erro ao gerar a história.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[600px] max-w-[90vw] bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] flex flex-col p-6">
        
        <h2 className="text-2xl font-black uppercase tracking-widest mb-6 border-b-2 border-gray-900 dark:border-gray-200 pb-2">
          IA: Texto para Grafo
        </h2>

        {/* ÁREA DE SELEÇÃO DO FORNECEDOR */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 font-bold cursor-pointer">
            <input 
              type="radio" 
              name="provider" 
              value="gemini" 
              checked={provider === 'gemini'} 
              onChange={() => setProvider('gemini')}
              className="accent-purple-600 w-4 h-4"
            />
            Google Gemini
          </label>
        </div>

        {/* ÁREA DE CONFIGURAÇÕES ESPECÍFICAS */}
        {provider === 'gemini' ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-xs font-black uppercase tracking-wider">API Key do Gemini</label>
              <button
                type="button"
                onClick={() => openHelp(
                  'API Key do Gemini',
                  'Chave de Autenticação da Google',
                  <div className="space-y-2">
                    <p>Para usares o modelo Gemini, precisas de uma chave de API gratuita fornecida pela Google.</p>
                    <p>Podes criar a tua chave acedendo ao <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-bold">Google AI Studio</a>.</p>
                    <p className="text-xs text-gray-500 mt-2">Nota: A tua chave fica guardada apenas localmente no teu navegador. Não é enviada para os nossos servidores.</p>
                  </div>
                )}
                className={helpButtonClass}
              >
                ?
              </button>
            </div>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-2 border-2 border-gray-900 dark:border-gray-200 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-xs font-black uppercase tracking-wider mb-1">Modelo Ollama</label>
            <input 
              type="text" 
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="ex: llama3, mistral"
              className="w-full p-2 border-2 border-gray-900 dark:border-gray-200 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        )}

        {/* ÁREA DE TEXTO DA HISTÓRIA */}
        <div className="flex-1 flex flex-col min-h-[200px] mb-4">
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-xs font-black uppercase tracking-wider">História em Texto Livre</label>
            <button
              type="button"
              onClick={() => openHelp(
                'Instruções para a IA',
                'Como escrever para obter os melhores resultados',
                <div className="space-y-2">
                  <p>Escreve a tua narrativa de forma corrida, mas certifica-te de que as ramificações são óbvias.</p>
                  <p><strong>Exemplo:</strong></p>
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-mono italic">
                    "Acordas numa cela. Podes tentar arrombar a porta ou gritar por um guarda. Se arrombares a porta, encontras um corredor. Se gritares, o guarda prende-te com correntes."
                  </div>
                  <p>A IA encarregar-se-á de converter a tua lógica descritiva num grafo de nós perfeitamente estruturado.</p>
                </div>
              )}
              className={helpButtonClass}
            >
              ?
            </button>
          </div>
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            placeholder="Era uma vez um aventureiro que chegou a uma bifurcação. Se fores pela esquerda..."
            className="flex-1 resize-none p-3 border-2 border-gray-900 dark:border-gray-200 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-purple-500 leading-relaxed"
          />
        </div>

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-600 text-red-900 font-bold text-sm shadow-[2px_2px_0px_#dc2626]">
            {error}
          </div>
        )}

        {/* ÁREA DE BOTÕES DE AÇÃO */}
        <div className="flex justify-end gap-3 mt-auto border-t-2 border-gray-900 dark:border-gray-200 pt-4">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-6 py-2 border-2 border-gray-900 dark:border-gray-200 bg-purple-500 hover:bg-purple-400 text-white font-black uppercase tracking-widest transition-transform active:translate-y-1 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] active:shadow-none disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                A Processar...
              </>
            ) : (
              "Gerar Grafo"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}