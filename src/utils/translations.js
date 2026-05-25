export const translations = {
    en: {
        common: {
            close: 'Close',
            cancel: 'Cancel',
            yes: 'Yes',
            no: 'No',
            on: 'ON',
            off: 'OFF',
            languageToggle: 'EN / PT'
        },
        topBar: {
            addScene: '+ Add Scene',
            addScript: '+ Add Script',
            addStyle: '+ Add Style',
            systemMenu: '+ System',
            generateAi: 'Generate with AI',
            play: 'Play',
            doubleClickHint: 'Double click to edit',
            theme: 'Theme',
            settings: 'Settings',
            helpLabels: {
                addScene: 'Add Scene',
                addScript: 'Add Script',
                addStyle: 'Add Style',
                systemMenu: 'System Nodes',
                generateAi: 'AI Generation',
                play: 'Play Mode',
                theme: 'Theme',
                settings: 'Settings'
            },
            nodeLabels: {
                style: 'Style',
                scene: 'Scene'
            },
            helpTitles: {
                addScene: 'Add Scene',
                addScript: 'Add Script',
                addStyle: 'Add Style',
                systemMenu: 'System Nodes',
                generateAi: 'AI Generation',
                play: 'Play Mode',
                theme: 'Theme',
                settings: 'Settings'
            },
            helpSubtitles: {
                addScene: 'Creates a choice node',
                addScript: 'Creates a code node',
                addStyle: 'Creates a CSS node',
                systemMenu: 'Twine global configuration nodes',
                generateAi: 'Imports text and builds the graph automatically',
                play: 'Tests the story in preview mode',
                theme: 'Switches between light and dark mode',
                settings: 'Interface and dev mode settings'
            },
            helpDescription: {
                addScene: 'Use this button to add a new choice passage to your graph. Each scene can have several options to advance the story.',
                addScript: 'Use this button to add a JavaScript node. It is useful for advanced logic and variable manipulation inside the story.',
                addStyle: 'This button creates a node for adding custom styles to your game and controlling the appearance of graph elements.',
                generateAi: 'Use this button to open the AI import. It generates a graph from story text using a language model.',
                play: 'This button opens play mode. You can navigate the narrative as a player and test available choices.',
                theme: 'Use this button to change the interface theme. Dark mode is easier on the eyes at night, light mode works well during the day.',
                settings: 'Opens the settings panel. Here you can toggle secret nodes, view flow errors, and control editor options.'
            },
            helpSystem: {
                intro: 'These nodes control the invisible engine and structure of your game:',
                storyInit: 'The engine starts here. This is the required place to declare all story variables before the first screen.',
                storyTitle: 'Defines your project title.',
                storyData: 'Stores important technical metadata in JSON format (such as the format version and start passage).',
                storyCaption: 'What you write here stays visible in the game sidebar. Great for showing inventory, sanity, or stats in real time.',
                hotkeysLabel: 'Hotkeys:'
            },
            languageToggleAria: 'Switch language to Portuguese'
        },
        dataPanel: {
            title: 'Data Engine',
            export: 'Export to .twee',
            importTitle: 'Import Story',
            importHelpTitle: 'Import Story',
            importHelpSubtitle: 'How to load your project',
            importHelpLine1: 'You can import your Twine code (Twee format) in two ways:',
            importHelpBullet1: 'Paste the text directly into the box.',
            importHelpBullet2: 'Drag and drop a .twee file into the area.',
            importHelpWarning: 'Warning: Importing will overwrite the current graph.',
            importButton: 'Import',
            placeholder: 'Paste or drop a .twee file here',
            validateLogic: 'Validate Logic',
            validationHelp: {
                title: 'Logical Validator',
                subtitle: 'Graph math engine',
                line1: 'This algorithm walks every possible path of your story while simulating variable state (the player inventory).',
                line2: 'It warns you if it detects dead ends or permanently blocked routes to avoid launching an impossible-to-complete story.',
                hotkeyLabel: 'Hotkey: Ctrl + V'
            },
            syntaxWarnings: 'Syntax Warnings:',
            unreachableNodes: 'Unreachable Nodes:',
            noEndDetected: 'No Reachable End Detected',
            reachableEnds: 'Reachable End(s):',
            flowErrors: 'Flow Errors Detected:',
            adjacencyList: 'Adjacency List',
            simulateLegacy: 'Simulate (See Console)',
            collapsedLabel: 'Data Engine',
            pathFollowed: 'Path Followed',
            arrivalVariables: 'Arrival Variables',
            exportTranslations: 'Export CSV',
            importTranslations: 'Import CSV',
            addKey: 'Add Key',
            translationTableTitle: 'Keys Database',
            languagesManagement: 'Active Locales',
            removeLanguageHint: 'Click to completely delete this locale column',
            editTitle: 'Edit Entry',
            translationPlaceholder: 'Type translation here...',
            help: {
                languages: {
                    title: 'Locale Manager',
                    subtitle: 'Adding custom targets',
                    line1: 'Type any locale identifier (like CZ, FR, JP) and click "+" to append a dynamic translation column across your database.',
                    warning: 'Warning: Clicking an active language badge will purge its column and all associated data permanently!'
                },
                table: {
                    title: 'Localization Engine',
                    subtitle: 'Dynamic placeholders mapping',
                    line1: 'Define abstract keys to bypass raw hardcoded text lines. Inside your passage choice layouts, parse them using:',
                    syntaxExample: 'You see a [[t("scene_cave")]].'
                }
            }
        },
        dataPanelPrompts: {
            newKeyName: 'Enter the new translation key (e.g., scene_intro):'
        },
        settingsModal: {
            title: 'Settings',
            visualization: 'Visualization',
            secretNodes: 'Secret Nodes',
            flowAlerts: 'Flow Alerts',
            dev: 'Dev',
            adjacencyList: 'Adjacency List',
            devSimulation: 'Dev Simulation',
            help: {
                secretNodes: {
                    title: 'Secret Nodes',
                    subtitle: 'Toggle system node visibility',
                    text: 'Switch the visibility of special Twine system nodes like StoryInit or StoryData. Turning this off declutters the screen while you write the story.',
                    aria: 'Help Secret Nodes'
                },
                flowAlerts: {
                    title: 'Flow Alerts',
                    subtitle: 'Logical error warnings',
                    text: 'Controls the red box in the data panel. When active, the system warns you about permanently blocked options or unreachable narrative sections.',
                    aria: 'Help Flow Alerts'
                },
                adjacencyList: {
                    title: 'Adjacency List',
                    subtitle: 'Graph math structure',
                    text: 'Opens a technical data panel showing how nodes are connected behind the scenes. Useful for debugging route algorithms.',
                    aria: 'Help Adjacency List'
                },
                devSimulation: {
                    title: 'Dev Simulation',
                    subtitle: 'Browser console testing',
                    text: 'Enables a button that runs invisible simulations of all possible paths. Results are printed to the browser console (F12).',
                    aria: 'Help Dev Simulation'
                },
                dangerZone: {
                    title: 'Delete Project',
                    subtitle: 'Warning: irreversible action',
                    text: 'This button permanently destroys all unexported app data, clears local browser storage, and reloads the page.',
                    aria: 'Help Danger Zone'
                }
            },
            dangerZone: 'Danger Zone',
            dangerZoneTitle: 'Delete Project',
            dangerZoneSubtitle: 'Warning: irreversible action',
            dangerZoneText: 'This button permanently destroys all unexported app data, clears local browser storage, and reloads the page.',
            resetButton: 'Clear Cache & Reset',
            theme: 'Theme',
            close: 'Close'
        },
        aiImportModal: {
            title: 'AI: Text to Graph',
            gemini: 'Google Gemini',
            ollama: 'Ollama (Local)',
            apiKey: 'Gemini API Key',
            model: 'Ollama Model',
            storyText: 'Freeform Story Text',
            storyPlaceholder: 'Once upon a time, an adventurer arrived at a fork in the road. If you go left...',
            helpTitle: 'AI Instructions',
            helpSubtitle: 'How to write for the best results',
            helpLine1: 'Write your story in a continuous narrative, but make branches clear.',
            helpExampleLabel: 'Example:',
            helpExampleText: '"You wake in a cell. You can try to break the door or shout for a guard. If you break the door, you find a corridor. If you shout, the guard chains you."',
            helpLine2: 'The AI will convert your descriptive logic into a structured graph of nodes.',
            generateGraph: 'Generate Graph',
            processing: 'Processing...',
            errors: {
                noStory: 'Please write a story first.',
                noApiKey: 'Gemini API key is required.',
                noModel: 'Please enter the Ollama model name.'
            }
        },
        playMode: {
            endTest: 'End Preview',
            help: 'Help',
            devMode: 'Dev Mode',
            endOfStory: 'End of Story (No exits available)',
            noNarrative: 'No narrative text defined in this passage.',
            hiddenDebug: 'Debug panel hidden for immersion.',
            tags: 'Passage Tags',
            variables: 'Variables',
            empty: 'Empty.',
            noTags: 'No tags',
            blocked: 'BLOCKED',
            path: 'Path',
            devHelpLine1: 'Normal mode shows only accessible options. In Dev mode, all options are visible to help test flow.',
            devHelpLine2: 'Use Ctrl + Shift + D to toggle Dev Mode quickly.',
            language: 'Current Locale'
        },
        inspector: {
            title: 'Inspector',
            id: 'ID:',
            label: 'Label (Name)',
            type: 'Type',
            tags: 'Tags',
            typeChoice: 'Choice (Scene)',
            typeJavaScript: 'JavaScript (Logic)',
            typeCss: 'CSS (Style)',
            setStart: 'Set as Start',
            narrativeText: 'Narrative Text',
            sourceCode: 'Source Code',
            createVariable: '+ Create Variable',
            changeValue: '+/- Change Value',
            localVarHint: 'Create a variable only in this node',
            syntaxWarnings: 'Syntax Warnings:',
            selectNode: 'Select a node to edit.',
            deleteNode: 'Delete Node',
            help: {
                label: {
                    title: 'Label',
                    subtitle: 'Node Identifier',
                    text: 'The exact name used for linking [[Target]].'
                },
                type: {
                    title: 'Type',
                    subtitle: 'Block Function',
                    text: 'Defines whether this block contains narrative story or technical code.'
                },
                tags: {
                    title: 'Tags',
                    subtitle: 'Metadata',
                    text: 'Used for special behaviors. Ex: start, secreto.'
                },
                content: {
                    title: 'Content',
                    subtitle: 'Where the magic happens',
                    text: 'Write your story, choices, or code here.'
                }
            },
            prompts: {
                globalVarName: 'Global variable name (e.g. gold):',
                globalVarValue: 'Initial value for ',
                localVarCreate: 'CREATE LOCAL VARIABLE\nVariable name (e.g. $doorKey):',
                localVarChange: 'CHANGE EXISTING VARIABLE\nAvailable variables: ',
                varError: 'Error: The variable does not exist in StoryInit!\n\nCreate it there first or enable the "Create a variable only in this node" checkbox.',
                newValue: 'New value for '
            }
        },
        popout: {
            close: 'Close'
        },
        alerts: {
            resetConfirm: 'Warning: This will delete all current progress. Continue?',
            aiSuccess: 'AI generated your story successfully!',
            aiInvalid: 'AI returned invalid output. Please try again.',
            importedGraph: 'Story imported successfully!',
            noWritableStory: 'Please write a story first.',
            noApiKey: 'Gemini API key is required.',
            noModel: 'Please enter an Ollama model to use.',
            specialNodeExists: 'The special node already exists in the project.',
            validationSuccess: 'Story is consistent! All paths are reachable.\n✓ {count} end(s) detected: {ends}',
            validationNoEnd: 'No flow issues found, but no ending was detected. The story may be stuck in a loop.',
            playModeBlocked: 'ACCESS BLOCKED:\n\nPlayer Mode cannot start because some nodes have syntax errors (highlighted in orange).\n\nCheck the Inspector and fix invalid links before testing the story.'
        },
        hotkeys: {
            addScene: 'Hotkey: Ctrl + X',
            addScript: 'Hotkey: Ctrl + S',
            addStyle: 'Hotkey: Ctrl + E',
            generateAi: 'Hotkey: Ctrl + I',
            play: 'Hotkey: Ctrl + P',
            settings: 'Hotkey: Ctrl + ,',
            validator: 'Hotkey: Ctrl + V'
        }
    },

    // -------------------------------------------------------------------------------------------------
    // ------------------------------------------ PORTUGUÊS --------------------------------------------
    // -------------------------------------------------------------------------------------------------

    pt: {
        common: {
            close: 'Fechar',
            cancel: 'Cancelar',
            yes: 'Sim',
            no: 'Não',
            on: 'ON',
            off: 'OFF',
            languageToggle: 'EN / PT'
        },
        topBar: {
            addScene: '+ Add Cena',
            addScript: '+ Add Script',
            addStyle: '+ Add Estilo',
            systemMenu: '+ Sistema',
            generateAi: 'Gerar com IA',
            play: 'Jogar',
            doubleClickHint: 'Duplo clique para editar',
            theme: 'Tema',
            settings: 'Definições',
            helpLabels: {
                addScene: 'Adicionar Cena',
                addScript: 'Adicionar Script',
                addStyle: 'Adicionar Estilo',
                systemMenu: 'Nós de Sistema',
                generateAi: 'Gerar com IA',
                play: 'Jogar',
                theme: 'Tema',
                settings: 'Definições'
            },
            nodeLabels: {
                style: 'Estilo',
                scene: 'Cena'
            },
            helpTitles: {
                addScene: 'Adicionar Cena',
                addScript: 'Adicionar Script',
                addStyle: 'Adicionar Estilo',
                systemMenu: 'Nós de Sistema',
                generateAi: 'Gerar com IA',
                play: 'Jogar',
                theme: 'Tema',
                settings: 'Definições'
            },
            helpSubtitles: {
                addScene: 'Cria um nó de escolha',
                addScript: 'Cria um nó de código',
                addStyle: 'Cria um nó CSS',
                systemMenu: 'Nós de configuração global do Twine',
                generateAi: 'Importa texto e cria o grafo automaticamente',
                play: 'Testa a história em modo de visualização',
                theme: 'Alterna entre claro e escuro',
                settings: 'Configurações de interface e modo dev'
            },
            helpDescription: {
                addScene: 'Usa este botão para adicionar uma nova passagem de escolha ao teu grafo. Cada cena pode ter várias opções para avançar a história.',
                addScript: 'Use este botão para adicionar um nó JavaScript. É útil para lógica avançada e manipulação de variáveis dentro da história.',
                addStyle: 'Este botão cria um nó para adicionar estilos personalizados ao teu jogo e controlar a aparência de elementos do grafo.',
                generateAi: 'Use este botão para abrir a importação por IA. Ele gera um grafo a partir de texto de história utilizando um modelo de linguagem.',
                play: 'Este botão abre o modo de jogo. Pode navegar pela narrativa como jogador e testar as escolhas disponíveis.',
                theme: 'Use este botão para mudar o tema da interface. O modo escuro é mais confortável à noite, o modo claro funciona bem durante o dia.',
                settings: 'Abre o painel de definições. Aqui pode ativar nós secretos, ver erros de fluxo e controlar opções do editor.'
            },
            helpSystem: {
                intro: 'Estes nós controlam o motor invisível e a estrutura do teu jogo:',
                storyInit: 'O motor arranca aqui. É o local obrigatório para declarares todas as variáveis da história antes do primeiro ecrã.',
                storyTitle: 'Define o título do teu projeto.',
                storyData: 'Guarda metadados técnicos em formato JSON (como a versão do formato e o nó inicial).',
                storyCaption: 'O que escreveres aqui fica visível na barra lateral do jogo. Ótimo para inventário, sanidade ou atributos em tempo real.',
                hotkeysLabel: 'Hotkeys:'
            },
            languageToggleAria: 'Mudar idioma para inglês'
        },
        dataPanel: {
            title: 'Motor de Dados',
            export: 'Exportar para .twee',
            importTitle: 'Importar História',
            importHelpTitle: 'Importar História',
            importHelpSubtitle: 'Como carregar o teu projeto',
            importHelpLine1: 'Podes importar o teu código Twine (formato Twee) de duas formas:',
            importHelpBullet1: 'Cola o texto diretamente na caixa.',
            importHelpBullet2: 'Arrasta e larga um ficheiro .twee para a área.',
            importHelpWarning: 'Aviso: Importar irá sobrepor o grafo atual.',
            importButton: 'Importar',
            placeholder: 'Cole ou arraste um arquivo .twee aqui',
            validateLogic: 'Validar Lógica',
            validationHelp: {
                title: 'Validador Lógico',
                subtitle: 'O motor matemático do grafo',
                line1: 'Este algoritmo percorre todos os caminhos possíveis da tua história simulando o estado das variáveis.',
                line2: 'Ele avisa-te se detetar caminhos mortos ou rotas permanentemente bloqueadas.',
                hotkeyLabel: 'Hotkey: Ctrl + V'
            },
            syntaxWarnings: 'Alertas de Sintaxe:',
            unreachableNodes: 'Nós Inacessíveis:',
            noEndDetected: 'Sem Fim Detetado',
            reachableEnds: 'Fim(s) Alcançável(is):',
            flowErrors: 'Erros de Fluxo Detetados:',
            adjacencyList: 'Lista de Adjacência',
            simulateLegacy: 'Simular (Ver Consola)',
            collapsedLabel: 'Motor de Dados',
            pathFollowed: 'Caminho Seguido',
            arrivalVariables: 'Variáveis na Chegada',
            exportTranslations: 'Exportar CSV',
            importTranslations: 'Importar CSV',
            addKey: 'Criar Chave',
            translationTableTitle: 'Base de Chaves',
            languagesManagement: 'Idiomas Ativos',
            removeLanguageHint: 'Clique para apagar permanentemente esta coluna de idioma',
            editTitle: 'Editar Entrada',
            translationPlaceholder: 'Digite a tradução aqui...',
            help: {
                languages: {
                    title: 'Gestor de Idiomas',
                    subtitle: 'Adicionar identificadores personalizados',
                    line1: 'Escreve qualquer sigla de idioma (como CZ, FR, JP) e clica em "+" para criar uma nova coluna de tradução em toda a tabela.',
                    warning: 'Aviso: Clicar num idioma ativo irá remover a coluna e apagar todas as traduções nela contidas sem retorno!'
                },
                table: {
                    title: 'Motor de Localização',
                    subtitle: 'Mapeamento de chaves dinâmicas',
                    line1: 'Cria chaves textuais unificadas para evitar texto estático. Dentro dos teus nós de história podes chamá-las usando a sintaxe:',
                    syntaxExample: 'Estás a ver uma [[t("cena_gruta")]].'
                }
            }
        },
        dataPanelPrompts: {
            newKeyName: 'Insira o nome da nova chave (ex: cena_intro):'
        },
        settingsModal: {
            title: 'Definições',
            visualization: 'Visualização',
            secretNodes: 'Nós Secretos',
            flowAlerts: 'Alertas de Fluxo',
            dev: 'Dev',
            adjacencyList: 'Lista de Adjacência',
            devSimulation: 'Simulação Dev',
            help: {
                secretNodes: {
                    title: 'Nós Secretos',
                    subtitle: 'Alterna visibilidade dos nós do sistema',
                    text: 'Liga ou desliga a visualização de nós especiais do Twine como StoryInit ou StoryData. Desligar ajuda a despoluir o ecrã enquanto escreves a história.',
                    aria: 'Ajuda Nós Secretos'
                },
                flowAlerts: {
                    title: 'Alertas de Fluxo',
                    subtitle: 'Avisos de erros lógicos',
                    text: 'Controla a caixa vermelha no painel de dados. Se estiver ativo, o sistema avisa-te sobre opções permanentemente bloqueadas ou partes narrativas inatingíveis.',
                    aria: 'Ajuda Alertas de Fluxo'
                },
                adjacencyList: {
                    title: 'Lista de Adjacência',
                    subtitle: 'Estrutura matemática do grafo',
                    text: 'Abre um painel técnico que mostra como os nós estão interligados por trás do ecrã. Útil para depurar o algoritmo de rotas.',
                    aria: 'Ajuda Lista de Adjacência'
                },
                devSimulation: {
                    title: 'Simulação Dev',
                    subtitle: 'Testes via consola do browser',
                    text: 'Ativa um botão para correr simulações de todos os caminhos possíveis invisivelmente. Os resultados são impressos na consola do navegador (F12).',
                    aria: 'Ajuda Simulação Dev'
                },
                dangerZone: {
                    title: 'Apagar Projeto',
                    subtitle: 'Atenção: Ação irreversível',
                    text: 'Este botão destrói permanentemente todos os dados não exportados da aplicação, limpa o armazenamento local do navegador e reinicia a página.',
                    aria: 'Ajuda Zona de Perigo'
                }
            },
            dangerZone: 'Zona de Perigo',
            dangerZoneTitle: 'Apagar Projeto',
            dangerZoneSubtitle: 'Atenção: Ação irreversível',
            dangerZoneText: 'Este botão destrói permanentemente todos os dados não exportados da aplicação, limpa o armazenamento local do navegador e reinicia a página.',
            resetButton: 'Limpar Cache e Reset',
            theme: 'Tema',
            close: 'Fechar'
        },
        aiImportModal: {
            title: 'IA: Texto para Grafo',
            gemini: 'Google Gemini',
            ollama: 'Ollama (Local)',
            apiKey: 'API Key do Gemini',
            model: 'Modelo Ollama',
            storyText: 'História em Texto Livre',
            storyPlaceholder: 'Era uma vez um aventureiro que chegou a uma bifurcação. Se fores pela esquerda...',
            helpTitle: 'Instruções para a IA',
            helpSubtitle: 'Como escrever para obter os melhores resultados',
            helpLine1: 'Escreve a tua narrativa de forma corrida, mas certifica-te de que as ramificações são óbvias.',
            helpExampleLabel: 'Exemplo:',
            helpExampleText: '"Acordas numa cela. Podes tentar arrombar a porta ou gritar por um guarda. Se arrombares a porta, encontras um corredor. Se gritares, o guarda prende-te com correntes."',
            helpLine2: 'A IA encarregar-se-á de converter a tua lógica descritiva num grafo de nós perfeitamente estruturado.',
            generateGraph: 'Gerar Grafo',
            processing: 'A Processar...',
            errors: {
                noStory: 'Por favor, escreve alguma história primeiro.',
                noApiKey: 'A chave da API do Gemini é obrigatória.',
                noModel: 'Deves indicar qual o modelo do Ollama que queres usar (ex: llama3).'
            }
        },
        playMode: {
            endTest: 'Terminar Teste',
            help: 'Ajuda',
            devMode: 'Modo Dev',
            endOfStory: 'Fim da História (Nenhuma saída disponível)',
            noNarrative: 'Nenhum texto narrativo definido nesta passagem.',
            hiddenDebug: 'Painel de depuração oculto para imersão.',
            tags: 'Passage Tags',
            variables: 'Variáveis',
            empty: 'Vazio.',
            noTags: 'Sem tags',
            blocked: 'BLOQUEADO',
            path: 'Caminho',
            devHelpLine1: 'O modo normal mostra apenas opções acessíveis. No modo Dev, todas as opções são visíveis para ajudar a testar o fluxo.',
            devHelpLine2: 'Use Ctrl + Shift + D para alternar o Modo Dev rapidamente.',
            language: 'Idioma Atual'
        },
        inspector: {
            title: 'Inspector',
            id: 'ID:',
            label: 'Label (Nome)',
            type: 'Type',
            tags: 'Tags',
            typeChoice: 'Choice (Cena)',
            typeJavaScript: 'JavaScript (Lógica)',
            typeCss: 'CSS (Estilo)',
            setStart: 'Definir como Começo',
            narrativeText: 'Texto Narrativo',
            sourceCode: 'Código Fonte',
            createVariable: '+ Criar Variável',
            changeValue: '+/- Alterar Valor',
            localVarHint: 'Criar uma variável só nesta node',
            syntaxWarnings: 'Avisos de Sintaxe:',
            selectNode: 'Seleciona um nó para editar.',
            deleteNode: 'Apagar Nó',
            help: {
                label: {
                    title: 'Label',
                    subtitle: 'Identificador do nó',
                    text: 'O nome exato usado para os links [[Destino]].'
                },
                type: {
                    title: 'Tipo',
                    subtitle: 'Função do bloco',
                    text: 'Define se este bloco contém história narrativa ou código técnico.'
                },
                tags: {
                    title: 'Tags',
                    subtitle: 'Metadados',
                    text: 'Utilizado para comportamentos especiais. Ex: start, secreto.'
                },
                content: {
                    title: 'Conteúdo',
                    subtitle: 'Onde a magia acontece',
                    text: 'Escreve a tua história, escolhas ou código aqui.'
                }
            },
            prompts: {
                globalVarName: 'Nome da variável global (ex: ouro):',
                globalVarValue: 'Valor inicial para ',
                localVarCreate: 'CRIAR VARIÁVEL LOCAL\nNome da variável (ex: $chavePorta):',
                localVarChange: 'ALTERAR VARIÁVEL EXISTENTE\nVariáveis disponíveis: ',
                varError: 'Erro: A variável não existe no StoryInit!\n\nCrie-a lá primeiro ou ative a checkbox "Criar uma variável só nesta node".',
                newValue: 'Novo valor para '
            }
        },
        popout: {
            close: 'Fechar'
        },
        alerts: {
            resetConfirm: 'Atenção: Isto apagará todo o progresso atual. Deseja continuar?',
            aiSuccess: 'A IA gerou a tua história com sucesso!',
            aiInvalid: 'A IA devolveu um formato inválido. Tenta gerar novamente.',
            importedGraph: 'História importada com sucesso!',
            noWritableStory: 'Por favor, escreve alguma história primeiro.',
            noApiKey: 'A chave da API do Gemini é obrigatória.',
            noModel: 'Deves indicar qual o modelo do Ollama que queres usar (ex: llama3).',
            specialNodeExists: 'O nó especial já existe no projeto.',
            validationSuccess: 'História consistente! Todos os caminhos são alcançáveis.\n✓ {count} fim(s) detetado(s): {ends}',
            validationNoEnd: 'Sem erros de fluxo, mas nenhum fim foi detetado. A história pode estar em loop infinito.',
            playModeBlocked: 'ACESSO BLOQUEADO:\n\nNão é possível iniciar o Modo Jogador. Tens nós com erros de sintaxe (realçados a laranja).\n\nVerifica o Inspector e corrige as ligações inválidas antes de testares a história.'
        },
        hotkeys: {
            addScene: 'Hotkey: Ctrl + X',
            addScript: 'Hotkey: Ctrl + S',
            addStyle: 'Hotkey: Ctrl + E',
            generateAi: 'Hotkey: Ctrl + I',
            play: 'Hotkey: Ctrl + P',
            settings: 'Hotkey: Ctrl + ,',
            validator: 'Hotkey: Ctrl + V'
        }
    }
};

export function getTranslation(locale, path, fallback = '') {
    return path.split('.').reduce((acc, key) => acc && acc[key], translations[locale]) || fallback;
}