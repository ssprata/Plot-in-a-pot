export const translations = {
    en: {
        common: {
            close: 'Close',
            cancel: 'Cancel',
            yes: 'Yes',
            no: 'No',
            on: 'ON',
            off: 'OFF',
            languageToggle: 'EN / PT',
            words: 'words',
            deleteConfirm: {
                title: "Confirm Deletion",
                message: "Are you sure you want to delete this item? This action cannot be undone.",
                confirm: "Delete"
            }
        },
        topBar: {
            addScene: '+ Add Scene',
            addScript: '+ Add Script',
            addStyle: '+ Add Style',
            addZone: '+ Add Zone',
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
                addZone: 'Add Zone',
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
                addZone: 'Add Zone',
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
                addZone: 'Creates a visual zone for grouping nodes',
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
                addZone: 'Use this button to add a new visual zone to group your story scenes together. Child nodes within a zone will move together with the zone.',
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
            visualLogic: 'Visual Logic Editor',
            visualBlocksMode: 'Logic Blocks Mode',
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
                visualLogic: {
                    title: 'Visual Logic Editor',
                    subtitle: 'Simplified editing of conditions and variables',
                    text: 'Enables a tab in the Inspector that allows you to configure narratives, variables, and choice conditions visually, without having to write SugarCube code directly.',
                    aria: 'Help Visual Logic'
                },
                visualBlocksMode: {
                    title: 'Logic Blocks Mode',
                    subtitle: 'Scratch-style block editor',
                    text: 'Transforms the visual editor into a structure of blocks (narrative, variables, conditions, and choices) resembling puzzle-like components.',
                    aria: 'Help Logic Blocks Mode'
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
            title: 'Cell Inspector',
            id: 'ID:',
            label: 'Node Name (Label)',
            type: 'Node Type',
            tags: 'Tags',
            typeChoice: 'Scene / Choice',
            typeJavaScript: 'Script (JS)',
            typeCss: 'Style (CSS)',
            setStart: 'Set as Start Node',
            narrativeText: 'Narrative Text',
            sourceCode: 'Source Code',
            createVariable: '+ Create Variable',
            changeValue: '+/- Change Value',
            localVarHint: 'Create a variable only in this node',
            syntaxWarnings: 'Syntax Warnings:',
            selectNode: 'Select a node on the graph to inspect or edit its properties.',
            deleteNode: 'Delete Node',
            previewButton: 'Preview',
            preview: {
                title: 'Narrative Preview',
                subtitle: 'Live text simulation bundle'
            },
            deleteConfirm: {
                nodeMessage: "Are you sure you want to delete this story scene node? All graph edges connected to it will be purged synchronously."
            },
            help: {
                label: {
                    title: 'Node Name',
                    subtitle: 'Unique identifier',
                    text: 'The node label serves as the reference destination for Twine links and navigation. Avoid duplicate names.'
                },
                type: {
                    title: 'Node Type',
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
                    text: 'Write your story, choices, or code here.',
                    help: {
                        title: 'Content Syntax Guide',
                        subtitle: 'Supported formats inside story nodes',
                        variablesTitle: 'System Variables',
                        variablesText: 'You can declare and print dynamic data in real-time within the simulator memory:',
                        variablesExample1: 'Invisible assignment: <<set $gold = 50>>',
                        variablesExample2: 'Manual printing: <<print $gold>> or <<= $gold>>',
                        variablesExample3: 'Direct text injection: "You have $gold coins in your pocket."',
                        linksTitle: 'Links and Choices',
                        linksText: 'To create connections between scenes and generate automatic navigation buttons:',
                        linksExample1: 'Standard Twine link: [[Go to the Market]]',
                        linksExample2: 'Link with custom display text: [[Talk to Merchant|Market]] or [[Talk to Merchant -> Market]]',
                        linksExample3: 'Native SugarCube macro: <<link "Button Text">><<goto "Market">><</link>>',
                        i18nTitle: 'Localization Keys (Multi-Language)',
                        i18nText: 'To ensure the story adapts to active simulator locale swaps seamlessly, inject the localization macro into narratives or buttons:',
                        i18nExample1: 'Translated narrative line: t("story.intro")',
                        i18nExample2: 'Translated graph node button: [[t("choices.go_market")|Market]]',
                        i18nExample3: 'Translated SugarCube macro: <<link \'t("choices.buy_key")\'>>...',
                        logicTitle: 'Conditional Logic and Blocks',
                        logicText: 'Control player choices visibility and access by validating system states:',
                        logicExample1: 'Standard conditional block: <<if $gold >= 10>>Appears if condition is met<</if>>',
                        logicExample2: 'Simulator button disabling: <<if $key is false>><<type "disabled">><</if>>'
                    }
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
            addZone: 'Hotkey: Ctrl + Alt + Z',
            generateAi: 'Hotkey: Ctrl + I',
            play: 'Hotkey: Ctrl + P',
            settings: 'Hotkey: Ctrl + ,',
            navigator: 'Hotkey: Ctrl + V'
        },
        translationMatrix: {
            title: 'Localization Matrix',
            removeLanguageHint: 'Click to remove this language',
            addPlaceholder: 'ADD',
            exportCsv: 'Export CSV',
            importCsv: 'Import CSV',
            columnKey: 'Key',
            sourceBadge: 'Source',
            emptyCell: 'Empty cell',
            inspectorTitle: 'Cell Inspector',
            selectedKey: 'Selected Key',
            targetLocale: 'Target Locale:',
            referenceTextLabel: 'Reference Text',
            noReference: 'No reference text found in source locale.',
            inputLabel: 'Translation Input',
            inputPlaceholder: 'Write your translation here...',
            applyChanges: 'Apply Changes',
            emptySelectionHint: 'Select any table cell to inspect or edit its content without popups.',
            deleteConfirm: {
                keyMessage: "Are you sure you want to completely erase this localization key? This will permanently delete its translation contents across all language tables."
            },
            help: {
                title: 'Matrix Workspace Help',
                subtitle: 'Multi-language management configuration',
                line1: 'Select any table cell to translate its content directly in the inspector panel.',
                line2: 'The first configured column functions as the source language of reference for the simulation.'
            }
        },
        exportModal: {
            title: "Export Twee Story",
            description: "Select the compilation format for the final Twine file (.twee):",
            selectLabel: "Target Compilation Format:",
            optionKeys: "Keys Database -> Format t(\"...\")",
            optionMonolingual: "Monolingual Story -> Format {{lang}}",
            confirmButton: "Export File"
        },
        templatePrompt: {
            title: "Base Template Prompt",
            question: "Do you want to see a base template?",
            yes: "Yes",
            no: "No",
            instructionsTitle: "Where to Place a Template",
            instructionsLine1: "To add or configure a base template, you can edit the initialNodes array in:",
            instructionsLine2: "This array defines the initial structure of nodes loaded when the local storage workspace is empty (or reset). You can customize it with your own default passages, text templates, or styling settings.",
            gotIt: "Got it!"
        },
        variablesModal: {
            title: 'Story Variables',
            globalScope: 'Global Variables',
            localScope: 'Current Scene (Local)',
            searchPlaceholder: 'Search variables...',
            createBtn: 'Create variable',
            colName: 'Name',
            colType: 'Type',
            colValue: 'Default Value',
            colLocalValue: 'Scene Value',
            activeInScene: 'Active in Scene',
            renameHint: 'Renaming propagates automatically across the entire project.',
            noVars: 'No variables found.',
            noVarsGlobalDesc: 'Create global variables using the "+ Create variable" button above.',
            noVarsLocalDesc: 'Activate global variables in the current scene to modify them locally.',
            confirmDeleteTitle: 'Delete Variable',
            typeNumber: 'Number',
            typeString: 'String',
            typeBoolean: 'Boolean',
            delete: 'Delete',
            cancel: 'Cancel',
            close: 'Close',
            allTypes: 'All variables',
            sceneContext: 'Scene:'
        },
        visualBlocks: {
            modalTitle: 'Visual Logic Editor',
            narrativeTitle: 'Narrative Text Block',
            narrativePlaceholder: 'Write your story scene text here...',
            settersTitle: 'Variables Modified at Entry (Setters)',
            addSetterBtn: '+ Add Variable Change',
            setLabel: 'Set',
            toLabel: 'to',
            noSetters: 'No variables modified on entry.',
            conditionalGroupsTitle: 'Conditional Choices (IF / ELSE Branches)',
            simpleChoicesTitle: 'Simple Choices (Unconditional)',
            addSimpleChoiceBtn: '+ Add Simple Choice',
            addConditionalBlockBtn: '+ Add Conditional Branch (IF / ELSE)',
            ifLabel: 'IF (Condition)',
            thenLabel: 'THEN (If True)',
            elseLabel: 'ELSE (If False)',
            addChoiceThen: '+ Add Choice (Then)',
            addChoiceElse: '+ Add Choice (Else)',
            choicePlaceholder: 'Choice text...',
            linkDestination: 'Links to:',
            selectDestination: 'Select target node...',
            deleteConditionBtn: 'Remove condition (Convert choices to simple)',
            deleteBlockBtn: 'Delete Branch',
            noChoices: 'No choices. Connect this node to others or click add below.',
            deleteChoiceTooltip: 'Delete choice'
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
            languageToggle: 'EN / PT',
            words: 'palavras',
            deleteConfirm: {
                title: 'Confirmar Remoção',
                message: 'Tens a certeza que desejas apagar este item? Esta ação não pode ser desfeita.',
                confirm: 'Eliminar'
            }
        },
        topBar: {
            addScene: '+ Adicionar Cena',
            addScript: '+ Adicionar Script',
            addStyle: '+ Adicionar Estilo',
            addZone: '+ Adicionar Zona',
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
                addZone: 'Adicionar Zona',
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
                addZone: 'Adicionar Zona',
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
                addZone: 'Cria uma zona visual para agrupar nós',
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
                addZone: 'Usa este botão para adicionar uma nova zona visual para organizar os teus nós de história. Nós filhos dentro de uma zona mover-se-ão em conjunto com ela.',
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
                    syntaxExample: 'Usa a macro t("sua_chave") nas caixas narrativas ou escolhas.'
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
            visualLogic: 'Editor de Lógica Visual',
            visualBlocksMode: 'Modo de Blocos Lógicos',
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
                    text: 'Controla a caixa vermelha no painel de dados. Se estiver ativo, o system avisa-te sobre opções permanentemente bloqueadas ou partes narrativas inatingíveis.',
                    aria: 'Ajuda Alertas de Fluxo'
                },
                visualLogic: {
                    title: 'Editor de Lógica Visual',
                    subtitle: 'Edição simplificada de condições e variáveis',
                    text: 'Ativa um separador no Inspetor que permite configurar as narrativas, variáveis e condições de escolhas visualmente, sem precisares de escrever código SugarCube diretamente.',
                    aria: 'Ajuda Editor de Lógica Visual'
                },
                visualBlocksMode: {
                    title: 'Modo de Blocos Lógicos',
                    subtitle: 'Editor em blocos estilo Scratch',
                    text: 'Transforma o editor visual numa estrutura de blocos (narrativa, variáveis, condições e escolhas) semelhantes a peças de puzzle.',
                    aria: 'Ajuda Modo de Blocos Lógicos'
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
            title: 'Inspetor de Célula',
            id: 'ID:',
            label: 'Label (Nome)',
            type: 'Tipo de Nó',
            tags: 'Etiquetas (Tags)',
            typeChoice: 'Cena / Escolha',
            typeJavaScript: 'Script (JS)',
            typeCss: 'Estilo (CSS)',
            setStart: 'Definir como Nó Inicial',
            narrativeText: 'Texto Narrativo',
            sourceCode: 'Código Fonte',
            createVariable: '+ Criar Variável',
            changeValue: '+/- Alterar Valor',
            localVarHint: 'Criar uma variável só neste nó',
            syntaxWarnings: 'Avisos de Sintaxe:',
            selectNode: 'Seleciona um nó no grafo para inspecionar ou editar as suas propriedades.',
            deleteNode: 'Eliminar Nó',
            previewButton: 'Preview',
            preview: {
                title: 'Preview Narrativo',
                subtitle: 'Simulação de texto em tempo real'
            },
            deleteConfirm: {
                nodeMessage: "Tens a certeza que desejas eliminar este nó de cena? Todas as ligações associadas a ele serão removidas em cascata do grafo."
            },
            help: {
                label: {
                    title: 'Nome do Nó',
                    subtitle: 'Identificador único',
                    text: 'O nome do nó serve como referência para os links e navegação do Twine. Evita duplicar nomes.'
                },
                type: {
                    title: 'Tipo de Nó',
                    subtitle: 'Comportamento no motor',
                    text: 'Nós de cena contêm texto e escolhas. Nós de JS e CSS servem para injetar scripts globais ou estilos personalizados na história.'
                },
                tags: {
                    title: 'Tags',
                    subtitle: 'Metadados do nó',
                    text: 'Usa tags separadas por vírgulas. A tag \'secreto\' esconde o nó no editor caso a opção correspondente esteja ativa.'
                },
                content: {
                    title: 'Conteúdo',
                    subtitle: 'Onde a magia acontece',
                    text: 'Escreve a tua história, escolhas ou código aqui.',
                    help: {
                        title: 'Guia de Sintaxe do Conteúdo',
                        subtitle: 'Formatos suportados no corpo dos nós',
                        variablesTitle: 'Variáveis do Sistema',
                        variablesText: 'Podes declarar e imprimir dados dinâmicos em tempo real na memória do simulador:',
                        variablesExample1: 'Declaração invisível: <<set $ouro = 50>>',
                        variablesExample2: 'Impressão manual: <<print $ouro>> ou <<= $ouro>>',
                        variablesExample3: 'Injeção direta no texto: "Tens $ouro moedas no bolso."',
                        linksTitle: 'Ligações e Escolhas',
                        linksText: 'Para criar caminhos entre cenas e gerar botões automáticos no ecrã de jogo:',
                        linksExample1: 'Link padrão Twine: [[Ir para o Mercado]]',
                        linksExample2: 'Link com texto customizado: [[Falar com o Mercador|Mercado]] ou [[Falar com o Mercador -> Mercado]]',
                        linksExample3: 'Macro nativa SugarCube: <<link "Texto do Botão">><<goto "Mercado">><</link>>',
                        i18nTitle: 'Chaves de Localização (Multi-Idioma)',
                        i18nText: 'Para garantir que a história responde à troca dinâmica de idioma sem quebrar o simulador, usa a macro de tradução no corpo das cenas ou nos botões:',
                        i18nExample1: 'Narrativa traduzida: t("story.intro")',
                        i18nExample2: 'Botão traduzido no Grafo: [[t("choices.go_market")|Mercado]]',
                        i18nExample3: 'Macro traduzida SugarCube: <<link \'t("choices.buy_key")\'>>...',
                        logicTitle: 'Lógica Condicional e Bloqueios',
                        logicText: 'Controla o acesso às escolhas do jogador validando o estado das tuas variáveis:',
                        logicExample1: 'Condicional padrão: <<if $moedas >= 10>>Aparece se tiver moedas<</if>>',
                        logicExample2: 'Bloqueio de botões no PlayMode: <<if $chave is false>><<type "disabled">><</if>>'
                    }
                }
            },
            prompts: {
                globalVarName: 'Nome da variável global (ex: ouro):',
                globalVarValue: 'Valor inicial para ',
                localVarCreate: 'CRIAR VARIÁVEL LOCAL\nNome da variável (ex: $chavePorta):',
                localVarChange: 'ALTERAR VARIÁVEL EXISTENTE\nVariáveis disponíveis: ',
                varError: 'Erro: A variável não existe no StoryInit!\n\nCrie-a lá primeiro ou ative a checkbox "Criar uma variável só neste nó".',
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
            addZone: 'Hotkey: Ctrl + Alt + Z',
            generateAi: 'Hotkey: Ctrl + I',
            play: 'Hotkey: Ctrl + P',
            settings: 'Hotkey: Ctrl + ,',
            validator: 'Hotkey: Ctrl + V'
        },
        translationMatrix: {
            title: 'Matriz de Localização',
            removeLanguageHint: 'Clique para remover este idioma',
            addPlaceholder: 'ADD',
            exportCsv: 'Exportar CSV',
            importCsv: 'Importar CSV',
            columnKey: 'Chave',
            sourceBadge: 'Base',
            emptyCell: 'Célula vazia',
            inspectorTitle: 'Inspetor de Célula',
            selectedKey: 'Chave Selecionada',
            targetLocale: 'Idioma Alvo:',
            referenceTextLabel: 'Texto de Referência',
            noReference: 'Nenhum texto de referência encontrado no idioma base.',
            inputLabel: 'Tradução do Conteúdo',
            inputPlaceholder: 'Escreve a tua tradução aqui...',
            applyChanges: 'Aplicar Alterações',
            emptySelectionHint: 'Clica em qualquer célula da tabela para inspecionar ou editar o seu conteúdo sem popups.',
            deleteConfirm: {
                keyMessage: "Tens a certeza que desejas apagar esta chave de localização? Isto vai remover permanentemente todos os textos traduzidos correspondentes de todas as tabelas de idiomas."
            },
            help: {
                title: 'Ajuda da Matriz de Chaves',
                subtitle: 'Configuração da base de dados multi-idioma',
                line1: 'Clica em qualquer célula ativa do mapa de grelha para abrir o editor e traduzir o seu texto em tempo real.',
                line2: 'A primeira coluna configurada serve como a linguagem mestre e será injetada como referência para as restantes abas.'
            }
        },
        exportModal: {
            title: "Exportar História Twee",
            description: "Selecione o formato de compilação para o ficheiro final do Twine (.twee):",
            selectLabel: "Formato de Compilação Alvo:",
            optionKeys: "Base de Dados de Chaves -> Formato t(\"...\")",
            optionMonolingual: "História Monolíngue -> Formato {{lang}}",
            confirmButton: "Exportar Ficheiro"
        },
        templatePrompt: {
            title: "Prompt do Modelo Base",
            question: "Desejas ver um modelo base?",
            yes: "Sim",
            no: "Não",
            instructionsTitle: "Onde colocar um Modelo",
            instructionsLine1: "Para adicionar ou configurar um modelo base, podes editar o array initialNodes em:",
            instructionsLine2: "Este array define a estrutura inicial dos nós carregados quando o espaço de trabalho do armazenamento local está vazio (or após um reset). Podes personalizá-lo com as tuas próprias passagens padrão, modelos de texto ou definições de estilo.",
            gotIt: "Entendido!"
        },
        variablesModal: {
            title: 'Variáveis do Jogo',
            globalScope: 'Variáveis Globais',
            localScope: 'Cena Atual (Modificações)',
            searchPlaceholder: 'Procurar variáveis...',
            createBtn: 'Criar variável',
            colName: 'Nome',
            colType: 'Tipo',
            colValue: 'Valor Inicial',
            colLocalValue: 'Valor na Cena',
            activeInScene: 'Ativo na Cena',
            renameHint: 'A renomeação propaga-se automaticamente por todo o projeto.',
            noVars: 'Nenhuma variável encontrada.',
            noVarsGlobalDesc: 'Cria variáveis globais usando o botão "+ Criar variável" no topo.',
            noVarsLocalDesc: 'Ativa variáveis globais na cena atual para as modificar localmente.',
            confirmDeleteTitle: 'Apagar Variável',
            typeNumber: 'Número',
            typeString: 'Texto',
            typeBoolean: 'Booleano',
            delete: 'Apagar',
            cancel: 'Cancelar',
            close: 'Fechar',
            allTypes: 'Todas as variáveis',
            sceneContext: 'Cena:'
        },
        visualBlocks: {
            modalTitle: 'Editor de Lógica Visual',
            narrativeTitle: 'Bloco de Texto Narrativo',
            narrativePlaceholder: 'Escreve o texto da cena aqui...',
            settersTitle: 'Variáveis Modificadas ao Entrar (Setters)',
            addSetterBtn: '+ Adicionar Modificação',
            setLabel: 'Definir',
            toLabel: 'para',
            noSetters: 'Nenhuma variável é modificada ao entrar.',
            conditionalGroupsTitle: 'Escolhas Condicionais (Ramos SE / SENÃO)',
            simpleChoicesTitle: 'Escolhas Simples (Sem Condição)',
            addSimpleChoiceBtn: '+ Adicionar Escolha Simples',
            addConditionalBlockBtn: '+ Adicionar Ramo Condicional (IF / ELSE)',
            ifLabel: 'SE (Condição)',
            thenLabel: 'ENTÃO (Se Sim)',
            elseLabel: 'SENÃO (Senão)',
            addChoiceThen: '+ Adicionar Escolha (Se Sim)',
            addChoiceElse: '+ Adicionar Escolha (Senão)',
            choicePlaceholder: 'Texto da escolha...',
            linkDestination: 'Liga a:',
            selectDestination: 'Selecionar nó de destino...',
            deleteConditionBtn: 'Remover condição (Converter escolhas em simples)',
            deleteBlockBtn: 'Eliminar Ramo',
            noChoices: 'Sem escolhas. Liga este nó no grafo ou clica em adicionar abaixo.',
            deleteChoiceTooltip: 'Eliminar escolha'
        }
    }
};

export function getTranslation(locale, path, fallback = '') {
    return path.split('.').reduce((acc, key) => acc && acc[key], translations[locale]) || fallback;
}