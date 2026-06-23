using System.Buffers;
using System.Diagnostics;
using System.Globalization;

const byte Virgula = (byte)',';
const byte QuebraLinha = (byte)'\n';
const byte RetornoCarro = (byte)'\r';
const byte Ponto = (byte)'.';
const byte Zero = (byte)'0';
const byte Nove = (byte)'9';

var baseDir = AppContext.BaseDirectory;
var repoDir = Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", ".."));
var defaultInputFile = Path.Combine(repoDir, "data", "LI-Large_Trans.csv");
var fallbackInputFile = Path.Combine(repoDir, "..", "data", "LI-Large_Trans.csv");
var inputFile = args.Length >= 2
  ? Path.GetFullPath(args[1])
  : File.Exists(defaultInputFile)
    ? defaultInputFile
    : fallbackInputFile;
var workers = LerInteiroPositivo(args.Length >= 1 ? args[0] : null, 12);

if (!File.Exists(inputFile))
{
  Console.Error.WriteLine($"Arquivo nao encontrado: {inputFile}");
  Environment.Exit(1);
}

var relogio = Stopwatch.StartNew();
var faixas = CriarFaixas(inputFile, workers);
long totalTransacoes = 0;
long totalSuspeitas = 0;

Console.WriteLine($"Iniciando processamento nativo com {faixas.Count} faixas e {workers} threads...");

Parallel.ForEach(
  faixas,
  new ParallelOptions { MaxDegreeOfParallelism = workers },
  faixa =>
  {
    var resultado = ProcessarFaixa(inputFile, faixa);

    Interlocked.Add(ref totalTransacoes, resultado.TotalTransacoes);
    Interlocked.Add(ref totalSuspeitas, resultado.TotalSuspeitas);

    Console.WriteLine(
      $"Faixa {faixa.Id} finalizada | Transacoes: {resultado.TotalTransacoes.ToString("N0", CultureInfo.GetCultureInfo("pt-BR"))} | Tempo: {(int)relogio.Elapsed.TotalSeconds}s"
    );
  }
);

relogio.Stop();

Console.WriteLine($"Tempo nativo: {relogio.Elapsed}");
Console.WriteLine("Processamento nativo finalizado!");
Console.WriteLine($"Faixas processadas: {faixas.Count}");
Console.WriteLine($"Threads simultaneas: {workers}");
Console.WriteLine($"Total de transacoes: {totalTransacoes.ToString("N0", CultureInfo.GetCultureInfo("pt-BR"))}");
Console.WriteLine($"Total de suspeitas: {totalSuspeitas.ToString("N0", CultureInfo.GetCultureInfo("pt-BR"))}");
Console.WriteLine($"Tempo total em segundos: {(int)relogio.Elapsed.TotalSeconds}");

static int LerInteiroPositivo(string? valor, int padrao)
{
  return int.TryParse(valor, out var numero) && numero > 0 ? numero : padrao;
}

static List<Faixa> CriarFaixas(string inputFile, int workers)
{
  var tamanhoArquivo = new FileInfo(inputFile).Length;
  var limites = new SortedSet<long> { 0, tamanhoArquivo };

  using var stream = new FileStream(
    inputFile,
    FileMode.Open,
    FileAccess.Read,
    FileShare.Read,
    1024 * 1024,
    FileOptions.SequentialScan
  );

  for (var i = 1; i < workers; i++)
  {
    var alvo = tamanhoArquivo * i / workers;
    limites.Add(EncontrarProximaQuebraDeLinha(stream, alvo, tamanhoArquivo));
  }

  var ordenados = limites.ToArray();
  var faixas = new List<Faixa>(ordenados.Length - 1);

  for (var i = 0; i < ordenados.Length - 1; i++)
  {
    if (ordenados[i] >= ordenados[i + 1]) continue;

    faixas.Add(
      new Faixa(
        faixas.Count + 1,
        ordenados[i],
        ordenados[i + 1],
        ordenados[i] == 0
      )
    );
  }

  return faixas;
}

