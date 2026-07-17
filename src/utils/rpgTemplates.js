export const rpgTemplates = {
  npc: `# [Nome do NPC]

**Descrição Física:** [Cabelo, olhos, cicatrizes, vestimentas...]
**Personalidade:** [Traços, segredos, falhas, motivações...]

## Histórico & Relações
- **Fação:** [[Nome da Fação]]
- **Aliados:** [[NPC Aliado]]
- **Inimigos:** [[NPC Inimigo]]
- **Localização Comum:** [[Nome do Local]]

## Notas de Campanha
> [Insira aqui eventos relevantes onde este NPC esteve envolvido ou rumores que ele conhece.]
`,

  location: `# [Nome do Local]

**Tipo:** [Cidade, Taverna, Masmorra, Região...]
**Região:** [[Nome da Região]]
**Governador/Líder:** [[Líder do Local]]

## Descrição Sensorial
- **Som:** [Ruídos de metal, vento sussurrante, música distante...]
- **Cheiro:** [Humidade, cerveja azeda, pinho fresco...]
- **Visão:** [Arquitetura gótica, poças de lama, luz de velas...]

## Pontos de Interesse (POIs)
1. [[Taverna local]] - Local de repouso e rumores.
2. [[Masmorra abandonada]] - Ruínas perigosas nos limites.

## NPCs Residentes
- [[NPC Resident 1]]
- [[NPC Resident 2]]
`,

  quest: `# [Nome da Quest]

**Dador da Quest:** [[Nome do NPC]]
**Recompensa:** [Moedas, Item Mágico, Reputação...]

## Objetivos
- [ ] Ir até [[Nome do Local]]
- [ ] Falar com [[Nome do NPC]]
- [ ] Recuperar [[Item da Quest]]
- [ ] Regressar para reportar

## Notas e Pistas
- *Pista 1:* [Detalhes descobertos pelos jogadores...]
- *Pista 2:* [Onde procurar o item...]
`,

  item: `# [Nome do Item]

**Tipo:** [Arma, Armadura, Poção, Artefacto...]
**Raridade:** [Comum / Incomum / Raro / Muito Raro / Lendário]
**Sintonização Requerida:** [Sim / Não]

## Propriedades Mágicas
- [Efeito especial 1, bónus de ataque...]
- [Cargas ou usos diários...]

## Descrição & Lore
*Este item foi forjado em [[Local de Origem]] por [[Criador do Item]] durante a Era de [[Era].*
`,

  lore: `# [Título da Lore/Fação]

**Tipo:** [Religião, Povo, Evento Histórico, Organização...]
**Líder/Deidade:** [[Líder ou Deus]]

## Visão Geral
[Escreva aqui a descrição detalhada da facção, mitologia ou evento.]

## Membros ou Seguidores Proeminentes
- [[Membro 1]]
- [[Membro 2]]

## Locais Sagrados/Sede
- [[Sede da Organização]]
`,

  session: `# Sessão [Número] - [Título da Sessão]

**Data da Sessão:** [DD/MM/AAAA]
**Data In-Game:** [Dia/Mês/Ano do Mundo]
**Jogadores Presentes:** [Jogador 1, Jogador 2...]

## Sumário da Sessão
1. **Onde Começámos:** Os aventureiros estavam em [[Local Inicial]].
2. **Eventos Principais:**
   - Enfrentaram [[NPC Inimigo]].
   - Descobriram [[Item Encontrado]].
3. **Onde Terminámos:** Em trânsito para [[Local Final]].

## Pontos de Experiência (XP) & Loot
- **XP Ganho:** [Valor]
- **Loot Encontrado:** [[Item Encontrado]]

## Tarefas pendentes (Para a próxima sessão)
- [ ] Resolver a pista em [[Nome do Local]]
- [ ] Vender o loot em [[Cidade Principal]]
`
};
