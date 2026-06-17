Bank Fraud Concurrent Processing

Sistema de processamento concorrente e distribuído para análise de possíveis fraudes bancárias em arquivos CSV de grande volume.

O projeto foi desenvolvido para demonstrar, na prática, o uso de Programação Concorrente, Processamento Paralelo e Processamento Distribuído, utilizando milhões de transações financeiras como estudo de caso.

Objetivos

O objetivo principal é construir uma aplicação capaz de processar grandes volumes de transações financeiras utilizando múltiplas threads, reduzindo significativamente o tempo de execução em comparação ao processamento sequencial.

Durante o processamento, o sistema aplica regras antifraude para identificar comportamentos suspeitos e gerar estatísticas de desempenho.

Conceitos Aplicados
Processamento Sequencial
Processamento Paralelo
Programação Concorrente
Worker Threads
Divisão de tarefas (Task Partitioning)
Processamento de arquivos CSV
Benchmark de desempenho
Escalabilidade
Comparação entre implementação JavaScript e C#
Importância

Instituições financeiras processam milhões de transações diariamente.

Executar essa análise utilizando apenas uma thread torna o processamento lento e pouco escalável.

A programação concorrente permite dividir a carga de trabalho entre vários núcleos do processador, reduzindo o tempo de execução e aumentando a capacidade de processamento.

Esse projeto demonstra exatamente esse cenário utilizando uma base de milhões de registros.

Base de Dados

O projeto utiliza um conjunto de dados sintético baseado na base IBM Transactions.

A base utilizada possui aproximadamente:

5 milhões de transações

Cada registro contém informações como:

Data e hora
Banco de origem
Conta de origem
Banco de destino
Conta de destino
Valor recebido
Moeda recebida
Valor pago
Moeda paga
Tipo de pagamento
Indicador de lavagem de dinheiro

Funcionamento

O processamento ocorre em cinco etapas:

Leitura do arquivo CSV.
Divisão das transações entre múltiplas threads.
Aplicação das regras antifraude.
Consolidação dos resultados.
Geração do relatório final.
Regras Antifraude

As transações são analisadas utilizando regras como:

Transações com valores elevados
Muitas operações em curto intervalo de tempo
Tentativas repetidas
Operações realizadas durante horários incomuns
Transferências sequenciais
Padrões anormais de movimentação
Comportamento incompatível com o histórico da conta
Processamento Sequencial

Na versão sequencial, todo o processamento é realizado utilizando apenas uma thread.

Resultado
Transações analisadas: 176.066.557
Suspeitas encontradas: 26.085.242
Tempo de execução: 243 segundos

(imagem do processamento serial)

Processamento Paralelo

Na versão concorrente, o processamento é dividido entre múltiplas threads utilizando Worker Threads.

Cada worker processa uma parte independente do arquivo.

Após a conclusão, os resultados são consolidados.

| Threads |      Tempo  (s) | Speedup Esperado |
|:-------:|----------------:|-----------------:|
| 1       | 243,0           | 1,00x            |
| 2       | 121,5           | 1,7–1,9x         |
| 4       | 60,8            | 3,2–3,8x         |
| 8       | 30,4            | 4,8–7,0x         |
| 12      | 20,3            | 7,0–11,0x        |
Resultados Obtidos

Os testes demonstram uma redução significativa no tempo de processamento à medida que aumenta a quantidade de threads.

O ganho de desempenho evidencia os benefícios da programação concorrente para aplicações que manipulam grandes volumes de dados.

Destaques
Mais de 176 milhões de registros analisados
Aproximadamente 26 milhões de transações suspeitas identificadas
Redução significativa do tempo de execução
Comparação entre execução sequencial e paralela
Avaliação de escalabilidade utilizando múltiplas threads
Tecnologias Utilizadas
Linguagens
JavaScript (Node.js)
C# (.NET 8)
Bibliotecas
Worker Threads
csv-parser
Ferramentas
PowerShell
Visual Studio Code
Git
GitHub
Estrutura do Projeto
Bank-Fraud-Concurrent-Processing
│
├── dataset/
│
├── javascript/
│   ├── serial/
│   └── parallel/
│
├── csharp/
│
├── outputs/
│
├── benchmarks/
│
└── README.md
Funcionalidades
Leitura de arquivos CSV
Processamento de milhões de registros
Execução sequencial
Execução paralela
Divisão automática das tarefas
Detecção de possíveis fraudes
Benchmark de desempenho
Geração de relatórios
