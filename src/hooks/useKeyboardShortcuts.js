// src/hooks/useKeyboardShortcuts.js
// Pure-effect hook that registers global keyboard shortcuts.
// No return value — attaches/detaches a 'keydown' listener on window.
import { useEffect } from 'react';

/**
 * @param {Object} deps
 * @param {string|null} deps.selectedEdgeId
 * @param {string|null} deps.selectedNodeId
 * @param {Function} deps.setEdges
 * @param {Function} deps.deleteNode
 * @param {Function} deps.undo
 * @param {Function} deps.redo
 * @param {Function} deps.takeSnapshot
 * @param {Function} deps.addNode
 * @param {Function} deps.closeInfoPopout
 * @param {Function} deps.handleOpenPlayMode
 * @param {Function} deps.runValidation
 * @param {Object|null} deps.activeTutorial
 * @param {Object|null} deps.activeStep
 * @param {Function} deps.setIsPlayModeOpen
 * @param {Function} deps.setIsAiModalOpen
 * @param {Function} deps.setIsSettingsOpen
 * @param {Function} deps.setSelectedEdgeId
 */
export default function useKeyboardShortcuts({
  selectedEdgeId,
  selectedNodeId,
  setEdges,
  deleteNode,
  undo,
  redo,
  takeSnapshot,
  addNode,
  closeInfoPopout,
  handleOpenPlayMode,
  runValidation,
  activeTutorial,
  activeStep,
  setIsPlayModeOpen,
  setIsAiModalOpen,
  setIsSettingsOpen,
  setSelectedEdgeId,
}) {
  // --- Atalhos Globais de Teclado (fusão dos dois useEffect anteriores) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement.tagName;
      const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      if (activeTutorial) {
        if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
          e.preventDefault();
          return;
        }
        if (e.ctrlKey) {
          const key = e.key.toLowerCase();
          if (isTyping) return;
          if (key === 'p' && activeStep?.allowPlay) {
            e.preventDefault();
            handleOpenPlayMode();
          } else if (key === 'x' && activeStep?.allowAddNode === 'choice') {
            e.preventDefault();
            addNode('choice');
          } else if (key === 'v' && activeStep?.allowValidation) {
            e.preventDefault();
            runValidation();
          } else {
            e.preventDefault();
          }
          return;
        }
        if (e.key === 'Escape') {
          setIsPlayModeOpen(false);
          setIsAiModalOpen(false);
          setIsSettingsOpen(false);
          closeInfoPopout();
        }
        return;
      }

      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const key = e.key.toLowerCase();

        // Atalhos que funcionam mesmo a escrever (nenhum actualmente — placeholder para consistência)
        if (key === 'z' && !isTyping) { e.preventDefault(); undo(); return; }
        if (key === 'y' && !isTyping) { e.preventDefault(); redo(); return; }

        if (isTyping) return;

        if (key === 'p') { e.preventDefault(); handleOpenPlayMode(); return; }
        if (key === 'i') { e.preventDefault(); setIsAiModalOpen(prev => !prev); return; }
        if (key === 'x') { e.preventDefault(); addNode('choice'); return; }
        if (key === ',') { e.preventDefault(); setIsSettingsOpen(prev => !prev); return; }
        if (key === 's') { e.preventDefault(); addNode('javascript'); return; }
        if (key === 'e') { e.preventDefault(); addNode('css'); return; }
        if (key === 'v') { e.preventDefault(); runValidation(); return; }
        if (key === 'm') { e.preventDefault(); window.dispatchEvent(new Event('triggerThemeToggle')); return; }
      }

      if (e.ctrlKey && !e.shiftKey && e.altKey && !isTyping) {
        const key = e.key.toLowerCase();
        if (key === 'z') { e.preventDefault(); addNode('zone'); return; }
        if (key === 'd') { e.preventDefault(); addNode('choice', 'StoryData', 'secreto'); return; }
        if (key === 't') { e.preventDefault(); addNode('choice', 'StoryTitle', 'secreto'); return; }
        if (key === 'i') { e.preventDefault(); addNode('choice', 'StoryInit', 'secreto'); return; }
        if (key === 'c') { e.preventDefault(); addNode('choice', 'StoryCaption', 'secreto'); return; }
      }

      if (!isTyping) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedEdgeId) {
            takeSnapshot();
            setEdges(eds => eds.filter(ed => ed.id !== selectedEdgeId));
            setSelectedEdgeId(null);
          } else if (selectedNodeId) {
            deleteNode(selectedNodeId);
          }
          return;
        }
        if (e.key === 'Escape') {
          setIsPlayModeOpen(false);
          setIsAiModalOpen(false);
          setIsSettingsOpen(false);
          closeInfoPopout();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, selectedNodeId, setEdges, deleteNode, undo, redo, takeSnapshot, addNode, closeInfoPopout, handleOpenPlayMode, runValidation, activeTutorial, activeStep]);
}
