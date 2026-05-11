// src/components/AiImportModal.jsx
import React, { useState, useEffect } from 'react';
import { generateFromGemini, generateFromOllama } from '../utils/aiGenerator';

export default function AiImportModal({ isOpen, onClose, onImportSuccess }) {
  // 1. ESTADOS DA INTERFACE
  // Controlam o que o utilizador escreveu e as definições que selecionou
  const [storyText, setStoryText] = useState('');
  const [provider, setProvider] = useState('gemini'); // Por defeito usa o Gemini
  const [ollamaModel, setOllamaModel] = useState('llama3');
  
  // 2. ESTADOS DE SISTEMA
  // Controlam o feedback visual (erros e estado de carregamento)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 3. PERSISTÊNCIA DA CHAVE API
  // Tenta carregar a chave da cache assim que o modal abre
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });

  // Sempre que o utilizador altera a chave, guardamos automaticamente na cache
  useEffect(() => {
    localStorage.setItem('gemini-api-key', apiKey);
  }, [apiKey]);

  // Se o modal estiver fechado, não desenha nada no ecrã
  if (!isOpen) return null;

  // 4. FUNÇÃO PRINCIPAL DE GERAÇÃO
  // É chamada quando o utilizador clica em "Gerar Grafo"
  const handleGenerate = async () => {
    // Validações básicas antes de gastar recursos
    if (!storyText.trim()) {
      setError("Por favor, escreve alguma história primeiro.");
      return;
    }
    if (provider === 'gemini' && !apiKey.trim()) {
      setError("A chave da API do Gemini é obrigatória.");
      return;
    }

    // Limpa erros anteriores e mostra o indicador de carregamento
    setError(null);
    setIsLoading(true);

    try {
      let generatedTwee = '';

      // Delega a tarefa para a função correta consoante o fornecedor escolhido
      if (provider === 'gemini') {
        generatedTwee = await generateFromGemini(storyText, apiKey);
      } else {
        generatedTwee = await generateFromOllama(storyText, ollamaModel);
      }

      // Se a IA respondeu com sucesso, envia o texto Twee de volta para o App.jsx
      // para ser importado e desenhado no ecrã.
      onImportSuccess(generatedTwee);
      
      // Limpa a caixa de texto e fecha o modal
      setStoryText('');
      onClose();

    } catch (err) {
      // Se algo falhar (ex: sem internet, chave inválida, servidor Ollama desligado)
      setError(err.message || "Ocorreu um erro ao gerar a história.");
    } finally {
      // Independentemente de sucesso ou falha, desliga o indicador de carregamento
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
          <label className="flex items-center gap-2 font-bold cursor-pointer">
            <input 
              type="radio" 
              name="provider" 
              value="ollama" 
              checked={provider === 'ollama'} 
              onChange={() => setProvider('ollama')}
              className="accent-purple-600 w-4 h-4"
            />
            Ollama (Local)
          </label>
        </div>

        {/* ÁREA DE CONFIGURAÇÕES ESPECÍFICAS */}
        {provider === 'gemini' ? (
          <div className="mb-4">
            <label className="block text-xs font-black uppercase tracking-wider mb-1">API Key do Gemini</label>
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
          <label className="block text-xs font-black uppercase tracking-wider mb-1">História em Texto Livre</label>
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            placeholder="Era uma vez um aventureiro que chegou a uma bifurcação. Se fores pela esquerda..."
            className="flex-1 resize-none p-3 border-2 border-gray-900 dark:border-gray-200 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-purple-500 leading-relaxed"
          />
        </div>

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-600 text-red-900 font-bold text-sm">
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