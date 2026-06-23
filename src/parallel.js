const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');

const inputFile = path.join(__dirname, '..', 'data', 'LI-Large_Trans.csv');
const workerFile = path.join(__dirname, 'worker.js');

function lerInteiroPositivo(valor, padrao) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : padrao;
}

const NUM_WORKERS = lerInteiroPositivo(process.argv[2], 8);
const TAMANHO_BUFFER_BUSCA = 1024 * 1024;

let totalTransacoes = 0;
let totalSuspeitas = 0;
let processosFinalizados = 0;
let encerrandoWorkers = false;

const inicio = Date.now();
const workers = [];

function encontrarProximaQuebraDeLinha(fd, posicaoInicial, tamanhoArquivo) {
  if (posicaoInicial <= 0) return 0;
  if (posicaoInicial >= tamanhoArquivo) return tamanhoArquivo;

  const buffer = Buffer.allocUnsafe(TAMANHO_BUFFER_BUSCA);
  let posicao = posicaoInicial;

  while (posicao < tamanhoArquivo) {
    const bytesParaLer = Math.min(buffer.length, tamanhoArquivo - posicao);
    const bytesLidos = fs.readSync(fd, buffer, 0, bytesParaLer, posicao);

    if (bytesLidos === 0) break;

    const indiceQuebra = buffer.subarray(0, bytesLidos).indexOf(10);

    if (indiceQuebra !== -1 && indiceQuebra < bytesLidos) {
      return posicao + indiceQuebra + 1;
    }

    posicao += bytesLidos;
  }

  return tamanhoArquivo;
}

function criarFaixasDoArquivo() {
  const tamanhoArquivo = fs.statSync(inputFile).size;
  const fd = fs.openSync(inputFile, 'r');
  const limites = new Set([0, tamanhoArquivo]);

  try {
    for (let i = 1; i < NUM_WORKERS; i++) {
      const alvo = Math.floor((tamanhoArquivo * i) / NUM_WORKERS);
      limites.add(encontrarProximaQuebraDeLinha(fd, alvo, tamanhoArquivo));
    }
  } finally {
    fs.closeSync(fd);
  }

  const limitesOrdenados = [...limites].sort((a, b) => a - b);
  const faixas = [];

  for (let i = 0; i < limitesOrdenados.length - 1; i++) {
    const inicioFaixa = limitesOrdenados[i];
    const fimFaixa = limitesOrdenados[i + 1];

    if (inicioFaixa < fimFaixa) {
      faixas.push({
        id: faixas.length + 1,
        inicio: inicioFaixa,
        fim: fimFaixa,
        pularCabecalho: inicioFaixa === 0,
      });
    }
  }

  return faixas;
}

function verificarFim(totalProcessos) {
  if (processosFinalizados !== totalProcessos) return;

  const segundos = Math.floor((Date.now() - inicio) / 1000);

  console.timeEnd('Tempo paralelo');
  console.log('Processamento paralelo finalizado!');
  console.log('Faixas processadas:', totalProcessos);
  console.log('Processos simultaneos:', totalProcessos);
  console.log('Total de transacoes:', totalTransacoes.toLocaleString('pt-BR'));
  console.log('Total de suspeitas:', totalSuspeitas.toLocaleString('pt-BR'));
  console.log('Tempo total em segundos:', segundos);

  encerrandoWorkers = true;

  for (const worker of workers) {
    worker.terminate();
  }
}

function criarWorkers() {
  const faixas = criarFaixasDoArquivo();

  console.time('Tempo paralelo');
  console.log(
    `Iniciando processamento paralelo com ${faixas.length} processos simultaneos...`
  );

  for (const faixa of faixas) {
    const worker = new Worker(workerFile, {
      workerData: {
        ...faixa,
        inputFile,
      },
    });

    worker.on('message', (resultado) => {
      totalTransacoes += resultado.totalTransacoes;
      totalSuspeitas += resultado.totalSuspeitas;
      processosFinalizados++;
      worker.finalizado = true;

      const segundos = Math.floor((Date.now() - inicio) / 1000);
      console.log(
        `Faixa ${resultado.id} finalizada | Transacoes: ${resultado.totalTransacoes.toLocaleString('pt-BR')} | Tempo: ${segundos}s`
      );

      worker.terminate();

      verificarFim(faixas.length);
    });

    worker.on('error', (error) => {
      console.error('Erro real no processo worker:');
      console.error(error);
    });

    worker.on('exit', (code) => {
      if (!encerrandoWorkers && !worker.finalizado && code !== 0) {
        console.error(`Processo worker finalizou com erro. Codigo: ${code}`);
      }
    });

    workers.push(worker);
  }
}

criarWorkers();
