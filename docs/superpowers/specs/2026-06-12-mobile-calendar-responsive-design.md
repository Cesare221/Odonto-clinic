# Design: calendario e sistema responsivo mobile

Data: 2026-06-12
Status: aprovado para planejamento de implementacao

## Objetivo

Adaptar o sistema CliniDent para funcionar bem no navegador em desktop e celular, preservando a experiencia atual da web e criando uma experiencia mobile completa. O foco inicial de produto e melhorar a agenda para remarcacao, com navegacao clara de meses futuros, e corrigir os principais gargalos de responsividade do app inteiro.

## Decisoes aprovadas

- Usar uma abordagem estrutural de responsividade, nao uma versao separada para mobile.
- Manter a navegacao lateral aberta no desktop.
- No mobile, recolher a sidebar por padrao e abrir a navegacao por um botao hamburguer.
- Manter as visoes mensal e semanal da agenda, com comportamento adaptado por tamanho de tela.
- Priorizar a direcao visual hibrida: agenda mensal/semanal preservada, mas com conteudo empilhado e tocavel no celular.

## Shell responsivo

O shell principal sera ajustado em `MainLayout`, `Sidebar` e `Header`.

No desktop, a sidebar permanece fixa na lateral com a estrutura atual. No mobile, ela vira um drawer sobreposto, fechado por padrao, acionado por um botao hamburguer no topo. Ao selecionar uma rota ou tocar fora do drawer, o menu deve fechar. O header precisa ficar compacto, com titulo, contexto e busca empilhados sem causar overflow horizontal.

O conteudo principal deve usar espacamentos menores no celular e recuperar a densidade atual em telas maiores. Nenhuma tela deve depender de largura minima de desktop para ser utilizavel.

## Agenda e remarcacao

A agenda mensal deve facilitar avancar meses futuros e escolher dias com disponibilidade. Em telas pequenas, o calendario, resumo do dia, horarios e acoes devem aparecer em sequencia vertical. Os botoes de dias e horarios precisam ser confortaveis para toque.

A visao semanal pode manter a grade ampla no desktop. No mobile, ela deve evitar uma experiencia presa a uma grade larga: o usuario precisa conseguir selecionar dia, visualizar horarios e abrir consultas por blocos/listas. A remarcacao deve seguir uma sequencia natural: escolher mes, escolher dia, escolher horario, confirmar ou criar acao.

## Componentes base

`Modal` deve se adaptar ao celular com largura util quase total, altura limitada a viewport e rolagem interna. Formularios que usam duas colunas no desktop devem cair para uma coluna no mobile. Acoes primarias precisam ficar faceis de tocar e nao devem competir com acoes secundarias em telas estreitas.

Listas que hoje se comportam como tabelas devem virar cards no mobile, com rotulos visiveis para cada campo importante. Isso se aplica especialmente a pacientes, confirmacoes, filas e paineis operacionais.

## Telas prioritarias

1. Shell global: layout, sidebar mobile, header e busca.
2. Agenda: calendario mensal, visao semanal, painel de horarios e modais de agendamento.
3. Dashboard/confirmacoes: cards, filtros, fila e aprovacoes de remarcacao.
4. Pacientes/cadastro: listas, busca e formularios.
5. Modais e detalhes: ficha de paciente, consulta e fluxos auxiliares.
6. Login: garantir boa leitura e toque no celular.

## Fora de escopo

- Criar app nativo Android ou iOS.
- Reescrever o design visual completo.
- Trocar framework, roteamento ou biblioteca de UI.
- Alterar regras de negocio de remarcacao no backend, exceto se alguma validacao visual revelar necessidade real.

## Validacao esperada

- O sistema abre e navega no desktop sem regressao visual importante.
- No celular, a sidebar fica recolhida e abre pelo hamburguer.
- A agenda permite navegar para meses futuros e selecionar dias/horarios sem overflow horizontal inutil.
- Modais, formularios e listas cabem na tela pequena com rolagem previsivel.
- Fluxos existentes continuam funcionando: criar consulta, enviar confirmacao, solicitar/avaliar remarcacao, buscar paciente e abrir ficha.
- Build ou testes relevantes devem ser executados ao final da implementacao.

## Riscos e mitigacoes

- Risco: telas extensas ainda terem pequenos overflows escondidos.
  Mitigacao: validar os pontos principais em viewport mobile e ajustar componentes compartilhados primeiro.

- Risco: a agenda semanal perder densidade no celular.
  Mitigacao: preservar a grade completa no desktop e oferecer composicao mais sequencial no mobile.

- Risco: mudancas em componentes base afetarem varias telas.
  Mitigacao: editar de forma incremental e verificar visualmente os fluxos mais usados.
