# Capacidade mensal com almoço

A aba **CAPLA per Month** do Excel usa as capacidades anuais ajustadas
divididas por 12:

- **Vestas:** horas anuais com almoço × (1 + Overtime Vestas/100 − Absence/100) / 12.
- **Subcontractor:** base anual usada pelo cálculo Subcontractor × (1 + Overtime Subcontractor/100) / 12, sem desconto de Absence.

A base anual Subcontractor existente foi mantida; este ajuste não altera
calendários, capacidades anuais ou demandas.

As mesmas capacidades mensais são usadas no Subcontractor Overview do
Tracking, na previsão mensal de subcontratados e nas colunas mensais de Dados.
As exportações arredondam as horas a uma casa decimal.

Análises antigas podem ser abertas e exportadas novamente: as capacidades
mensais são calculadas com os parâmetros da análise, sem modificar ou apagar
os registros salvos, os resultados anuais ou as edições manuais.

Verificação: `node --test tests/monthly-capacity.test.cjs`.