static long EncontrarProximaQuebraDeLinha(FileStream stream, long posicaoInicial, long tamanhoArquivo)
{
  if (posicaoInicial <= 0) return 0;
  if (posicaoInicial >= tamanhoArquivo) return tamanhoArquivo;

  var buffer = ArrayPool<byte>.Shared.Rent(1024 * 1024);

  try
  {
    var posicao = posicaoInicial;

    while (posicao < tamanhoArquivo)
    {
      stream.Position = posicao;

      var bytesParaLer = (int)Math.Min(buffer.Length, tamanhoArquivo - posicao);
      var bytesLidos = stream.Read(buffer, 0, bytesParaLer);

      if (bytesLidos == 0) break;

      var indice = buffer.AsSpan(0, bytesLidos).IndexOf(QuebraLinha);
      if (indice >= 0) return posicao + indice + 1;

      posicao += bytesLidos;
    }

    return tamanhoArquivo;
  }
  finally
  {
    ArrayPool<byte>.Shared.Return(buffer);
  }
}

static Resultado ProcessarFaixa(string inputFile, Faixa faixa)
{
  const int tamanhoBuffer = 1024 * 1024 * 64;

  var buffer = ArrayPool<byte>.Shared.Rent(tamanhoBuffer);
  byte[]? pendente = null;
  var pendenteTamanho = 0;

  long totalTransacoes = 0;
  long totalSuspeitas = 0;
  var primeiraLinha = faixa.PularCabecalho;

  try
  {
    using var stream = new FileStream(
      inputFile,
      FileMode.Open,
      FileAccess.Read,
      FileShare.Read,
      tamanhoBuffer,
      FileOptions.SequentialScan
    );

    stream.Position = faixa.Inicio;
    var bytesRestantes = faixa.Fim - faixa.Inicio;

    while (bytesRestantes > 0)
    {
      var bytesParaLer = (int)Math.Min(buffer.Length, bytesRestantes);
      var bytesLidos = stream.Read(buffer, 0, bytesParaLer);

      if (bytesLidos == 0) break;

      bytesRestantes -= bytesLidos;

      var span = buffer.AsSpan(0, bytesLidos);
      var inicioLinha = 0;

      if (pendenteTamanho > 0)
      {
        var fimPendente = span.IndexOf(QuebraLinha);

        if (fimPendente < 0)
        {
          pendente = AcrescentarPendente(pendente, pendenteTamanho, span);
          pendenteTamanho += span.Length;
          continue;
        }

        var linha = ArrayPool<byte>.Shared.Rent(pendenteTamanho + fimPendente);

        try
        {
          pendente!.AsSpan(0, pendenteTamanho).CopyTo(linha);
          span.Slice(0, fimPendente).CopyTo(linha.AsSpan(pendenteTamanho));

          ProcessarLinha(
            linha.AsSpan(0, pendenteTamanho + fimPendente),
            ref primeiraLinha,
            ref totalTransacoes,
            ref totalSuspeitas
          );
        }
        finally
        {
          ArrayPool<byte>.Shared.Return(linha);
        }

        pendenteTamanho = 0;
        inicioLinha = fimPendente + 1;
      }

      while (inicioLinha < span.Length)
      {
        var resto = span.Slice(inicioLinha);
        var fimLinhaRelativo = resto.IndexOf(QuebraLinha);

        if (fimLinhaRelativo < 0) break;

        ProcessarLinha(
          resto.Slice(0, fimLinhaRelativo),
          ref primeiraLinha,
          ref totalTransacoes,
          ref totalSuspeitas
        );

        inicioLinha += fimLinhaRelativo + 1;
      }

      if (inicioLinha < span.Length)
      {
        pendenteTamanho = span.Length - inicioLinha;
        pendente ??= ArrayPool<byte>.Shared.Rent(Math.Max(1024, pendenteTamanho));

        if (pendente.Length < pendenteTamanho)
        {
          ArrayPool<byte>.Shared.Return(pendente);
          pendente = ArrayPool<byte>.Shared.Rent(pendenteTamanho);
        }

        span.Slice(inicioLinha).CopyTo(pendente);
      }
    }

    if (pendenteTamanho > 0)
    {
      ProcessarLinha(
        pendente!.AsSpan(0, pendenteTamanho),
        ref primeiraLinha,
        ref totalTransacoes,
        ref totalSuspeitas
      );
    }

    return new Resultado(totalTransacoes, totalSuspeitas);
  }
  finally
  {
    ArrayPool<byte>.Shared.Return(buffer);
    if (pendente is not null) ArrayPool<byte>.Shared.Return(pendente);
  }
}

