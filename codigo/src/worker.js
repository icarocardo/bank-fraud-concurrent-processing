const fs = require('fs');
const { parentPort, workerData } = require('worker_threads');

function lerInteiroPositivo(valor, padrao) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : padrao;
}

const HIGH_WATER_MARK =
  1024 * 1024 * lerInteiroPositivo(process.env.WORKER_BUFFER_MB, 64);

function processarArquivo({ id, inputFile, inicio, fim, pularCabecalho }) {
  const enviarResultado = parentPort
    ? parentPort.postMessage.bind(parentPort)
    : process.send.bind(process);

  let totalTransacoes = 0;
  let totalSuspeitas = 0;
  let primeiraLinha = pularCabecalho;
  let pendente = '';

  function processarTexto(texto, fimDoArquivo = false) {
    let inicioLinha = 0;

    while (inicioLinha < texto.length) {
      let fimLinha = texto.indexOf('\n', inicioLinha);

      if (fimLinha === -1) {
        if (!fimDoArquivo) break;
        fimLinha = texto.length;
      }

      let fimReal = fimLinha;
      if (fimReal > inicioLinha && texto.charCodeAt(fimReal - 1) === 13) {
        fimReal--;
      }

      if (primeiraLinha) {
        primeiraLinha = false;
        inicioLinha = fimLinha + 1;
        continue;
      }

      if (fimReal > inicioLinha) {
        const c0 = texto.indexOf(',', inicioLinha);
        const c1 = c0 < 0 || c0 > fimReal ? -1 : texto.indexOf(',', c0 + 1);
        const c2 = c1 < 0 || c1 > fimReal ? -1 : texto.indexOf(',', c1 + 1);
        const c3 = c2 < 0 || c2 > fimReal ? -1 : texto.indexOf(',', c2 + 1);
        const c4 = c3 < 0 || c3 > fimReal ? -1 : texto.indexOf(',', c3 + 1);
        const c5 = c4 < 0 || c4 > fimReal ? -1 : texto.indexOf(',', c4 + 1);
        const c6 = c5 < 0 || c5 > fimReal ? -1 : texto.indexOf(',', c5 + 1);
        const c7 = c6 < 0 || c6 > fimReal ? -1 : texto.indexOf(',', c6 + 1);
        const c8 = c7 < 0 || c7 > fimReal ? -1 : texto.indexOf(',', c7 + 1);

        if (c8 >= 0 && c8 <= fimReal) {
          let c9 = texto.indexOf(',', c8 + 1);
          if (c9 < 0 || c9 > fimReal) c9 = fimReal;

          totalTransacoes++;

          let inteiro = 0;
          let decimal = 0;
          let casasDecimais = -1;

          for (let i = c6 + 1; i < c7; i++) {
            const codigo = texto.charCodeAt(i);

            if (codigo === 46) {
              if (casasDecimais === -1) casasDecimais = 0;
            } else if (codigo >= 48 && codigo <= 57) {
              const digito = codigo - 48;

              if (casasDecimais === -1) {
                inteiro = inteiro * 10 + digito;
              } else if (casasDecimais < 2) {
                decimal = decimal * 10 + digito;
                casasDecimais++;
              }
            }
          }

          let amountPaid = inteiro * 100 + decimal;
          if (casasDecimais === 0) {
            amountPaid = inteiro * 100;
          } else if (casasDecimais === 1) {
            amountPaid = inteiro * 100 + decimal * 10;
          }

          let suspeita = amountPaid >= 10000000;

          if (!suspeita) {
            inteiro = 0;
            decimal = 0;
            casasDecimais = -1;

            for (let i = c4 + 1; i < c5; i++) {
              const codigo = texto.charCodeAt(i);

              if (codigo === 46) {
                if (casasDecimais === -1) casasDecimais = 0;
              } else if (codigo >= 48 && codigo <= 57) {
                const digito = codigo - 48;

                if (casasDecimais === -1) {
                  inteiro = inteiro * 10 + digito;
                } else if (casasDecimais < 2) {
                  decimal = decimal * 10 + digito;
                  casasDecimais++;
                }
              }
            }

            let amountReceived = inteiro * 100 + decimal;
            if (casasDecimais === 0) {
              amountReceived = inteiro * 100;
            } else if (casasDecimais === 1) {
              amountReceived = inteiro * 100 + decimal * 10;
            }

            if (amountPaid !== amountReceived) {
              suspeita = true;
            } else if (amountPaid >= 5000000) {
              const fromBankInicio = c0 + 1;
              const fromBankFim = c1;
              const toBankInicio = c2 + 1;
              const toBankFim = c3;
              const tamanhoBanco = fromBankFim - fromBankInicio;
              let mesmosBancos = tamanhoBanco === toBankFim - toBankInicio;

              for (let i = 0; mesmosBancos && i < tamanhoBanco; i++) {
                if (
                  texto.charCodeAt(fromBankInicio + i) !==
                  texto.charCodeAt(toBankInicio + i)
                ) {
                  mesmosBancos = false;
                }
              }

              suspeita =
                !mesmosBancos ||
                (c9 - c8 === 7 && texto.startsWith('Cheque', c8 + 1));
            }
          }

          if (suspeita) totalSuspeitas++;
        }
      }

      inicioLinha = fimLinha + 1;
    }

    pendente = inicioLinha < texto.length ? texto.slice(inicioLinha) : '';
  }

  const stream = fs.createReadStream(inputFile, {
    start: inicio,
    end: fim - 1,
    highWaterMark: HIGH_WATER_MARK,
    encoding: 'latin1',
  });

  stream.on('data', (chunk) => {
    if (pendente.length > 0) {
      chunk = pendente + chunk;
      pendente = '';
    }

    processarTexto(chunk);
  });

  stream.on('end', () => {
    if (pendente.length > 0) {
      processarTexto(pendente, true);
    }

    enviarResultado({
      id,
      totalTransacoes,
      totalSuspeitas,
    });
  });

  stream.on('error', () => {
    enviarResultado({
      id,
      totalTransacoes: 0,
      totalSuspeitas: 0,
    });
  });
}

if (parentPort) {
  processarArquivo(workerData);
} else {
  process.on('message', (dados) => {
    processarArquivo(dados);
  });
}
