import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// --- TUTORIAL TEMPLATES ---

const tutorialTemplates = {
  t1: {
    nodes: [
      {
        id: '1',
        type: 'choice',
        position: { x: 200, y: 150 },
        data: { label: 'Start', nodeType: 'choice', content: 'Escreve a tua história aqui...', choices: [], tags: 'start' }
      }
    ],
    edges: [],
    translations: {
      languages: ['pt', 'en'],
      keys: {}
    }
  },
  t2: {
    nodes: [
      {
        id: '1',
        type: 'choice',
        position: { x: 100, y: 150 },
        data: { label: 'Start', nodeType: 'choice', content: 'Estás no início da aventura.', choices: [], tags: 'start' }
      },
      {
        id: '2',
        type: 'choice',
        position: { x: 400, y: 150 },
        data: { label: 'Corredor', nodeType: 'choice', content: 'O corredor escuro leva à saída.', choices: [], tags: '' }
      }
    ],
    edges: [],
    translations: {
      languages: ['pt', 'en'],
      keys: {}
    }
  },
  t3: {
    nodes: [
      {
        id: '1',
        type: 'choice',
        position: { x: 100, y: 50 },
        data: { label: 'StoryTitle', nodeType: 'choice', content: 'Masmorra do Perigo', choices: [], tags: 'secreto' }
      },
      {
        id: '2',
        type: 'choice',
        position: { x: 300, y: 50 },
        data: { label: 'StoryInit', nodeType: 'choice', content: '', choices: [], tags: 'secreto' }
      },
      {
        id: '3',
        type: 'choice',
        position: { x: 500, y: 50 },
        data: { label: 'StoryData', nodeType: 'choice', content: '{\n  "ifid": "TUTORIAL-ID-123456",\n  "format": "SugarCube",\n  "format-version": "2.36.1",\n  "start": "Start"\n}', choices: [], tags: 'secreto' }
      },
      {
        id: '4',
        type: 'choice',
        position: { x: 300, y: 200 },
        data: { label: 'Start', nodeType: 'choice', content: 'Começas a aventura com $moedas moedas.', choices: [], tags: 'start' }
      }
    ],
    edges: [],
    translations: {
      languages: ['pt', 'en'],
      keys: {}
    }
  },
  t4: {
    nodes: [
      {
        id: '1',
        type: 'choice',
        position: { x: 100, y: 150 },
        data: { label: 'Start', nodeType: 'choice', content: 'Welcome to the language test!\n[[t("go_room")|Room]]', choices: [{ id: 'c-1-Room-0', text: 't("go_room")', target: '2' }], tags: 'start' }
      },
      {
        id: '2',
        type: 'choice',
        position: { x: 400, y: 150 },
        data: { label: 'Room', nodeType: 'choice', content: 'You entered the room.', choices: [], tags: '' }
      }
    ],
    edges: [
      { id: 'e-1-2-c-1-Room-0', source: '1', sourceHandle: 'c-1-Room-0', target: '2' }
    ],
    translations: {
      languages: ['en', 'pt'],
      keys: {
        'go_room': {
          en: 'Enter Room',
          pt: 'Entrar na Sala'
        }
      }
    }
  },
  t5: {
    nodes: [
      {
        id: '1',
        type: 'choice',
        position: { x: 200, y: 50 },
        data: { label: 'StoryInit', nodeType: 'choice', content: '<<set $temChave to false>>', choices: [], tags: 'secreto' }
      },
      {
        id: '2',
        type: 'choice',
        position: { x: 200, y: 200 },
        data: { label: 'Start', nodeType: 'choice', content: 'Encontras uma chave brilhante no chão da floresta.\n<<set $temChave to true>>\n[[Avançar para o Portão|Portão]]', choices: [{ id: 'c-2-Portão-0', text: 'Avançar para o Portão', target: '3' }], tags: 'start' }
      },
      {
        id: '3',
        type: 'choice',
        position: { x: 450, y: 200 },
        data: { label: 'Portão', nodeType: 'choice', content: 'O portão do castelo está à tua frente.', choices: [], tags: '' }
      },
      {
        id: '4',
        type: 'choice',
        position: { x: 700, y: 200 },
        data: { label: 'Sucesso', nodeType: 'choice', content: 'Conseguiste entrar no castelo! Parabéns!', choices: [], tags: '' }
      }
    ],
    edges: [
      { id: 'e-2-3-c-2-Portão-0', source: '2', sourceHandle: 'c-2-Portão-0', target: '3' }
    ],
    translations: {
      languages: ['pt', 'en'],
      keys: {}
    }
  },
  t6: {
    nodes: [
      {
        id: '1',
        type: 'choice',
        position: { x: 100, y: 50 },
        data: { label: 'StoryInit', nodeType: 'choice', content: '<<set $moedas to 50>>', choices: [], tags: 'secreto' }
      },
      {
        id: '2',
        type: 'choice',
        position: { x: 300, y: 50 },
        data: { label: 'Start', nodeType: 'choice', content: 'Tens $moedas moedas.', choices: [], tags: 'start' }
      },
      {
        id: '3',
        type: 'choice',
        position: { x: 150, y: 250 },
        data: { label: 'Loja', nodeType: 'choice', content: 'Bem-vindo à Loja! Podes comprar o item.', choices: [], tags: '' }
      },
      {
        id: '4',
        type: 'choice',
        position: { x: 450, y: 250 },
        data: { label: 'Rua', nodeType: 'choice', content: 'Não tens moedas suficientes para entrar na Loja. Ficas na rua.', choices: [], tags: '' }
      }
    ],
    edges: [],
    translations: {
      languages: ['pt', 'en'],
      keys: {}
    }
  },
  t7: {
    nodes: [
      {
        id: '1',
        type: 'choice',
        position: { x: 50, y: 50 },
        data: { label: 'StoryTitle', nodeType: 'choice', content: 'Masmorra do Código', choices: [], tags: 'secreto' }
      },
      {
        id: '2',
        type: 'choice',
        position: { x: 250, y: 50 },
        data: { label: 'StoryInit', nodeType: 'choice', content: '', choices: [], tags: 'secreto' }
      },
      {
        id: '3',
        type: 'choice',
        position: { x: 450, y: 50 },
        data: { label: 'StoryData', nodeType: 'choice', content: '{\n  "ifid": "CODE-TUTORIAL-999",\n  "format": "SugarCube",\n  "format-version": "2.36.1",\n  "start": "Start"\n}', choices: [], tags: 'secreto' }
      },
      {
        id: '4',
        type: 'choice',
        position: { x: 250, y: 200 },
        data: { label: 'Start', nodeType: 'choice', content: 'Início da aventura.', choices: [], tags: 'start' }
      },
      {
        id: '5',
        type: 'choice',
        position: { x: 250, y: 350 },
        data: { label: 'Quarto', nodeType: 'choice', content: 'O quarto escuro.', choices: [], tags: '' }
      },
      {
        id: '6',
        type: 'choice',
        position: { x: 100, y: 500 },
        data: { label: 'Cofre', nodeType: 'choice', content: 'Um cofre cheio de ouro!', choices: [], tags: '' }
      },
      {
        id: '7',
        type: 'choice',
        position: { x: 400, y: 500 },
        data: { label: 'Fim', nodeType: 'choice', content: 'O fim da aventura.', choices: [], tags: '' }
      }
    ],
    edges: [],
    translations: {
      languages: ['pt', 'en'],
      keys: {}
    }
  },
  t8: {
    nodes: [
      {
        id: 'zone-1',
        type: 'zone',
        position: { x: 100, y: 100 },
        style: { width: 350, height: 260, pointerEvents: 'none' },
        data: { label: 'Zona Tutorial', nodeType: 'zone', color: '#f59e0b', bgImage: '' }
      },
      {
        id: '1',
        type: 'choice',
        position: { x: 180, y: 160 },
        parentId: 'zone-1',
        data: { label: 'Start', nodeType: 'choice', content: 'Bem-vindo ao início da história!', choices: [], tags: 'start', bgImage: '' }
      }
    ],
    edges: [],
    translations: {
      languages: ['pt', 'en'],
      keys: {}
    }
  }
};

