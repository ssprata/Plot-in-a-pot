import React, { useState, useEffect } from 'react';
import { generateFromGemini, generateFromOllama } from '../utils/aiGenerator';
import { useInfoPopout } from '../contexts/InfoPopoutContext';
// 1. Importação oficial para o motor de traduções
import { useTranslation } from 'react-i18next';

export default function AiImportModal({ isOpen, onClose, onImportSuccess }) {
  // Contexto para a janela de ajuda
  const { showInfoPopout } = useInfoPopout();
  
  // 2. Extração do motor oficial
  const { t } = useTranslation();

  // Função auxiliar para abrir o popout de ajuda
  const openHelp = (title, subtitle, content) => {
    showInfoPopout({ title, subtitle, content });
  };

  const helpButtonClass = "w-6 h-6 flex shrink-0 items-center justify-center border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black hover:bg-yellow-400 dark:hover:bg-yellow-400 hover:text-gray-950 dark:hover:text-gray-950 transition-all active:translate-y-0.5 shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff] active:shadow-none rounded-full cursor-pointer text-xs";

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

  // FIX 1: useEffect ANTES do return condicional (Rules of Hooks)
  useEffect(() => {
    localStorage.setItem('gemini-api-key', apiKey);
  }, [apiKey]);

  // FIX 2: Limpar erro ao fechar o modal (ao reabrir não fica o erro anterior)
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // FIX 3: Limpar erro ao mudar de fornecedor (erro de "chave em falta" não fica
  //         visível quando o utilizador muda para Ollama e vice-versa)
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setError(null);
  };

  if (!isOpen) return null;

  // 4. FUNÇÃO PRINCIPAL DE GERAÇÃO
  const handleGenerate = async () => {
    if (!storyText.trim()) {
      setError(t('aiImportModal.errors.noStory'));
      return;
    }
    
    if (provider === 'gemini' && !apiKey.trim()) {
      setError(t('aiImportModal.errors.noApiKey'));
      return;
    }

    if (provider === 'ollama' && !ollamaModel.trim()) {
      setError(t('aiImportModal.errors.noModel'));
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
      // FIX 4: Mensagem de fallback via t() em vez de string hardcoded em português
      setError(err.message || t('aiImportModal.errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[600px] max-w-[90vw] bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] flex flex-col p-6 transition-all">
        
        <h2 className="text-2xl font-black uppercase tracking-widest mb-6 border-b-2 border-gray-900 dark:border-gray-200 pb-2 text-gray-900 dark:text-gray-100">
          {t('aiImportModal.title')}
        </h2>

        {/* ÁREA DE SELEÇÃO DO FORNECEDOR */}
        <div className="flex gap-4 mb-4">
          <label className="flex-1 cursor-pointer">
            <input 
              type="radio" 
              name="provider" 
              value="gemini" 
              checked={provider === 'gemini'} 
              onChange={() => handleProviderChange('gemini')}
              className="sr-only"
            />
            <span className={`block w-full py-2 border-2 border-gray-900 dark:border-gray-200 font-black text-xs uppercase text-center transition-all cursor-pointer shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none ${
              provider === 'gemini'
                ? 'bg-purple-600 text-white dark:bg-purple-600 dark:text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}>
              {t('aiImportModal.gemini')}
            </span>
          </label>

          <label className="flex-1 cursor-pointer">
            <input 
              type="radio" 
              name="provider" 
              value="ollama" 
              checked={provider === 'ollama'} 
              onChange={() => handleProviderChange('ollama')}
              className="sr-only"
            />
            <span className={`block w-full py-2 border-2 border-gray-900 dark:border-gray-200 font-black text-xs uppercase text-center transition-all cursor-pointer shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none ${
              provider === 'ollama'
                ? 'bg-purple-600 text-white dark:bg-purple-600 dark:text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}>
              {t('aiImportModal.ollama')}
            </span>
          </label>
        </div>

        {/* CONFIGURAÇÕES DO MOTOR */}
        {provider === 'gemini' ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('aiImportModal.apiKey')}</label>
              <button
                type="button"
                onClick={() => openHelp(
                  t('aiImportModal.apiKey'),
                  'Chave de Autenticação da Google',
                  <div className="space-y-2">
                    <p>Para usares o modelo Gemini, precisas de uma chave de API gratuita fornecida pela Google.</p>
                    <p>Podes criar a tua chave acedendo ao <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-bold">Google AI Studio</a>.</p>
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
              className="w-full p-2 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-purple-500 font-mono shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] transition-all"
            />
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('aiImportModal.model')}</label>
              <button
                type="button"
                onClick={() => openHelp(
                  'Ollama (IA Local)',
                  'Processamento privado sem internet',
                  <div className="space-y-2">
                    <p>O Ollama permite-te correr modelos generativos diretamente na tua máquina utilizando a tua placa gráfica.</p>
                    <ol className="list-decimal pl-5 space-y-2 mt-2">
                      <li>Verifica se o <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-bold">Ollama</a> está instalado e a correr.</li>
                      <li>Certifica-te de que tens um modelo sacado. Exemplo: corre <code>ollama pull llama3</code>.</li>
                      <li>Escreve o nome do modelo descarregado na caixa abaixo.</li>
                    </ol>
                  </div>
                )}
                className={helpButtonClass}
              >
                ?
              </button>
            </div>
            
            <input 
              type="text" 
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="ex: llama3, mistral"
              className="w-full p-2 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-purple-500 font-mono shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] transition-all"
            />
          </div>
        )}

        {/* TEXTO DA HISTÓRIA */}
        <div className="flex-1 flex flex-col min-h-[200px] mb-4">
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('aiImportModal.storyText')}</label>
            <button
              type="button"
              onClick={() => openHelp(
                t('aiImportModal.helpTitle'),
                t('aiImportModal.helpSubtitle'),
                <div className="space-y-2">
                  <p>{t('aiImportModal.helpLine1')}</p>
                  <p><strong>{t('aiImportModal.helpExampleLabel')}</strong></p>
                  <p>{t('aiImportModal.helpExampleText')}</p>
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
            placeholder={t('aiImportModal.storyPlaceholder')}
            className="flex-1 resize-none p-3 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-purple-500 leading-relaxed shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] transition-all"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-950/70 border-2 border-red-600 dark:border-red-400 text-red-900 dark:text-red-200 font-bold text-sm shadow-[2px_2px_0px_#dc2626] dark:shadow-[2px_2px_0px_#ef4444]">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-auto border-t-2 border-gray-900 dark:border-gray-200 pt-4">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border-2 border-gray-900 dark:border-gray-200 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold uppercase tracking-wider shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          
          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-6 py-2 border-2 border-gray-900 dark:border-gray-200 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]"
          >
            {isLoading ? t('aiImportModal.processing') : t('aiImportModal.generateGraph')}
          </button>
        </div>
      </div>
    </div>
  );
}