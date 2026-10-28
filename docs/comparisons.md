# Comparações salvas

Na calculadora CAPLA ou no Tracking, abra **Compare**, selecione dois ou três
cenários e clique em **Open comparison**.

## Salvar e reabrir

- Informe um nome e clique em **Save comparison**, na comparação ou na prévia
  **Export PDF**.
- Após o primeiro salvamento, alterações no nome e em toda a prévia são salvas
  automaticamente após uma breve pausa. Aguarde **All changes saved and
  synchronized.** antes de atualizar a página ou trocar de computador.
- A seção **Saved comparisons** permite abrir/editar ou excluir comparações.
  Ao reabrir, a prévia editável é restaurada.
- São preservados título, subtítulo, nomes dos cenários, parâmetros e resultados
  editados, linhas incluídas, seções, filtros, agrupamento, colunas, totais,
  direção das diferenças e ordenação.
- A comparação contém uma cópia dos cenários no momento do salvamento.
  Alterações ou exclusões posteriores das análises originais não modificam
  essa cópia. Edições na comparação também não alteram as análises originais.
- O resumo da comparação exibe os cenários originais; as edições salvas ficam
  na prévia **Export PDF**.

As comparações usam a mesma sincronização criptografada e os mesmos backups
das análises. Em caso de falha na nuvem, o app informa o erro e mantém o
salvamento local; use **Save comparison** ou **Save changes** para tentar
novamente. Uma exclusão só remove a cópia local após confirmação da nuvem.

## Ordenar resultados

Na prévia, clique no cabeçalho de qualquer coluna de **CAPLA Results** para
ordenar de **A-Z**. Clique novamente para inverter para **Z-A**. Valores
numéricos são ordenados numericamente, células vazias ficam ao final e a linha
**TOTAL** permanece no rodapé. A mesma ordem é salva e usada no PDF.

## Testes

Execute `node --test tests/comparison.test.cjs` na raiz do repositório.