export default function PlaythroughTutorial({
  nodes,
  setNodes,
  edges,
  setEdges,
  translations,
  setTranslations,
  selectedNodeId,
  setSelectedNodeId,
  validationResult,
  runValidation,
  isPlayModeOpen,
  setIsPlayModeOpen,
  isTutorialPromptOpen,
  setIsTutorialPromptOpen,
  isTutorialMenuOpen,
  setIsTutorialMenuOpen,
  activeTutorial,
  setActiveTutorial,
  isVarModalOpen,
  playModeCurrentNodeId,
  playModeLanguage,
  onActiveStepChange
}) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const isMenuOpen = isTutorialMenuOpen;
  const setIsMenuOpen = setIsTutorialMenuOpen;
  const [stepCompleted, setStepCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'advanced'
  const [showCodeWarning, setShowCodeWarning] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);

  // --- TUTORIAL STEPS DEFINITION ---

  const tutorialSteps = React.useMemo(() => ({
    t1: [
      {
        titleKey: 'tutorial.t1Step1Title',
        descKey: 'tutorial.t1Step1Desc',
        check: (state) => state.selectedNodeId === '1',
        autoAdvance: true,
        targetNodeId: '1',
        highlightNodeId: '1'
      },
      {
        titleKey: 'tutorial.t1Step2Title',
        descKey: 'tutorial.t1Step2Desc',
        check: (state) => state.nodes.find(n => n.id === '1')?.data.label?.trim().toLowerCase() === 'entrada',
        autoAdvance: true,
        targetNodeId: '1',
        highlightNodeId: '1',
        allowEditLabel: true,
        highlightButton: 'editLabel'
      },
      {
        titleKey: 'tutorial.t1Step3Title',
        descKey: 'tutorial.t1Step3Desc',
        check: (state) => {
          const content = state.nodes.find(n => n.id === '1')?.data.content?.toLowerCase() || '';
          return content.includes('início') || content.includes('inicio');
        },
        autoAdvance: false,
        targetNodeId: '1',
        highlightNodeId: '1',
        allowEditContent: true,
        highlightButton: 'editContent',
        ghostText: 'Estás no início da aventura.'
      },
      {
        titleKey: 'tutorial.t1Step4Title',
        descKey: 'tutorial.t1Step4Desc',
        check: null,
        autoAdvance: false
      }
    ],
    t2: [
      {
        titleKey: 'tutorial.t2Step1Title',
        descKey: 'tutorial.t2Step1Desc',
        check: (state) => state.edges.some(e => e.source === '1' && e.target === '2'),
        autoAdvance: true,
        allowConnect: true,
        connectSource: '1',
        connectTarget: '2',
        highlightNodeId: '1',
        highlightHandle: 'bottom',
        highlightNodeId2: '2',
        highlightHandle2: 'top'
      },
      {
        titleKey: 'tutorial.t2Step2Title',
        descKey: 'tutorial.t2Step2Desc',
        check: (state) => state.nodes.length > 2,
        autoAdvance: true,
        allowAddNode: 'choice',
        highlightButton: 'addScene'
      },
      {
        titleKey: 'tutorial.t2Step3Title',
        descKey: 'tutorial.t2Step3Desc',
        check: (state) => state.edges.some(e => e.source === '2' && state.nodes.some(n => n.id === e.target && n.id !== '1' && n.id !== '2')),
        autoAdvance: true,
        allowConnect: true,
        connectSource: '2',
        connectTarget: '3',
        highlightNodeId: '2',
        highlightHandle: 'bottom',
        highlightNodeId2: '3',
        highlightHandle2: 'top'
      },
      {
        titleKey: 'tutorial.t2Step4Title',
        descKey: 'tutorial.t2Step4Desc',
        check: (state) => state.validationResult !== null,
        autoAdvance: true,
        allowValidation: true,
        highlightButton: 'validate'
      },
      {
        titleKey: 'tutorial.completeTitle',
        descKey: 'tutorial.completeText',
        check: null,
        autoAdvance: false
      }
    ],
    t3: [
      {
        titleKey: 'tutorial.t3Step1Title',
        descKey: 'tutorial.t3Step1Desc',
        check: (state) => state.selectedNodeId === '1',
        autoAdvance: true,
        targetNodeId: '1',
        highlightNodeId: '1'
      },
      {
        titleKey: 'tutorial.t3Step2Title',
        descKey: 'tutorial.t3Step2Desc',
        check: (state) => state.selectedNodeId === '3',
        autoAdvance: true,
        targetNodeId: '3',
        highlightNodeId: '3'
      },
      {
        titleKey: 'tutorial.t3Step3Title',
        descKey: 'tutorial.t3Step3Desc',
        check: (state) => state.selectedNodeId === '2',
        autoAdvance: true,
        targetNodeId: '2',
        highlightNodeId: '2'
      },
      {
        titleKey: 'tutorial.t3Step4Title',
        descKey: 'tutorial.t3Step4Desc',
        check: (state) => state.isVarModalOpen === true,
        autoAdvance: true,
        targetNodeId: '2',
        highlightNodeId: '2',
        allowVariables: true,
        highlightButton: 'createVar'
      },
      {
        titleKey: 'tutorial.t3Step5Title',
        descKey: 'tutorial.t3Step5Desc',
        check: (state) => {
          const initNode = state.nodes.find(n => n.id === '2');
          return initNode && initNode.data.content && initNode.data.content.toLowerCase().includes('$moedas');
        },
        autoAdvance: true,
        targetNodeId: '2',
        allowVariables: true,
        highlightButton: 'connectModalFields'
      },
      {
        titleKey: 'tutorial.t3Step6Title',
        descKey: 'tutorial.t3Step6Desc',
        check: null,
        autoAdvance: false,
        highlightButton: 'closeVarModal'
      }
    ],
    t4: [
      {
        titleKey: 'tutorial.t4Step1Title',
        descKey: 'tutorial.t4Step1Desc',
        check: (state) => state.isPlayModeOpen === true,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'play'
      },
      {
        titleKey: 'tutorial.t4Step2Title',
        descKey: 'tutorial.t4Step2Desc',
        check: (state) => state.playModeLanguage === 'pt',
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'languageSelect'
      },
      {
        titleKey: 'tutorial.t4Step3Title',
        descKey: 'tutorial.t4Step3Desc',
        check: (state) => state.playModeCurrentNodeId === '2',
        autoAdvance: true,
        allowPlay: true,
        choiceTarget: '2'
      },
      {
        titleKey: 'tutorial.t4Step4Title',
        descKey: 'tutorial.t4Step4Desc',
        check: (state) => state.isPlayModeOpen === false,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'endTest'
      },
      {
        titleKey: 'tutorial.completeTitle',
        descKey: 'tutorial.completeText',
        check: null,
        autoAdvance: false
      }
    ],
    t5: [
      {
        titleKey: 'tutorial.t5Step1Title',
        descKey: 'tutorial.t5Step1Desc',
        check: (state) => state.selectedNodeId === '3',
        autoAdvance: true,
        targetNodeId: '3',
        highlightNodeId: '3'
      },
      {
        titleKey: 'tutorial.t5Step2Title',
        descKey: 'tutorial.t5Step2Desc',
        check: (state) => {
          const portaoNode = state.nodes.find(n => n.id === '3');
          const content = portaoNode?.data.content || '';
          const lowerContent = content.toLowerCase();
          return (
            state.edges.some(e => e.source === '3' && e.target === '4') &&
            lowerContent.includes('$temchave') &&
            lowerContent.includes('is') &&
            lowerContent.includes('true') &&
            (lowerContent.includes('abrir portão') || lowerContent.includes('abrir portao'))
          );
        },
        autoAdvance: true,
        allowConnect: true,
        connectSource: '3',
        connectTarget: '4',
        highlightNodeId: '3',
        highlightHandle: 'bottom',
        highlightNodeId2: '4',
        highlightHandle2: 'top',
        highlightButton: 'connectModalFields'
      },
      {
        titleKey: 'tutorial.t5Step3Title',
        descKey: 'tutorial.t5Step3Desc',
        check: (state) => state.isPlayModeOpen === true,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'play'
      },
      {
        titleKey: 'tutorial.completeTitle',
        descKey: 'tutorial.completeText',
        check: null,
        autoAdvance: false
      }
    ],
    t6: [
      {
        titleKey: 'tutorial.t6Step1Title',
        descKey: 'tutorial.t6Step1Desc',
        check: (state) => state.selectedNodeId === '2',
        autoAdvance: true,
        targetNodeId: '2',
        highlightNodeId: '2'
      },
      {
        titleKey: 'tutorial.t6Step2Title',
        descKey: 'tutorial.t6Step2Desc',
        check: (state) => {
          const startNode = state.nodes.find(n => n.id === '2');
          const content = startNode?.data.content || '';
          const lowerContent = content.toLowerCase();
          return (
            lowerContent.includes('$moedas') &&
            (lowerContent.includes('gt') || lowerContent.includes('>')) &&
            lowerContent.includes('25') &&
            state.edges.some(e => e.source === '2' && e.target === '3') &&
            state.edges.some(e => e.source === '2' && e.target === '4')
          );
        },
        autoAdvance: true,
        allowConnect: true,
        connectSource: '2',
        connectTarget: '3',
        highlightNodeId: '2',
        highlightHandle: 'bottom',
        highlightNodeId2: '3',
        highlightHandle2: 'top',
        highlightButton: 'connectModalFields'
      },
      {
        titleKey: 'tutorial.t6Step3Title',
        descKey: 'tutorial.t6Step3Desc',
        check: (state) => state.isPlayModeOpen === true,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'play'
      },
      {
        titleKey: 'tutorial.t6Step4Title',
        descKey: 'tutorial.t6Step4Desc',
        check: (state) => state.playModeCurrentNodeId === '3',
        autoAdvance: true,
        allowPlay: true,
        choiceTarget: '3'
      },
      {
        titleKey: 'tutorial.t6Step5Title',
        descKey: 'tutorial.t6Step5Desc',
        check: (state) => state.isPlayModeOpen === false,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'endTest'
      },
      {
        titleKey: 'tutorial.t6Step6Title',
        descKey: 'tutorial.t6Step6Desc',
        check: (state) => state.selectedNodeId === '1',
        autoAdvance: true,
        targetNodeId: '1',
        highlightNodeId: '1'
      },
      {
        titleKey: 'tutorial.t6Step7Title',
        descKey: 'tutorial.t6Step7Desc',
        check: (state) => {
          const initNode = state.nodes.find(n => n.id === '1');
          const content = initNode?.data.content || '';
          const match = content.match(/<<set\s+\$moedas\s*(?:to|=)\s*(\d+)>>/i);
          if (match) {
            const val = parseInt(match[1], 10);
            return val <= 25;
          }
          return false;
        },
        autoAdvance: true,
        targetNodeId: '1',
        highlightNodeId: '1',
        allowEditContent: true,
        highlightButton: 'editContent',
        ghostText: '<<set $moedas to 10>>'
      },
      {
        titleKey: 'tutorial.t6Step8Title',
        descKey: 'tutorial.t6Step8Desc',
        check: (state) => state.isPlayModeOpen === true,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'play'
      },
      {
        titleKey: 'tutorial.t6Step9Title',
        descKey: 'tutorial.t6Step9Desc',
        check: (state) => state.playModeCurrentNodeId === '4',
        autoAdvance: true,
        allowPlay: true,
        choiceTarget: '4'
      },
      {
        titleKey: 'tutorial.t6Step10Title',
        descKey: 'tutorial.t6Step10Desc',
        check: (state) => state.isPlayModeOpen === false,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'endTest'
      },
      {
        titleKey: 'tutorial.completeTitle',
        descKey: 'tutorial.completeText',
        check: null,
        autoAdvance: false
      }
    ],
    t7: [
      {
        titleKey: 'tutorial.t7Step1Title',
        descKey: 'tutorial.t7Step1Desc',
        check: (state) => state.selectedNodeId === '2',
        autoAdvance: true,
        targetNodeId: '2',
        highlightNodeId: '2'
      },
      {
        titleKey: 'tutorial.t7Step2Title',
        descKey: 'tutorial.t7Step2Desc',
        check: (state) => {
          const initNode = state.nodes.find(n => n.id === '2');
          const content = initNode?.data.content || '';
          const hasText = content.match(/<<set\s+\$nome\s+(?:to|=)\s+["']Heroi["']\s*>>/i);
          const hasNum = content.match(/<<set\s+\$ouro\s+(?:to|=)\s+15\s*>>/i);
          const hasBool = content.match(/<<set\s+\$temChave\s+(?:to|=)\s+false\s*>>/i);
          return !!(hasText && hasNum && hasBool);
        },
        autoAdvance: true,
        targetNodeId: '2',
        highlightNodeId: '2',
        allowEditContent: true,
        highlightButton: 'editContent',
        ghostText: '<<set $nome to "Heroi">>\n<<set $ouro to 15>>\n<<set $temChave to false>>'
      },
      {
        titleKey: 'tutorial.t7Step3Title',
        descKey: 'tutorial.t7Step3Desc',
        check: (state) => state.selectedNodeId === '4',
        autoAdvance: true,
        targetNodeId: '4',
        highlightNodeId: '4'
      },
      {
        titleKey: 'tutorial.t7Step4Title',
        descKey: 'tutorial.t7Step4Desc',
        check: (state) => {
          const startNode = state.nodes.find(n => n.id === '4');
          const content = startNode?.data.content || '';
          const hasLink = content.includes('[[Explorar o Quarto->Quarto]]') || content.includes('[[Quarto]]');
          const hasEdge = state.edges.some(e => e.source === '4' && e.target === '5');
          return !!(hasLink && hasEdge);
        },
        autoAdvance: true,
        targetNodeId: '4',
        highlightNodeId: '4',
        allowEditContent: true,
        highlightButton: 'editContent',
        ghostText: 'Olá, $nome! Bem-vindo ao calabouço.\n[[Explorar o Quarto->Quarto]]'
      },
      {
        titleKey: 'tutorial.t7Step5Title',
        descKey: 'tutorial.t7Step5Desc',
        check: (state) => state.selectedNodeId === '5',
        autoAdvance: true,
        targetNodeId: '5',
        highlightNodeId: '5'
      },
      {
        titleKey: 'tutorial.t7Step6Title',
        descKey: 'tutorial.t7Step6Desc',
        check: (state) => {
          const roomNode = state.nodes.find(n => n.id === '5');
          const content = roomNode?.data.content || '';
          const hasSetChave = content.match(/<<set\s+\$temChave\s+(?:to|=)\s+true\s*>>/i);
          const hasIf = content.match(/<<if\s+\$ouro\s+gte\s+10\s*>>/i);
          const hasElse = content.includes('<<else>>');
          const hasLinkCofre = content.includes('[[Ir para o Cofre->Cofre]]') || content.includes('[[Cofre]]');
          const hasLinkFim = content.includes('[[Ir para o Fim->Fim]]') || content.includes('[[Fim]]');
          const hasEndIf = content.includes('<</if>>');
          return !!(hasSetChave && hasIf && hasElse && hasLinkCofre && hasLinkFim && hasEndIf);
        },
        autoAdvance: true,
        targetNodeId: '5',
        highlightNodeId: '5',
        allowEditContent: true,
        highlightButton: 'editContent',
        ghostText: 'Estás no Quarto. Tens $ouro moedas.\n<<set $temChave to true>>\n\n<<if $ouro gte 10>>\n  [[Ir para o Cofre->Cofre]]\n<<else>>\n  [[Ir para o Fim->Fim]]\n<</if>>'
      },
      {
        titleKey: 'tutorial.t7Step7Title',
        descKey: 'tutorial.t7Step7Desc',
        check: (state) => state.isPlayModeOpen === true,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'play'
      },
      {
        titleKey: 'tutorial.t7Step8Title',
        descKey: 'tutorial.t7Step8Desc',
        check: (state) => state.playModeCurrentNodeId === '6',
        autoAdvance: true,
        allowPlay: true,
        choiceTarget: '6'
      },
      {
        titleKey: 'tutorial.t7Step9Title',
        descKey: 'tutorial.t7Step9Desc',
        check: (state) => state.isPlayModeOpen === false,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'endTest'
      },
      {
        titleKey: 'tutorial.t7Step10Title',
        descKey: 'tutorial.t7Step10Desc',
        check: (state) => state.selectedNodeId === '2',
        autoAdvance: true,
        targetNodeId: '2',
        highlightNodeId: '2'
      },
      {
        titleKey: 'tutorial.t7Step11Title',
        descKey: 'tutorial.t7Step11Desc',
        check: (state) => {
          const initNode = state.nodes.find(n => n.id === '2');
          const content = initNode?.data.content || '';
          const match = content.match(/<<set\s+\$ouro\s+(?:to|=)\s*(\d+)\s*>>/i);
          if (match) {
            const val = parseInt(match[1], 10);
            return val < 10;
          }
          return false;
        },
        autoAdvance: true,
        targetNodeId: '2',
        highlightNodeId: '2',
        allowEditContent: true,
        highlightButton: 'editContent',
        ghostText: '<<set $nome to "Heroi">>\n<<set $ouro to 5>>\n<<set $temChave to false>>'
      },
      {
        titleKey: 'tutorial.t7Step12Title',
        descKey: 'tutorial.t7Step12Desc',
        check: (state) => state.isPlayModeOpen === true,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'play'
      },
      {
        titleKey: 'tutorial.t7Step13Title',
        descKey: 'tutorial.t7Step13Desc',
        check: (state) => state.playModeCurrentNodeId === '7',
        autoAdvance: true,
        allowPlay: true,
        choiceTarget: '7'
      },
      {
        titleKey: 'tutorial.t7Step14Title',
        descKey: 'tutorial.t7Step14Desc',
        check: (state) => state.isPlayModeOpen === false,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'endTest'
      },
      {
        titleKey: 'tutorial.completeTitle',
        descKey: 'tutorial.completeText',
        check: null,
        autoAdvance: false
      }
    ],
    t8: [
      {
        titleKey: 'tutorial.t8Step1Title',
        descKey: 'tutorial.t8Step1Desc',
        check: (state) => state.selectedNodeId === 'zone-1',
        autoAdvance: true,
        targetNodeId: 'zone-1',
        highlightNodeId: 'zone-1'
      },
      {
        titleKey: 'tutorial.t8Step2Title',
        descKey: 'tutorial.t8Step2Desc',
        check: (state) => !!state.nodes.find(n => n.id === 'zone-1')?.data.bgImage,
        autoAdvance: true,
        targetNodeId: 'zone-1',
        highlightNodeId: 'zone-1',
        highlightButton: 'editImage'
      },
      {
        titleKey: 'tutorial.t8Step3Title',
        descKey: 'tutorial.t8Step3Desc',
        check: (state) => state.isPlayModeOpen === true,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'play'
      },
      {
        titleKey: 'tutorial.t8Step4Title',
        descKey: 'tutorial.t8Step4Desc',
        check: (state) => state.isPlayModeOpen === false,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'endTest'
      },
      {
        titleKey: 'tutorial.t8Step5Title',
        descKey: 'tutorial.t8Step5Desc',
        check: (state) => state.selectedNodeId === '1',
        autoAdvance: true,
        targetNodeId: '1',
        highlightNodeId: '1'
      },
      {
        titleKey: 'tutorial.t8Step6Title',
        descKey: 'tutorial.t8Step6Desc',
        check: (state) => !!state.nodes.find(n => n.id === '1')?.data.bgImage,
        autoAdvance: true,
        targetNodeId: '1',
        highlightNodeId: '1',
        highlightButton: 'editImage'
      },
      {
        titleKey: 'tutorial.t8Step7Title',
        descKey: 'tutorial.t8Step7Desc',
        check: (state) => state.isPlayModeOpen === true,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'play'
      },
      {
        titleKey: 'tutorial.t8Step8Title',
        descKey: 'tutorial.t8Step8Desc',
        check: (state) => state.isPlayModeOpen === false,
        autoAdvance: true,
        allowPlay: true,
        highlightButton: 'endTest'
      },
      {
        titleKey: 'tutorial.completeTitle',
        descKey: 'tutorial.completeText',
        check: null,
        autoAdvance: false
      }
    ]
  }), []);

  // --- ACTIONS ---

  const startTutorial = (id) => {
    // 1. Backup current data if not already backed up
    if (!localStorage.getItem('plot-in-a-pot-project-backup')) {
      const currentData = {
        nodes,
        edges,
        translations
      };
      localStorage.setItem('plot-in-a-pot-project-backup', JSON.stringify(currentData));
    }

    // 2. Load template data
    const template = tutorialTemplates[id];
    setNodes(JSON.parse(JSON.stringify(template.nodes)));
    setEdges(JSON.parse(JSON.stringify(template.edges)));
    setTranslations(JSON.parse(JSON.stringify(template.translations)));
    setSelectedNodeId(null);
    setIsPlayModeOpen(false);

    // 3. Set states
    setActiveTutorial(id);
    setStepIndex(0);
    setStepCompleted(false);
    setIsMenuOpen(false);
    setIsTutorialPromptOpen(false);
  };

  const exitTutorial = () => {
    // Restore backup
    const backupStr = localStorage.getItem('plot-in-a-pot-project-backup');
    if (backupStr) {
      try {
        const backup = JSON.parse(backupStr);
        setNodes(backup.nodes);
        setEdges(backup.edges);
        setTranslations(backup.translations);
      } catch (e) {
        console.error("Failed to restore backup project", e);
      }
      localStorage.removeItem('plot-in-a-pot-project-backup');
    }
    setActiveTutorial(null);
    setSelectedNodeId(null);
    setIsPlayModeOpen(false);
    setIsMenuOpen(false);
  };

  const nextStep = () => {
    const steps = tutorialSteps[activeTutorial];
    if (stepIndex < steps.length - 1) {
      setStepIndex(prev => prev + 1);
      setStepCompleted(false);
    } else {
      localStorage.setItem('plot-in-a-pot-tutorial-completed', 'true');
      
      // Auto-restore original project backup when tutorial completes
      const backupStr = localStorage.getItem('plot-in-a-pot-project-backup');
      if (backupStr) {
        try {
          const backup = JSON.parse(backupStr);
          setNodes(backup.nodes);
          setEdges(backup.edges);
          setTranslations(backup.translations);
        } catch (e) {
          console.error("Failed to restore backup project", e);
        }
        localStorage.removeItem('plot-in-a-pot-project-backup');
      }
      
      setActiveTutorial(null);
      setSelectedNodeId(null);
      setIsPlayModeOpen(false);
      setIsMenuOpen(true);
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
      setStepCompleted(false);
    }
  };

  // --- NOTIFY PARENT OF ACTIVE STEP CHANGE ---
  useEffect(() => {
    if (!activeTutorial) {
      if (onActiveStepChange) onActiveStepChange(null);
      return;
    }
    const steps = tutorialSteps[activeTutorial];
    const currentStep = steps ? steps[stepIndex] : null;
    if (onActiveStepChange) onActiveStepChange(currentStep);
  }, [activeTutorial, stepIndex, onActiveStepChange, tutorialSteps]);

  // --- CHECKER EFFECT ---
  useEffect(() => {
    if (!activeTutorial) {
      setStepCompleted(false);
      return;
    }
    const steps = tutorialSteps[activeTutorial];
    const currentStep = steps ? steps[stepIndex] : null;
    if (!currentStep || !currentStep.check) {
      setStepCompleted(true);
      return;
    }

    const stateToValidate = {
      nodes,
      edges,
      validationResult,
      selectedNodeId,
      isPlayModeOpen,
      translations,
      isVarModalOpen,
      playModeCurrentNodeId,
      playModeLanguage
    };

    const passes = currentStep.check(stateToValidate);
    if (passes) {
      setStepCompleted(true);
      if (currentStep.autoAdvance) {
        const timer = setTimeout(() => {
          nextStep();
        }, 1200);
        return () => clearTimeout(timer);
      }
    } else {
      setStepCompleted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTutorial, stepIndex, nodes, edges, validationResult, selectedNodeId, isPlayModeOpen, translations, isVarModalOpen, playModeCurrentNodeId, playModeLanguage]);

  // If a prompt modal is requested
  if (isTutorialPromptOpen && !activeTutorial) {
    return (
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs font-sans">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-100 p-6 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
          <h4 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-700 pb-2 mb-4">
            🎓 {t('tutorial.promptTitle', 'Interactive Playthrough')}
          </h4>
          
          <p className="text-xs font-mono mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
            {t('tutorial.promptQuestion', 'Gostarias de fazer um tutorial guiado para aprender a usar o Plot-in-a-pot?')}
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                document.cookie = "seen-tutorial-prompt=true; max-age=31536000; path=/";
                setIsTutorialPromptOpen(false);
              }}
              className="px-4 py-2 border-2 border-gray-900 dark:border-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-bold text-xs uppercase shadow-[3px_3px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
            >
              {t('tutorial.no', 'Não')}
            </button>
            
            <button
              type="button"
              onClick={() => {
                document.cookie = "seen-tutorial-prompt=true; max-age=31536000; path=/";
                setIsMenuOpen(true);
                setIsTutorialPromptOpen(false);
              }}
              className="px-4 py-2 border-2 border-gray-900 bg-yellow-400 text-gray-900 font-black text-xs uppercase shadow-[3px_3px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
            >
              {t('tutorial.yes', 'Sim')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard of all tutorials
  if (isMenuOpen || (!activeTutorial && isMenuOpen)) {
    return (
      <div className="fixed inset-0 z-[340] flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs font-sans">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-100 p-6 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff] overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-start border-b-2 border-gray-900 dark:border-gray-700 pb-3">
            <div>
              <h3 className="text-lg font-black uppercase text-gray-950 dark:text-gray-50">
                🎓 {t('tutorial.dashboardTitle', 'Choose a Tutorial Playthrough')}
              </h3>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1">
                {t('tutorial.dashboardSubtitle', 'Learn the core features of the interactive story editor step-by-step.')}
              </p>
            </div>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                if (activeTutorial) {
                  // just return to active tutorial
                } else {
                  exitTutorial();
                }
              }}
              className="px-2 py-1 border-2 border-gray-900 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-bold text-xs uppercase cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex border-b-2 border-gray-900 dark:border-gray-700 my-4 gap-2">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 text-xs font-black uppercase border-t-2 border-l-2 border-r-2 border-gray-900 dark:border-gray-200 transition-colors cursor-pointer ${
                activeTab === 'basic'
                  ? 'bg-yellow-400 text-gray-900 translate-y-[2px]'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              🎓 Básico
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-4 py-2 text-xs font-black uppercase border-t-2 border-l-2 border-r-2 border-gray-900 dark:border-gray-200 transition-colors cursor-pointer ${
                activeTab === 'advanced'
                  ? 'bg-indigo-600 text-white translate-y-[2px]'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              ⚡ Avançado
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            {activeTab === 'basic' ? (
              <>
                {/* Tutorial 1 */}
                <div className="border-4 border-gray-900 dark:border-gray-600 p-4 bg-yellow-50 dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-sm uppercase text-gray-900 dark:text-gray-100 mb-2">
                      {t('tutorial.t1Name')}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                      {t('tutorial.t1Desc')}
                    </p>
                  </div>
                  <button
                    onClick={() => startTutorial('t1')}
                    className="mt-4 w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-black text-xs uppercase border-2 border-gray-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    {t('tutorial.yes', 'Começar')}
                  </button>
                </div>

                {/* Tutorial 2 */}
                <div className="border-4 border-gray-900 dark:border-gray-600 p-4 bg-indigo-50 dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-sm uppercase text-gray-900 dark:text-gray-100 mb-2">
                      {t('tutorial.t2Name')}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                      {t('tutorial.t2Desc')}
                    </p>
                  </div>
                  <button
                    onClick={() => startTutorial('t2')}
                    className="mt-4 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase border-2 border-gray-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    {t('tutorial.yes', 'Começar')}
                  </button>
                </div>

                {/* Tutorial 3 */}
                <div className="border-4 border-gray-900 dark:border-gray-600 p-4 bg-green-50 dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-sm uppercase text-gray-900 dark:text-gray-100 mb-2">
                      {t('tutorial.t3Name')}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                      {t('tutorial.t3Desc')}
                    </p>
                  </div>
                  <button
                    onClick={() => startTutorial('t3')}
                    className="mt-4 w-full py-2 bg-green-400 hover:bg-green-500 text-gray-950 font-black text-xs uppercase border-2 border-gray-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    {t('tutorial.yes', 'Começar')}
                  </button>
                </div>

                {/* Tutorial 4 */}
                <div className="border-4 border-gray-900 dark:border-gray-600 p-4 bg-pink-50 dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-sm uppercase text-gray-900 dark:text-gray-100 mb-2">
                      {t('tutorial.t4Name')}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                      {t('tutorial.t4Desc')}
                    </p>
                  </div>
                  <button
                    onClick={() => startTutorial('t4')}
                    className="mt-4 w-full py-2 bg-pink-400 hover:bg-pink-500 text-gray-950 font-black text-xs uppercase border-2 border-gray-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    {t('tutorial.yes', 'Começar')}
                  </button>
                </div>

                {/* Tutorial 8 */}
                <div className="border-4 border-gray-900 dark:border-gray-600 p-4 bg-amber-50 dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-sm uppercase text-gray-900 dark:text-gray-100 mb-2">
                      {t('tutorial.t8Name')}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                      {t('tutorial.t8Desc')}
                    </p>
                  </div>
                  <button
                    onClick={() => startTutorial('t8')}
                    className="mt-4 w-full py-2 bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs uppercase border-2 border-gray-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    {t('tutorial.yes', 'Começar')}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Tutorial 5 (Advanced Variables & Code) */}
                <div className="border-4 border-gray-900 dark:border-gray-600 p-4 bg-purple-50 dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-sm uppercase text-gray-900 dark:text-gray-100 mb-2">
                      {t('tutorial.t5Name')}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                      {t('tutorial.t5Desc')}
                    </p>
                  </div>
                  <button
                    onClick={() => startTutorial('t5')}
                    className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase border-2 border-gray-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    {t('tutorial.yes', 'Começar')}
                  </button>
                </div>

                {/* Tutorial 6 (Advanced Conditional Connections) */}
                <div className="border-4 border-gray-900 dark:border-gray-600 p-4 bg-blue-50 dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-sm uppercase text-gray-900 dark:text-gray-100 mb-2">
                      {t('tutorial.t6Name')}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                      {t('tutorial.t6Desc')}
                    </p>
                  </div>
                  <button
                    onClick={() => startTutorial('t6')}
                    className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase border-2 border-gray-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    {t('tutorial.yes', 'Começar')}
                  </button>
                </div>

                {/* Tutorial 7 (Pure Twine Code) */}
                <div className="border-4 border-gray-900 dark:border-gray-600 p-4 bg-red-50 dark:bg-gray-800 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-sm uppercase text-gray-900 dark:text-gray-100 mb-2">
                      {t('tutorial.t7Name')}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                      {t('tutorial.t7Desc')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCodeWarning(true)}
                    className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase border-2 border-gray-900 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    {t('tutorial.yes', 'Começar')}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between border-t-2 border-gray-900 dark:border-gray-700 pt-4">
            <button
              onClick={exitTutorial}
              className="px-4 py-2 border-2 border-gray-900 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase shadow-[3px_3px_0px_#000] cursor-pointer"
            >
              {t('tutorial.exitTutorial', 'Exit Tutorial')}
            </button>
            
            {activeTutorial && (
              <button
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 border-2 border-gray-900 bg-black text-white dark:bg-gray-100 dark:text-gray-900 font-black text-xs uppercase shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] cursor-pointer"
              >
                Voltar ao Guia
              </button>
            )}
          </div>
        </div>

        {/* Code Warning Popup Confirmation */}
        {showCodeWarning && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs font-sans">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-100 p-6 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]">
              <h4 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400 border-b-2 border-gray-900 dark:border-gray-700 pb-2 mb-4">
                ⚠️ {t('tutorial.t7WarningTitle', 'Aviso: Código Puro')}
              </h4>
              
              <p className="text-xs font-mono mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('tutorial.t7WarningText', 'Este tutorial é recomendado apenas para quem quer aprender a programar do zero ou já tem experiência com linguagens de programação. Queres mesmo continuar?')}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCodeWarning(false)}
                  className="px-4 py-2 border-2 border-gray-900 dark:border-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-bold text-xs uppercase shadow-[3px_3px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowCodeWarning(false);
                    startTutorial('t7');
                  }}
                  className="px-4 py-2 border-2 border-gray-900 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase shadow-[3px_3px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
                >
                  {t('tutorial.yes', 'Confirmar e Entrar')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active playthrough steps card (floating card at bottom)
  if (activeTutorial) {
    const steps = tutorialSteps[activeTutorial];
    const currentStep = steps[stepIndex];
    if (!currentStep) return null;

    return (
      <div 
        onKeyDown={(e) => {
          // Stop propagation of copy commands inside the box so ReactFlow doesn't intercept it
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            e.stopPropagation();
          }
        }}
        onCopy={(e) => {
          e.stopPropagation();
        }}
        className="fixed bottom-4 left-4 z-[250] w-[380px] bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-100 p-4 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] font-sans transition-all duration-300 select-text"
      >
        
        {/* Banner/Header */}
        <div className="flex justify-between items-center bg-yellow-400 border-2 border-gray-900 text-gray-900 px-2 py-1 mb-3 text-[10px] font-black uppercase tracking-wider">
          <span>🎓 {t(`tutorial.${activeTutorial}Name`)}</span>
          <span>{stepIndex + 1} / {steps.length}</span>
        </div>

        {/* Progress Bar Segmented */}
        <div className="flex gap-1 mb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 border border-gray-900 ${
                i < stepIndex
                  ? 'bg-green-500'
                  : i === stepIndex
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[100px] flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-gray-900 dark:text-gray-50 border-b border-gray-200 dark:border-gray-800 pb-1 mb-2">
              {t(currentStep.titleKey)}
            </h4>
            <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
              {t(currentStep.descKey)}
            </p>
            {(() => {
              const descText = t(currentStep.descKey);
              const imgurMatch = descText.match(/https:\/\/i\.imgur\.com\/[a-zA-Z0-9\.\/_]+/g);
              if (imgurMatch && imgurMatch.length > 0) {
                return (
                  <div className="mt-2.5 flex flex-col gap-1.5 select-none">
                    {imgurMatch.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-1 bg-gray-50 dark:bg-gray-800 p-1 border-2 border-gray-900 dark:border-gray-700">
                        <span className="text-[9px] font-mono text-gray-600 dark:text-gray-400 truncate pl-1 select-text">
                          {url}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(url);
                            setCopiedUrl(url);
                            setTimeout(() => setCopiedUrl(null), 1500);
                          }}
                          className="px-2 py-0.5 border border-gray-900 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-black text-[9px] uppercase cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                        >
                          {copiedUrl === url ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Checklist / Requirement */}
          {currentStep.check && (
            <div className="mt-3 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded">
              <div
                className={`w-4 h-4 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold ${
                  stepCompleted ? 'bg-green-500 text-white' : 'bg-white text-gray-300'
                }`}
              >
                {stepCompleted ? '✓' : ''}
              </div>
              <span className="text-[9px] uppercase font-black text-gray-500 dark:text-gray-400">
                {stepCompleted ? 'Ação Completa!' : 'A aguardar ação do utilizador...'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-2 border-t border-gray-200 dark:border-gray-800 pt-3 mt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="px-2 py-1.5 border border-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 text-[10px] font-bold uppercase transition-all shadow-[2px_2px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
            >
              {t('tutorial.backToMenu', 'Menu')}
            </button>
            <button
              onClick={exitTutorial}
              className="px-2 py-1.5 border border-gray-900 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold uppercase transition-all shadow-[2px_2px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
            >
              {t('tutorial.exitTutorial', 'Exit')}
            </button>
          </div>

          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-1.5 border border-gray-900 bg-white dark:bg-gray-800 dark:text-gray-200 text-[10px] font-bold uppercase transition-all shadow-[2px_2px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                ←
              </button>
            )}
            
            {currentStep.check && !stepCompleted ? (
              <button
                onClick={nextStep}
                className="px-3 py-1.5 border border-gray-900 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 text-[10px] font-bold uppercase transition-all shadow-[2px_2px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
                title={t('tutorial.skipStep', 'Saltar Passo')}
              >
                {t('tutorial.skipStep', 'Saltar')} →
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-3 py-1.5 border-2 border-gray-900 bg-yellow-400 text-gray-900 text-[10px] font-black uppercase transition-all shadow-[2px_2px_0px_#000] cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                {stepIndex === steps.length - 1 ? 'Terminar' : t('tutorial.nextStep', 'Seguinte')} →
              </button>
            )}
          </div>
        </div>

      </div>
    );
  }

  return null;
}
