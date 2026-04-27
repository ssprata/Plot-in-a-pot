import React from 'react';

export default function SettingsModal({ isOpen, onClose, settings, toggleSetting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white border-4 border-gray-900 p-6 w-80 shadow-[8px_8px_0px_#000]">
        <div className="flex justify-between items-center border-b-2 border-gray-900 pb-2 mb-4">
          <h2 className="font-black uppercase tracking-widest text-lg">Definições</h2>
          <button onClick={onClose} className="font-bold hover:text-red-600 transition-colors">X</button>
        </div>

        <div className="space-y-4">
          
          {/* Opção: Lista de Adjacência */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm uppercase">Lista de Adjacência</span>
            <button 
              onClick={() => toggleSetting('showAdjacency')}
              className={`w-12 h-6 border-2 border-gray-900 transition-colors relative ${settings.showAdjacency ? 'bg-green-400' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 bg-white transition-all ${settings.showAdjacency ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Opção: Nós Secretos */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm uppercase">Nós Secretos</span>
            <button 
              onClick={() => toggleSetting('showSecrets')}
              className={`w-12 h-6 border-2 border-gray-900 transition-colors relative ${settings.showSecrets ? 'bg-green-400' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 bg-white transition-all ${settings.showSecrets ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Opção: Alertas de Fluxo */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm uppercase">Alertas de Fluxo</span>
            <button 
              onClick={() => toggleSetting('showFlowErrors')}
              className={`w-12 h-6 border-2 border-gray-900 transition-colors relative ${settings.showFlowErrors ? 'bg-green-400' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 border-2 border-gray-900 bg-white transition-all ${settings.showFlowErrors ? 'left-6' : 'left-0.5'}`} />
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