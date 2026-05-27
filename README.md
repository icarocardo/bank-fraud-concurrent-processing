# Bank Fraud Concurrent Processing 

Sistema de processamento concorrente e distribuído para análise de possíveis fraudes bancárias em arquivos de grande volume.

# Objetivo 

Este projeto tem como objetivo aplicar conceitos de Programação Concorrente e Distribuída em um cenário de antifraude bancária.

O sistema será responsável por: 

- Ler arquivos grandes de transações bancárias
- Processar milhares de registros simultaneamente
- Aplicar regras antifraude
- Detectar possíveis fraudes
- Gerar relatórios automáticos

# Base de Dados de Transações

O projeto utiliza um arquivo CSV contendo transações financeiras sintéticas da base **IBM Transactions**.

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
- 
<img width="1920" height="1040" alt="HI-Small_Trans csv - Visual Studio Code 27_05_2026 19_33_17" src="https://github.com/user-attachments/assets/06729cb5-12aa-430f-894b-f75a13193eb9" />



# Regras Anti Fraude

O sistema detecta possíveis fraudes utilizando regras:

- Transações com valor muito alto
- Muitas transações em pouco tempo
- Tentativas repetidas de operação
- Horários suspeito
- Padrões anormais de comportamento
- Transferências sequenciais suspeitas

# Tecnologias 

A definir

# Estrutura do Projeto

A definir


