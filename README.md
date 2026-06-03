# Bank Fraud Concurrent Processing 

Sistema de processamento concorrente e distribuído para análise de possíveis fraudes bancárias em arquivos de grande volume.

# Sobre o Projeto

O Bank Fraud Concurrent Processing é um projeto desenvolvido com o objetivo de aplicar conceitos de Programação Concorrente e Distribuída em um cenário próximo da realidade: a análise de grandes volumes de transações bancárias para identificação de possíveis fraudes.

O sistema será capaz de ler arquivos CSV com milhões de registros, dividir o processamento em tarefas menores e executar análises simultâneas para melhorar o desempenho e reduzir o tempo total de execução.

# Objetivo 

O principal objetivo do projeto é desenvolver uma aplicação capaz de processar uma grande base de transações financeiras, aplicando regras antifraude para identificar comportamentos suspeitos.

O projeto busca demonstrar na prática conceitos como:

- Processamento concorrente
- Divisão de tarefas
- Uso de múltiplas threads
- Processamento de arquivos grandes
- Análise de dados em alto volume
- Geração automática de relatórios

# Importancia

Em sistemas bancários reais, milhões de transações podem ocorrer diariamente. Fazer uma análise manual desses dados seria inviável, lenta e propensa a erros.

Por isso, sistemas antifraude precisam ser capazes de processar grandes volumes de dados de forma rápida, eficiente e organizada. Com o uso de programação concorrente e distribuída, é possível dividir o processamento em partes menores, aproveitando melhor os recursos computacionais disponíveis.

Esse tipo de solução permite identificar padrões suspeitos que poderiam passar despercebidos, contribuindo para a prevenção de fraudes financeiras.

O sistema será responsável por: 

- Ler arquivos grandes de transações bancárias
- Processar milhares de registros simultaneamente
- Aplicar regras antifraude
- Detectar possíveis fraudes
- Gerar relatórios automáticos

# Base de Dados de Transações

O projeto utiliza um arquivo CSV contendo transações financeiras sintéticas da base **IBM Transactions**.
esse banco de transações possui cerca de 5 milhões de transações

A estrutura das transações possui informações como:

- data e hora da transação
- banco de origem
- conta de origem
- banco de destino
- conta de destino
- valor recebido
- moeda recebida
- valor pago
- moeda paga
- formato do pagamento
- indicação original de lavagem de dinheiro

<img width="1920" height="1040" alt="HI-Small_Trans csv - Visual Studio Code 27_05_2026 19_33_17" src="https://github.com/user-attachments/assets/06729cb5-12aa-430f-894b-f75a13193eb9" />

## Processamento Sequencial (Serial)

Nesta etapa, o sistema executou a análise das transações utilizando apenas uma única thread, processando os registros de forma sequencial, sem divisão de tarefas.

### Resultado Obtido

<img width="1600" height="858" alt="Processamento Paralelo" src="https://github.com/user-attachments/assets/e3f4db38-4e44-40a1-93f1-d09142fee53f" />

### Análise do Resultado

O processamento sequencial analisou um total de **176.066.557 transações**, identificando **26.085.242 transações suspeitas**.

O tempo total de execução foi de **243 segundos** (aproximadamente **4 minutos e 3 segundos**), demonstrando o alto custo computacional de processar grandes volumes de dados utilizando apenas uma thread.

Este resultado será utilizado como base de comparação para avaliar os ganhos de desempenho obtidos através da implementação do processamento concorrente e distribuído.

#### Resumo

* Total de transações analisadas: **176.066.557**
* Total de suspeitas encontradas: **26.085.242**
* Tempo total de execução: **243 segundos**
* Modelo de execução: **Sequencial (1 Thread)**


# Funcionalidades Previstas

O sistema será responsável por:

- Ler arquivos CSV de grande volume
- Processar milhares ou milhões de registros
- Dividir o processamento em tarefas concorrentes
- Aplicar regras de detecção antifraude
- Identificar transações suspeitas
- Gerar relatórios automáticos com os resultados
- Comparar o desempenho entre processamento sequencial e concorrente

# Regras Anti Fraude

As possíveis fraudes serão identificadas com base em regras como:

- Transações com valor muito alto
- Muitas transações em um curto intervalo de tempo
- Tentativas repetidas de operação
- Transações realizadas em horários suspeitos
- Padrões anormais de comportamento
- Transferências sequenciais suspeitas
- Movimentações incompatíveis com o padrão da conta

# Tecnologias Utilizadas

As tecnologias ainda serão definidas durante o desenvolvimento do projeto.

Sugestão inicial:

- Manipulação de arquivos CSV
- Programação com Threads
- ExecutorService
- Coleções concorrentes
- Geração de relatórios em CSV ou TXT

# Estrutura do Projeto
A definir

Como o Sistema Funcionará

O fluxo principal do sistema será:

- O sistema carrega o arquivo CSV com as transações.
- As transações são divididas em blocos menores.
- Cada bloco é processado de forma concorrente.
- As regras antifraude são aplicadas em cada transação.
- As transações suspeitas são armazenadas.
- Um relatório final é gerado com os dados encontrados.
- O tempo de execução é exibido para análise de desempenho.

# Resultado Esperado

Ao final do processamento, o sistema deverá gerar um relatório contendo as transações classificadas como suspeitas, além de informações como:

- Quantidade total de transações analisadas
- Quantidade de possíveis fraudes encontradas
- Regras que identificaram cada suspeita
- Tempo total de processamento
- Comparação entre processamento sequencial e concorrente