static byte[] AcrescentarPendente(byte[]? pendente, int pendenteTamanho, ReadOnlySpan<byte> dados)
{
  var novoTamanho = pendenteTamanho + dados.Length;

  if (pendente is null || pendente.Length < novoTamanho)
  {
    var novo = ArrayPool<byte>.Shared.Rent(novoTamanho);
    if (pendente is not null)
    {
      pendente.AsSpan(0, pendenteTamanho).CopyTo(novo);
      ArrayPool<byte>.Shared.Return(pendente);
    }

    pendente = novo;
  }

  dados.CopyTo(pendente.AsSpan(pendenteTamanho));
  return pendente;
}

static void ProcessarLinha(
  ReadOnlySpan<byte> linha,
  ref bool primeiraLinha,
  ref long totalTransacoes,
  ref long totalSuspeitas
)
{
  if (linha.Length > 0 && linha[^1] == RetornoCarro) linha = linha[..^1];
  if (linha.Length == 0) return;

  if (primeiraLinha)
  {
    primeiraLinha = false;
    return;
  }

  var c0 = ProximaVirgula(linha, 0);
  var c1 = ProximaVirgula(linha, c0 + 1);
  var c2 = ProximaVirgula(linha, c1 + 1);
  var c3 = ProximaVirgula(linha, c2 + 1);
  var c4 = ProximaVirgula(linha, c3 + 1);
  var c5 = ProximaVirgula(linha, c4 + 1);
  var c6 = ProximaVirgula(linha, c5 + 1);
  var c7 = ProximaVirgula(linha, c6 + 1);
  var c8 = ProximaVirgula(linha, c7 + 1);

  if ((c0 | c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8) < 0) return;

  var c9 = ProximaVirgula(linha, c8 + 1);
  if (c9 < 0) c9 = linha.Length;

  totalTransacoes++;

  var amountPaid = ValorEmCentavos(linha[(c6 + 1)..c7]);

  if (amountPaid >= 10000000)
  {
    totalSuspeitas++;
    return;
  }

  var amountReceived = ValorEmCentavos(linha[(c4 + 1)..c5]);

  if (amountPaid != amountReceived)
  {
    totalSuspeitas++;
    return;
  }

  if (amountPaid < 5000000) return;

  if (
    !linha[(c0 + 1)..c1].SequenceEqual(linha[(c2 + 1)..c3]) ||
    EhCheque(linha[(c8 + 1)..c9])
  )
  {
    totalSuspeitas++;
  }
}

static int ProximaVirgula(ReadOnlySpan<byte> linha, int inicio)
{
  if ((uint)inicio >= (uint)linha.Length) return -1;

  var indice = linha[inicio..].IndexOf(Virgula);
  return indice < 0 ? -1 : inicio + indice;
}

static long ValorEmCentavos(ReadOnlySpan<byte> valor)
{
  long inteiro = 0;
  long decimalParte = 0;
  var casasDecimais = -1;

  for (var i = 0; i < valor.Length; i++)
  {
    var b = valor[i];

    if (b == Ponto)
    {
      if (casasDecimais == -1) casasDecimais = 0;
      continue;
    }

    if (b < Zero || b > Nove) continue;

    var digito = b - Zero;

    if (casasDecimais == -1)
    {
      inteiro = inteiro * 10 + digito;
    }
    else if (casasDecimais < 2)
    {
      decimalParte = decimalParte * 10 + digito;
      casasDecimais++;
    }
  }

  if (casasDecimais == 0) return inteiro * 100;
  if (casasDecimais == 1) return inteiro * 100 + decimalParte * 10;

  return inteiro * 100 + decimalParte;
}

static bool EhCheque(ReadOnlySpan<byte> valor)
{
  return
    valor.Length == 6 &&
    valor[0] == (byte)'C' &&
    valor[1] == (byte)'h' &&
    valor[2] == (byte)'e' &&
    valor[3] == (byte)'q' &&
    valor[4] == (byte)'u' &&
    valor[5] == (byte)'e';
}

readonly record struct Faixa(int Id, long Inicio, long Fim, bool PularCabecalho);
readonly record struct Resultado(long TotalTransacoes, long TotalSuspeitas);
