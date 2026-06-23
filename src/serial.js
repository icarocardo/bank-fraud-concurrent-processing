const fs = require('fs');
const path = require('path');
const readline = require('readline');

const inputFile = path.join(__dirname, '..', 'data', 'LI-Large_Trans.csv');

let totalTransacoes = 0;
let totalSuspeitas = 0;

const inicio = Date.now();

console.time('Tempo serial');

const fileStream = fs.createReadStream(inputFile, {
  highWaterMark: 1024 * 1024 * 8,
});

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

let primeiraLinha = true;

rl.on('line', (line) => {
  if (primeiraLinha) {
    primeiraLinha = false;
    return;
  }

  totalTransacoes++;

  const colunas = line.split(',');

  if (colunas.length < 10) {
    return;
  }

  const fromBank = colunas[1];
  const toBank = colunas[3];

  const amountReceived = Number(colunas[5]);
  const amountPaid = Number(colunas[7]);

  const paymentFormat = colunas[9];

  let suspeita = false;

  if (amountPaid >= 100000) {
    suspeita = true;
  } else if (amountPaid !== amountReceived) {
    suspeita = true;
  } else if (fromBank !== toBank && amountPaid >= 50000) {
    suspeita = true;
  } else if (paymentFormat === 'Cheque' && amountPaid >= 50000) {
    suspeita = true;
  }

  if (suspeita) {
    totalSuspeitas++;
  }

  if (totalTransacoes % 1000000 === 0) {
    const segundos = Math.floor((Date.now() - inicio) / 1000);

    console.log(
      `Processadas: ${totalTransacoes.toLocaleString('pt-BR')} | Tempo: ${segundos}s`
    );
  }
});

rl.on('close', () => {
  const segundos = Math.floor((Date.now() - inicio) / 1000);

  console.timeEnd('Tempo serial');
  console.log('Processamento serial finalizado!');
  console.log('Total de transações:', totalTransacoes.toLocaleString('pt-BR'));
  console.log('Total de suspeitas:', totalSuspeitas.toLocaleString('pt-BR'));
  console.log('Tempo total em segundos:', segundos);
});

rl.on('error', (error) => {
  console.error('Erro ao processar arquivo:', error.message);
});