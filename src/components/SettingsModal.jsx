import React from 'react';

export default function SettingsModal({ isOpen, onClose, settings, toggleSetting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-200 p-6 w-80 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
        <div className="flex justify-between items-center border-b-2 border-gray-900 dark:border-gray-200 pb-2 mb-4">
          <h2 className="font-black uppercase tracking-widest text-lg text-gray-900 dark:text-gray-100">Definições</h2>
          <button onClick={onClose} className="font-bold hover:text-red-600 dark:hover:text-red-400 transition-colors text-gray-900 dark:text-gray-100">X</button>
        </div>

        <div className="space-y-4">

          {/* Divisor: Visualização */}
          <div className="border-t-2 border-gray-900 dark:border-gray-200 my-2 pt-2">
            <span className="font-black uppercase tracking-widest text-xs text-gray-500 dark:text-gray-400">Visualização</span>
          </div>

          {/* Opção: Nós Secretos */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Nós Secretos</span>
            <button 
              onClick={() => toggleSetting('showSecrets')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.showSecrets ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.showSecrets ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Opção: Alertas de Fluxo */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Alertas de Fluxo</span>
            <button 
              onClick={() => toggleSetting('showFlowErrors')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.showFlowErrors ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.showFlowErrors ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Divisor: Dev */}
          <div className="border-t-2 border-gray-900 dark:border-gray-200 my-2 pt-2">
            <span className="font-black uppercase tracking-widest text-xs text-gray-500 dark:text-gray-400">Dev</span>
          </div>

          {/* Opção: Lista de Adjacência */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Lista de Adjacência</span>
            <button 
              onClick={() => toggleSetting('showAdjacency')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.showAdjacency ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.showAdjacency ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Opção: Simulação Legada */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm uppercase text-gray-900 dark:text-gray-100">Simulação Legacy</span>
            <button
              onClick={() => toggleSetting('showSimulationLegacy')}
              className={`w-12 h-6 border-2 border-gray-900 dark:border-gray-200 transition-colors relative ${settings.showSimulationLegacy ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-100 transition-all ${settings.showSimulationLegacy ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
          
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 p-2 border-2 border-gray-900 bg-gray-900 text-white font-bold uppercase text-xs hover:bg-gray-700 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}