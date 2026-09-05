import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  lancamentoCompra,
  lancamentoEstorno,
  lancamentoRecarga,
  saldoEmCustodia,
  CONTAS,
} from '@/domain/ledger';
import {
  avaliarPagamento,
  gastoNoDia,
  podeEstornar,
  validarRecarga,
} from '@/domain/regras';
import type {
  Cartao,
  SolicitacaoConta,
  Cobranca,
  Conta,
  Loja,
  LojaId,
  Notificacao,
  Sessao,
  Transacao,
  Usuario,
} from '@/domain/types';
import { diaSP, formatarReais, mesSP } from '@/lib/format';
import { codigoNumerico, id } from '@/lib/id';
import { ErroApi, type Api, type FiltrosExtrato } from '../types';
import { atraso, db, persistir, reiniciar } from './db';
import { CODIGOS_VINCULO, hash, LOJAS, type EstadoMock } from './seed';

const CHAVE_SESSAO = 'farroupspay:sessao:v1';

/**
 * Sessão por inatividade: cada uso renova, doze horas parado derruba.
 *
 * Eram quinze minutos absolutos — mas nada conferia o prazo e não existe
 * renovação por refresh token, então na prática a sessão era eterna. Quinze
 * minutos de verdade expulsariam o usuário no meio do recreio; doze horas de
 * inatividade fecham a janela do aparelho perdido sem atrapalhar o uso diário.
 * No backend real isso vira access token curto + rotação de refresh token.
 */
const INATIVIDADE_ATE_EXPIRAR_MS = 12 * 60 * 60 * 1000;

function loja(lojaId: LojaId | undefined): Loja | undefined {
  return LOJAS.find((l) => l.id === lojaId);
}

function contaDoAluno(estado: EstadoMock, alunoId: string): Conta {
  const conta = estado.contas.find((c) => c.alunoId === alunoId);
  if (!conta) throw new ErroApi('Conta não encontrada.', 'conta_nao_encontrada');
  return conta;
}

function cartaoAtivo(estado: EstadoMock, contaId: string): Cartao | null {
  return estado.cartoes.find((c) => c.contaId === contaId && c.ativo) ?? null;
}

function alunoDaConta(estado: EstadoMock, contaId: string) {
  const conta = estado.contas.find((c) => c.id === contaId);
  return estado.alunos.find((a) => a.id === conta?.alunoId);
}

function notificar(
  estado: EstadoMock,
  usuarioId: string,
  titulo: string,
  corpo: string,
  transacaoId?: string,
) {
  const n: Notificacao = {
    id: id('ntf'),
    usuarioId,
    titulo,
    corpo,
    criadaEm: new Date().toISOString(),
    lida: false,
    transacaoId,
  };
  estado.notificacoes.unshift(n);
}

/** Aplica as preferências do responsável antes de disparar o push. */
function notificarResponsaveis(estado: EstadoMock, transacao: Transacao) {
  const aluno = alunoDaConta(estado, transacao.contaId);
  if (!aluno) return;
  for (const responsavelId of aluno.responsavelIds) {
    const usuario = estado.usuarios.find((u) => u.id === responsavelId);
    if (!usuario) continue;
    const prefs = usuario.notificacoes;
    if (transacao.tipo === 'credito') {
      if (prefs.recargas) {
        notificar(
          estado,
          usuario.id,
          'Recarga confirmada',
          `${formatarReais(transacao.valorCentavos)} adicionados na conta de ${aluno.nome.split(' ')[0]}.`,
          transacao.id,
        );
      }
      continue;
    }
    if (prefs.modo === 'nenhuma' || prefs.modo === 'resumo_diario') continue;
    if (prefs.modo === 'acima_de' && transacao.valorCentavos < prefs.acimaDeCentavos) continue;
    notificar(
      estado,
      usuario.id,
      transacao.tipo === 'estorno' ? 'Compra estornada' : 'Nova compra',
      `${aluno.nome.split(' ')[0]} — ${transacao.descricao} · ${formatarReais(transacao.valorCentavos)}`,
      transacao.id,
    );
  }
}

/** Teto absoluto de recargas automáticas por dia, mesmo que a conta peça mais. */
const MAXIMO_RECARGAS_AUTOMATICAS_DIA = 3;

/**
 * Recarga automática: dispara quando o saldo cai abaixo do gatilho.
 *
 * Cada disparo é dinheiro saindo do cartão do responsável, então o número de
 * disparos por dia é limitado. Sem esse teto, um gatilho mal configurado — ou
 * uma fraude com o cartão físico do aluno — vira uma sequência de cobranças
 * sem fim, e o responsável só descobre na fatura.
 */
function talvezRecarregar(estado: EstadoMock, conta: Conta) {
  const config = conta.recargaAutomatica;
  if (!config?.ativa) return;
  if (conta.saldoCentavos >= config.gatilhoCentavos) return;

  const hoje = diaSP(new Date().toISOString());
  const jaHoje = estado.transacoes.filter(
    (t) =>
      t.contaId === conta.id &&
      t.tipo === 'credito' &&
      t.descricao === 'Recarga automática via Pix' &&
      diaSP(t.criadaEm) === hoje,
  ).length;
  const teto = Math.min(
    config.maximoPorDia ?? MAXIMO_RECARGAS_AUTOMATICAS_DIA,
    MAXIMO_RECARGAS_AUTOMATICAS_DIA,
  );
  if (jaHoje >= teto) {
    const responsavel = estado.usuarios.find((u) =>
      u.alunosIds?.includes(conta.alunoId),
    );
    if (responsavel) {
      notificar(
        estado,
        responsavel.id,
        'Recarga automática pausada',
        `O limite de ${teto} recargas automáticas de hoje foi atingido. Recarregue manualmente se precisar.`,
      );
    }
    return;
  }

  const transacaoId = id('trx');
  conta.saldoCentavos += config.valorCentavos;
  const lanc = lancamentoRecarga(
    conta.id,
    config.valorCentavos,
    transacaoId,
    'Recarga automática via Pix',
  );
  estado.lancamentos.push(lanc);
  const t: Transacao = {
    id: transacaoId,
    contaId: conta.id,
    tipo: 'credito',
    status: 'aprovada',
    valorCentavos: config.valorCentavos,
    criadaEm: new Date().toISOString(),
    descricao: 'Recarga automática via Pix',
    metodo: 'pix',
    chaveIdempotencia: transacaoId,
    lancamentoId: lanc.id,
  };
  estado.transacoes.unshift(t);
  notificarResponsaveis(estado, t);
}

function filtrar(transacoes: Transacao[], filtros?: FiltrosExtrato): Transacao[] {
  let lista = [...transacoes];
  if (filtros?.lojaId && filtros.lojaId !== 'todas') {
    lista = lista.filter((t) => t.lojaId === filtros.lojaId);
  }
  if (filtros?.tipo && filtros.tipo !== 'todos') {
    lista = lista.filter((t) =>
      filtros.tipo === 'credito'
        ? t.tipo === 'credito' || t.tipo === 'estorno'
        : t.tipo === 'debito',
    );
  }
  if (filtros?.periodo && filtros.periodo !== 'tudo') {
    const dias = filtros.periodo === '7d' ? 7 : filtros.periodo === '30d' ? 30 : 90;
    const corte = Date.now() - dias * 86400000;
    lista = lista.filter((t) => new Date(t.criadaEm).getTime() >= corte);
  }
  if (filtros?.busca) {
    const termo = filtros.busca.toLowerCase().trim();
    lista = lista.filter(
      (t) =>
        t.descricao.toLowerCase().includes(termo) ||
        t.itens?.some((i) => i.nome.toLowerCase().includes(termo)) ||
        t.id.toLowerCase().includes(termo),
    );
  }
  return lista.sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
}

/** Erros de PIN tolerados antes de travar, e por quanto tempo. */
const ERROS_ATE_TRAVAR = 5;
const TRAVA_PIN_MS = 5 * 60 * 1000;

/**
 * Um PIN de quatro dígitos tem dez mil combinações: sem limite de tentativas,
 * quem estiver com o aparelho na mão chega nele em minutos. A trava é
 * progressiva no tempo e nunca é apagada por conferência bem-sucedida antes de
 * vencer — senão bastaria acertar o próprio PIN para zerar a contagem alheia.
 */
function conferirTravaPin(estado: EstadoMock, usuarioId: string) {
  const registro = estado.tentativasPin?.[usuarioId];
  if (!registro?.travadoAte) return;
  const ate = Date.parse(registro.travadoAte);
  if (Number.isFinite(ate) && ate > Date.now()) {
    const minutos = Math.max(1, Math.ceil((ate - Date.now()) / 60000));
    throw new ErroApi(
      `Muitas tentativas. Tente de novo em ${minutos} min.`,
      'pin_travado',
    );
  }
}

function registrarErroDePin(estado: EstadoMock, usuarioId: string) {
  if (!estado.tentativasPin) estado.tentativasPin = {};
  const registro = estado.tentativasPin[usuarioId] ?? { erros: 0 };
  registro.erros += 1;
  if (registro.erros >= ERROS_ATE_TRAVAR) {
    registro.travadoAte = new Date(Date.now() + TRAVA_PIN_MS).toISOString();
    registro.erros = 0;
  }
  estado.tentativasPin[usuarioId] = registro;
}

function limparErrosDePin(estado: EstadoMock, usuarioId: string) {
  if (estado.tentativasPin?.[usuarioId]) {
    delete estado.tentativasPin[usuarioId];
  }
}

export const mockApi: Api = {
  auth: {
    async entrar(login, senha) {
      await atraso(600);
      const estado = await db();
      const alvo = login.trim().toLowerCase();
      const usuario = estado.usuarios.find((u) => {
        if (u.email.toLowerCase() === alvo) return true;
        const aluno = estado.alunos.find((a) => a.id === u.alunoId);
        return aluno?.matricula === alvo;
      });
      if (!usuario || estado.senhas[usuario.id] !== hash(senha)) {
        throw new ErroApi(
          'Matrícula, e-mail ou senha não conferem.',
          'credenciais_invalidas',
        );
      }
      const sessao: Sessao = {
        token: id('tok'),
        refreshToken: id('rfh'),
        expiraEm: new Date(Date.now() + INATIVIDADE_ATE_EXPIRAR_MS).toISOString(),
        usuario,
        dispositivo: 'Este dispositivo',
      };
      await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
      return sessao;
    },

    async restaurarSessao() {
      const estado = await db();
      try {
        const bruto = await AsyncStorage.getItem(CHAVE_SESSAO);
        if (!bruto) return null;
        const sessao = JSON.parse(bruto) as Sessao;
        // `expiraEm` era gravado e nunca conferido: a sessão durava para
        // sempre. Num aparelho perdido, isso é acesso permanente à carteira.
        const expiracao = Date.parse(sessao.expiraEm);
        if (!Number.isFinite(expiracao) || expiracao <= Date.now()) {
          await AsyncStorage.removeItem(CHAVE_SESSAO);
          return null;
        }
        const atual = estado.usuarios.find((u) => u.id === sessao.usuario.id);
        if (!atual) {
          await AsyncStorage.removeItem(CHAVE_SESSAO);
          return null;
        }
        const renovada: Sessao = {
          ...sessao,
          usuario: atual,
          expiraEm: new Date(Date.now() + INATIVIDADE_ATE_EXPIRAR_MS).toISOString(),
        };
        await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(renovada));
        return renovada;
      } catch {
        return null;
      }
    },

    async sair() {
      await AsyncStorage.removeItem(CHAVE_SESSAO);
    },

    async definirPin(usuarioId, pin) {
      await atraso(240);
      const estado = await db();
      if (!/^\d{4}$|^\d{6}$/.test(pin)) {
        throw new ErroApi('O PIN precisa ter 4 ou 6 dígitos.', 'pin_invalido');
      }
      estado.pins[usuarioId] = hash(pin);
      const usuario = estado.usuarios.find((u) => u.id === usuarioId);
      if (usuario) {
        usuario.temPin = true;
        usuario.tamanhoPin = pin.length === 6 ? 6 : 4;
      }
      // PIN novo zera a trava: quem provou ser o dono não deve herdar a
      // contagem de erros de quem tentou adivinhar.
      limparErrosDePin(estado, usuarioId);
      await persistir();
    },

    async validarPin(usuarioId, pin) {
      await atraso(220);
      const estado = await db();
      conferirTravaPin(estado, usuarioId);
      const confere = estado.pins[usuarioId] === hash(pin);
      if (confere) limparErrosDePin(estado, usuarioId);
      else registrarErroDePin(estado, usuarioId);
      await persistir();
      return confere;
    },

    async ativarBiometria(usuarioId, ativa) {
      const estado = await db();
      const usuario = estado.usuarios.find((u) => u.id === usuarioId);
      if (!usuario) throw new ErroApi('Usuário não encontrado.', 'nao_encontrado');
      usuario.biometriaAtiva = ativa;
      await persistir();
      return usuario;
    },

    async vincularAluno(usuarioId, codigo) {
      await atraso(500);
      const estado = await db();
      const alunoId = CODIGOS_VINCULO[codigo.trim().toUpperCase()];
      const aluno = estado.alunos.find((a) => a.id === alunoId);
      if (!aluno) {
        throw new ErroApi(
          'Código não encontrado. Confira o documento enviado pela secretaria.',
          'codigo_invalido',
        );
      }
      const usuario = estado.usuarios.find((u) => u.id === usuarioId);
      if (usuario) {
        usuario.alunosIds = Array.from(new Set([...(usuario.alunosIds ?? []), aluno.id]));
        if (!aluno.responsavelIds.includes(usuario.id)) aluno.responsavelIds.push(usuario.id);
      }
      await persistir();
      return aluno;
    },

    async dispositivos() {
      await atraso(260);
      const estado = await db();
      return estado.dispositivos;
    },

    async encerrarDispositivo(dispositivoId) {
      const estado = await db();
      estado.dispositivos = estado.dispositivos.filter((d) => d.id !== dispositivoId);
      await persistir();
    },

    async atualizarNotificacoes(usuarioId, prefs) {
      const estado = await db();
      const usuario = estado.usuarios.find((u) => u.id === usuarioId);
      if (!usuario) throw new ErroApi('Usuário não encontrado.', 'nao_encontrado');
      usuario.notificacoes = prefs;
      await persistir();
      return usuario;
    },
  },

  carteira: {
    async resumo(alunoId) {
      await atraso(420);
      const estado = await db();
      const aluno = estado.alunos.find((a) => a.id === alunoId);
      if (!aluno) throw new ErroApi('Aluno não encontrado.', 'nao_encontrado');
      const conta = contaDoAluno(estado, alunoId);
      const gasto = gastoNoDia(estado.transacoes, conta.id);
      return {
        aluno,
        conta,
        cartoes: estado.cartoes.filter((c) => c.contaId === conta.id),
        lojas: LOJAS,
        ultimas: filtrar(estado.transacoes.filter((t) => t.contaId === conta.id)).slice(0, 5),
        gastoNoDiaCentavos: gasto,
        restanteHojeCentavos: Math.max(0, conta.limites.diarioCentavos - gasto),
      };
    },

    async transacoes(contaId, filtros) {
      await atraso(380);
      const estado = await db();
      return filtrar(
        estado.transacoes.filter((t) => t.contaId === contaId),
        filtros,
      );
    },

    async transacao(transacaoId) {
      await atraso(260);
      const estado = await db();
      const t = estado.transacoes.find((x) => x.id === transacaoId);
      if (!t) throw new ErroApi('Transação não encontrada.', 'nao_encontrado');
      return t;
    },

    async contestar(transacaoId, motivo) {
      await atraso(500);
      const estado = await db();
      const t = estado.transacoes.find((x) => x.id === transacaoId);
      if (!t) throw new ErroApi('Transação não encontrada.', 'nao_encontrado');
      t.contestada = true;
      estado.auditoria.unshift({
        id: id('aud'),
        autor: 'App do aluno',
        acao: `Contestação aberta na transação ${t.id}: ${motivo}`,
        criadoEm: new Date().toISOString(),
      });
      await persistir();
      return t;
    },

    async resumoMensal(contaId, mes = mesSP()) {
      await atraso(300);
      const estado = await db();
      const debitos = estado.transacoes.filter(
        (t) => t.contaId === contaId && t.tipo === 'debito' && t.status === 'aprovada',
      );
      const doMes = debitos.filter((t) => mesSP(t.criadaEm) === mes);
      const [ano, m] = mes.split('-').map(Number);
      const anterior = new Date(Date.UTC(ano, m - 2, 15));
      const mesAnterior = mesSP(anterior.toISOString());
      // Compara períodos equivalentes: até o mesmo dia do mês anterior.
      const diaAtual = Number(diaSP().slice(8, 10));
      const doMesAnterior = debitos.filter(
        (t) => mesSP(t.criadaEm) === mesAnterior && Number(diaSP(t.criadaEm).slice(8, 10)) <= diaAtual,
      );
      return {
        mes,
        totalCentavos: doMes.reduce((s, t) => s + t.valorCentavos, 0),
        totalMesAnteriorCentavos: doMesAnterior.reduce((s, t) => s + t.valorCentavos, 0),
        porLoja: LOJAS.map((l) => ({
          lojaId: l.id,
          nome: l.nome,
          totalCentavos: doMes
            .filter((t) => t.lojaId === l.id)
            .reduce((s, t) => s + t.valorCentavos, 0),
        })),
      };
    },

    async exportarCsv(contaId, filtros) {
      const estado = await db();
      const lista = filtrar(estado.transacoes.filter((t) => t.contaId === contaId), filtros);
      const linhas = [
        'Data;Hora;Descricao;Tipo;Status;Valor;Identificador',
        ...lista.map((t) =>
          [
            new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(
              new Date(t.criadaEm),
            ),
            new Intl.DateTimeFormat('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo',
            }).format(new Date(t.criadaEm)),
            t.descricao,
            t.tipo,
            t.status,
            (t.tipo === 'debito' ? '-' : '') + (t.valorCentavos / 100).toFixed(2).replace('.', ','),
            t.id,
          ].join(';'),
        ),
      ];
      return linhas.join('\n');
    },

    async exportarHtml(contaId, filtros) {
      const estado = await db();
      const aluno = alunoDaConta(estado, contaId);
      const lista = filtrar(estado.transacoes.filter((t) => t.contaId === contaId), filtros);
      const linhas = lista
        .map(
          (t) => `<tr>
            <td>${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(t.criadaEm))}</td>
            <td>${t.descricao}</td>
            <td style="text-align:right;color:${t.tipo === 'debito' ? '#B3261E' : '#0E7C5A'}">
              ${t.tipo === 'debito' ? '−' : '+'} ${formatarReais(t.valorCentavos)}
            </td>
          </tr>`,
        )
        .join('');
      return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
        <style>
          body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#14161A;padding:32px}
          h1{font-size:20px;margin:0 0 4px} p{color:#6B7076;margin:0 0 24px;font-size:13px}
          table{width:100%;border-collapse:collapse;font-size:13px}
          th{text-align:left;color:#6B7076;font-weight:600;padding:8px 0;border-bottom:1px solid #E6E6E1}
          td{padding:10px 0;border-bottom:1px solid #F0F0EC}
        </style></head><body>
        <h1>Extrato Farroups-pay</h1>
        <p>${aluno?.nome ?? ''} · ${aluno?.turma ?? ''} · emitido em ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date())}</p>
        <table><thead><tr><th>Data</th><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
        <tbody>${linhas}</tbody></table></body></html>`;
    },
  },

  cartoes: {
    async listar(contaId) {
      await atraso(300);
      const estado = await db();
      return estado.cartoes.filter((c) => c.contaId === contaId);
    },

    async ativar(cartaoId) {
      await atraso(300);
      const estado = await db();
      const alvo = estado.cartoes.find((c) => c.id === cartaoId);
      if (!alvo) throw new ErroApi('Cartão não encontrado.', 'nao_encontrado');
      for (const c of estado.cartoes.filter((x) => x.contaId === alvo.contaId)) {
        c.ativo = c.id === alvo.id;
      }
      await persistir();
      return estado.cartoes.filter((c) => c.contaId === alvo.contaId);
    },

    async alternarBloqueio(cartaoId, bloquear) {
      await atraso(320);
      const estado = await db();
      const cartao = estado.cartoes.find((c) => c.id === cartaoId);
      if (!cartao) throw new ErroApi('Cartão não encontrado.', 'nao_encontrado');
      cartao.bloqueado = bloquear;
      await persistir();
      return cartao;
    },

    async solicitarSegundaVia(contaId) {
      await atraso(700);
      const estado = await db();
      const antigo = estado.cartoes.find((c) => c.contaId === contaId && c.tipo === 'fisico');
      if (antigo) {
        antigo.ativo = false;
        antigo.bloqueado = true;
      }
      const aluno = alunoDaConta(estado, contaId);
      const novo: Cartao = {
        id: id('crt'),
        contaId,
        tipo: 'fisico',
        ultimos4: codigoNumerico(4),
        titular: (aluno?.nome ?? '').toUpperCase(),
        turma: aluno?.turma ?? '',
        bloqueado: false,
        ativo: false,
        criadoEm: new Date().toISOString(),
      };
      estado.cartoes.push(novo);
      estado.auditoria.unshift({
        id: id('aud'),
        autor: aluno?.nome ?? 'Aluno',
        acao: `Segunda via do cartão físico solicitada (final ${novo.ultimos4})`,
        criadoEm: new Date().toISOString(),
      });
      await persistir();
      return novo;
    },

    async qrDinamico(contaId) {
      await atraso(200);
      return {
        codigo: `FPAY|${contaId}|${codigoNumerico(6)}`,
        expiraEm: new Date(Date.now() + 60000).toISOString(),
      };
    },
  },

  recargas: {
    async criarPix(contaId, valorCentavos) {
      await atraso(650);
      const erro = validarRecarga(valorCentavos);
      if (erro) throw new ErroApi(erro, 'valor_invalido');
      const estado = await db();
      const cobrancaId = id('pix');
      const aluno = alunoDaConta(estado, contaId);
      const brcode = [
        '00020126580014BR.GOV.BCB.PIX0136',
        cobrancaId.toLowerCase(),
        '5204000053039865802BR5921COLEGIO FARROUPILHA6009PORTO ALEGRE62070503***',
        `54${String(valorCentavos / 100).padStart(2, '0')}`,
        `|${aluno?.matricula ?? ''}`,
      ].join('');
      estado.idempotencia[cobrancaId] = JSON.stringify({ contaId, valorCentavos });
      await persistir();
      return {
        id: cobrancaId,
        brcode,
        valorCentavos,
        expiraEm: new Date(Date.now() + 30 * 60000).toISOString(),
      };
    },

    async confirmarPix(cobrancaId) {
      await atraso(900);
      const estado = await db();
      const pendente = estado.idempotencia[cobrancaId];
      if (!pendente) throw new ErroApi('Cobrança Pix não encontrada.', 'nao_encontrado');
      const jaCriada = estado.transacoes.find((t) => t.chaveIdempotencia === cobrancaId);
      if (jaCriada) return jaCriada;
      const { contaId, valorCentavos } = JSON.parse(pendente) as {
        contaId: string;
        valorCentavos: number;
      };
      const conta = estado.contas.find((c) => c.id === contaId);
      if (!conta) throw new ErroApi('Conta não encontrada.', 'nao_encontrado');
      conta.saldoCentavos += valorCentavos;
      const transacaoId = id('trx');
      const lanc = lancamentoRecarga(contaId, valorCentavos, transacaoId, 'Recarga via Pix');
      estado.lancamentos.push(lanc);
      const t: Transacao = {
        id: transacaoId,
        contaId,
        tipo: 'credito',
        status: 'aprovada',
        valorCentavos,
        criadaEm: new Date().toISOString(),
        descricao: 'Recarga via Pix',
        metodo: 'pix',
        chaveIdempotencia: cobrancaId,
        lancamentoId: lanc.id,
      };
      estado.transacoes.unshift(t);
      notificarResponsaveis(estado, t);
      await persistir();
      return t;
    },

    async pagarComCredito(contaId, valorCentavos, tokenCartao) {
      await atraso(1100);
      const erro = validarRecarga(valorCentavos);
      if (erro) throw new ErroApi(erro, 'valor_invalido');
      if (!tokenCartao.startsWith('tok_')) {
        throw new ErroApi(
          'Não foi possível autorizar o cartão. Tente outro meio de pagamento.',
          'cartao_recusado',
        );
      }
      const estado = await db();
      const conta = estado.contas.find((c) => c.id === contaId);
      if (!conta) throw new ErroApi('Conta não encontrada.', 'nao_encontrado');
      const jaCriada = estado.transacoes.find((t) => t.chaveIdempotencia === tokenCartao);
      if (jaCriada) return jaCriada;
      conta.saldoCentavos += valorCentavos;
      const transacaoId = id('trx');
      const lanc = lancamentoRecarga(
        contaId,
        valorCentavos,
        transacaoId,
        'Recarga no cartão de crédito',
      );
      estado.lancamentos.push(lanc);
      const t: Transacao = {
        id: transacaoId,
        contaId,
        tipo: 'credito',
        status: 'aprovada',
        valorCentavos,
        criadaEm: new Date().toISOString(),
        descricao: 'Recarga no cartão de crédito',
        metodo: 'credito',
        chaveIdempotencia: tokenCartao,
        lancamentoId: lanc.id,
      };
      estado.transacoes.unshift(t);
      notificarResponsaveis(estado, t);
      await persistir();
      return t;
    },

    async configurarAutomatica(contaId, config) {
      await atraso(360);
      const estado = await db();
      const conta = estado.contas.find((c) => c.id === contaId);
      if (!conta) throw new ErroApi('Conta não encontrada.', 'nao_encontrado');
      conta.recargaAutomatica = config;
      await persistir();
      return conta;
    },

    async historico(alunosIds) {
      await atraso(340);
      const estado = await db();
      const contas = estado.contas.filter((c) => alunosIds.includes(c.alunoId)).map((c) => c.id);
      return estado.transacoes
        .filter((t) => contas.includes(t.contaId) && t.tipo === 'credito')
        .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
    },
  },

  pagamentos: {
    async cobrancaAberta(lojaId) {
      const estado = await db();
      return (
        estado.cobrancas.find((c) => c.lojaId === lojaId && c.status === 'aberta') ?? null
      );
    },

    async autorizar(pedido) {
      await atraso(850);
      const estado = await db();

      const existente = estado.transacoes.find(
        (t) => t.chaveIdempotencia === pedido.chaveIdempotencia,
      );
      if (existente) return existente;

      const conta = estado.contas.find((c) => c.id === pedido.contaId);
      if (!conta) throw new ErroApi('Conta não encontrada.', 'nao_encontrado');
      const cartao = cartaoAtivo(estado, conta.id);
      const estabelecimento = loja(pedido.lojaId);

      const avaliacao = avaliarPagamento({
        conta,
        cartao,
        loja: estabelecimento,
        valorCentavos: pedido.valorCentavos,
        gastoNoDiaCentavos: gastoNoDia(estado.transacoes, conta.id),
      });

      if (!avaliacao.ok) {
        const recusada: Transacao = {
          id: id('trx'),
          contaId: conta.id,
          tipo: 'debito',
          status: 'recusada',
          valorCentavos: pedido.valorCentavos,
          criadaEm: new Date().toISOString(),
          descricao: estabelecimento?.nome ?? 'Estabelecimento',
          lojaId: pedido.lojaId,
          forma: pedido.forma,
          itens: pedido.itens,
          motivoRecusa: avaliacao.motivo,
          mensagemRecusa: avaliacao.mensagem,
          chaveIdempotencia: pedido.chaveIdempotencia,
        };
        estado.transacoes.unshift(recusada);
        await persistir();
        throw new ErroApi(avaliacao.mensagem, avaliacao.motivo, recusada);
      }

      if (avaliacao.exigeAutenticacao && !pedido.biometria) {
        const usuario = estado.usuarios.find((u) => u.alunoId === conta.alunoId);
        const hashPin = usuario ? estado.pins[usuario.id] : undefined;
        // Sem usuário ou sem PIN cadastrado a compra não passa: antes, um
        // `hashPin` indefinido caía no mesmo erro genérico de PIN errado e
        // deixava a conta sem forma de autorizar valores altos.
        if (!usuario || !hashPin) {
          throw new ErroApi(
            'Esta conta ainda não tem PIN. Cadastre um em Perfil para autorizar valores acima do limite.',
            'pin_nao_cadastrado',
          );
        }
        conferirTravaPin(estado, usuario.id);
        if (!pedido.pin || hashPin !== hash(pedido.pin)) {
          registrarErroDePin(estado, usuario.id);
          await persistir();
          throw new ErroApi('PIN incorreto. Tente novamente.', 'pin_incorreto');
        }
        limparErrosDePin(estado, usuario.id);
      }

      conta.saldoCentavos -= pedido.valorCentavos;
      const transacaoId = id('trx');
      const lanc = lancamentoCompra(
        conta.id,
        pedido.lojaId,
        pedido.valorCentavos,
        transacaoId,
        estabelecimento?.nome ?? pedido.lojaId,
      );
      estado.lancamentos.push(lanc);
      const transacao: Transacao = {
        id: transacaoId,
        contaId: conta.id,
        tipo: 'debito',
        status: 'aprovada',
        valorCentavos: pedido.valorCentavos,
        criadaEm: new Date().toISOString(),
        descricao: estabelecimento?.nome ?? pedido.lojaId,
        lojaId: pedido.lojaId,
        forma: pedido.forma,
        itens: pedido.itens,
        chaveIdempotencia: pedido.chaveIdempotencia,
        lancamentoId: lanc.id,
      };
      estado.transacoes.unshift(transacao);

      if (pedido.cobrancaId) {
        const cobranca = estado.cobrancas.find((c) => c.id === pedido.cobrancaId);
        if (cobranca) {
          cobranca.status = 'paga';
          cobranca.transacaoId = transacao.id;
          transacao.operadorId = cobranca.operadorId;
        }
      }

      const aluno = alunoDaConta(estado, conta.id);
      const usuarioAluno = estado.usuarios.find((u) => u.alunoId === aluno?.id);
      if (usuarioAluno) {
        notificar(
          estado,
          usuarioAluno.id,
          'Pagamento aprovado',
          `${transacao.descricao} · ${formatarReais(transacao.valorCentavos)}`,
          transacao.id,
        );
      }
      notificarResponsaveis(estado, transacao);
      talvezRecarregar(estado, conta);
      await persistir();
      return transacao;
    },
  },

  lojista: {
    async abrirCobranca(lojaId, operadorId, valorCentavos, itens) {
      await atraso(280);
      const estado = await db();
      if (valorCentavos <= 0) {
        throw new ErroApi('Informe um valor maior que zero.', 'valor_invalido');
      }
      for (const c of estado.cobrancas) {
        if (c.lojaId === lojaId && c.status === 'aberta') c.status = 'cancelada';
      }
      const cobranca: Cobranca = {
        id: id('cob'),
        lojaId,
        operadorId,
        valorCentavos,
        itens,
        criadaEm: new Date().toISOString(),
        status: 'aberta',
      };
      estado.cobrancas.unshift(cobranca);
      await persistir();
      return cobranca;
    },

    async cancelarCobranca(cobrancaId) {
      const estado = await db();
      const cobranca = estado.cobrancas.find((c) => c.id === cobrancaId);
      if (cobranca && cobranca.status === 'aberta') cobranca.status = 'cancelada';
      await persistir();
    },

    async filaDoDia(lojaId) {
      await atraso(360);
      const estado = await db();
      const hoje = diaSP();
      return estado.transacoes
        .filter((t) => t.lojaId === lojaId && diaSP(t.criadaEm) === hoje)
        .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
    },

    async estornar(transacaoId, justificativa, senhaOperador, operadorId) {
      await atraso(700);
      const estado = await db();
      if (estado.senhas[operadorId] !== hash(senhaOperador)) {
        throw new ErroApi('Senha do operador incorreta.', 'senha_invalida');
      }
      if (justificativa.trim().length < 5) {
        throw new ErroApi('Descreva o motivo do estorno.', 'justificativa_curta');
      }
      const original = estado.transacoes.find((t) => t.id === transacaoId);
      if (!original) throw new ErroApi('Transação não encontrada.', 'nao_encontrado');
      if (!podeEstornar(original)) {
        throw new ErroApi(
          'Esta venda não pode mais ser estornada pelo caixa (limite de 24h).',
          'fora_da_janela',
        );
      }
      const conta = estado.contas.find((c) => c.id === original.contaId);
      if (!conta) throw new ErroApi('Conta não encontrada.', 'nao_encontrado');

      conta.saldoCentavos += original.valorCentavos;
      const estornoId = id('trx');
      const lanc = lancamentoEstorno(
        conta.id,
        original.lojaId ?? '',
        original.valorCentavos,
        estornoId,
        `Estorno — ${justificativa}`,
      );
      estado.lancamentos.push(lanc);
      const estorno: Transacao = {
        id: estornoId,
        contaId: conta.id,
        tipo: 'estorno',
        status: 'aprovada',
        valorCentavos: original.valorCentavos,
        criadaEm: new Date().toISOString(),
        descricao: `Estorno · ${original.descricao}`,
        lojaId: original.lojaId,
        operadorId,
        transacaoOriginalId: original.id,
        chaveIdempotencia: `estorno:${original.id}`,
        lancamentoId: lanc.id,
      };
      original.status = 'estornada';
      original.estornadaPorId = estorno.id;
      estado.transacoes.unshift(estorno);
      estado.auditoria.unshift({
        id: id('aud'),
        autor: estado.usuarios.find((u) => u.id === operadorId)?.nome ?? 'Operador',
        acao: `Estorno de ${formatarReais(original.valorCentavos)} — ${justificativa}`,
        criadoEm: new Date().toISOString(),
      });
      notificarResponsaveis(estado, estorno);
      await persistir();
      return estorno;
    },

    async fechamento(lojaId) {
      await atraso(420);
      const estado = await db();
      const hoje = diaSP();
      const doDia = estado.transacoes.filter(
        (t) => t.lojaId === lojaId && diaSP(t.criadaEm) === hoje,
      );
      const vendas = doDia.filter((t) => t.tipo === 'debito' && t.status === 'aprovada');
      const estornos = doDia.filter((t) => t.tipo === 'estorno');
      const total = vendas.reduce((s, t) => s + t.valorCentavos, 0);
      return {
        lojaId,
        turno: 'Turno único',
        abertura: `${hoje}T07:00:00`,
        fechamento: new Date().toISOString(),
        totalCentavos: total,
        quantidade: vendas.length,
        estornosCentavos: estornos.reduce((s, t) => s + t.valorCentavos, 0),
        ticketMedioCentavos: vendas.length ? Math.round(total / vendas.length) : 0,
      };
    },
  },

  responsavel: {
    async alunos(usuarioId) {
      await atraso(420);
      const estado = await db();
      const usuario = estado.usuarios.find((u) => u.id === usuarioId);
      const ids = usuario?.alunosIds ?? [];
      return estado.alunos
        .filter((a) => ids.includes(a.id))
        .map((aluno) => {
          const conta = contaDoAluno(estado, aluno.id);
          return {
            aluno,
            conta,
            gastoNoDiaCentavos: gastoNoDia(estado.transacoes, conta.id),
          };
        });
    },

    async definirLimites(contaId, limites) {
      await atraso(380);
      const estado = await db();
      const conta = estado.contas.find((c) => c.id === contaId);
      if (!conta) throw new ErroApi('Conta não encontrada.', 'nao_encontrado');
      conta.limites = limites;
      estado.auditoria.unshift({
        id: id('aud'),
        autor: 'Responsável',
        acao: `Limites de ${alunoDaConta(estado, contaId)?.nome} atualizados`,
        criadoEm: new Date().toISOString(),
      });
      await persistir();
      return conta;
    },

    async bloquearLoja(contaId, lojaId, bloquear) {
      await atraso(280);
      const estado = await db();
      const conta = estado.contas.find((c) => c.id === contaId);
      if (!conta) throw new ErroApi('Conta não encontrada.', 'nao_encontrado');
      const atual = new Set(conta.limites.lojasBloqueadas);
      if (bloquear) atual.add(lojaId);
      else atual.delete(lojaId);
      conta.limites = { ...conta.limites, lojasBloqueadas: Array.from(atual) };
      await persistir();
      return conta;
    },
  },

  admin: {
    async metricas() {
      await atraso(520);
      const estado = await db();
      const mes = mesSP();
      const debitos = estado.transacoes.filter(
        (t) => t.tipo === 'debito' && t.status === 'aprovada' && mesSP(t.criadaEm) === mes,
      );
      const volume = debitos.reduce((s, t) => s + t.valorCentavos, 0);
      const horas = new Map<number, number>();
      for (const t of debitos) {
        const hora = Number(
          new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            hour12: false,
            timeZone: 'America/Sao_Paulo',
          }).format(new Date(t.criadaEm)),
        );
        horas.set(hora, (horas.get(hora) ?? 0) + 1);
      }
      return {
        saldoEmCustodiaCentavos: saldoEmCustodia(estado.lancamentos),
        volumeMesCentavos: volume,
        ticketMedioCentavos: debitos.length ? Math.round(volume / debitos.length) : 0,
        transacoesMes: debitos.length,
        alunosAtivos: estado.alunos.length,
        porLoja: LOJAS.map((l) => {
          const daLoja = debitos.filter((t) => t.lojaId === l.id);
          return {
            lojaId: l.id,
            nome: l.nome,
            totalCentavos: daLoja.reduce((s, t) => s + t.valorCentavos, 0),
            quantidade: daLoja.length,
          };
        }),
        horariosPico: Array.from(horas.entries())
          .map(([hora, quantidade]) => ({ hora, quantidade }))
          .sort((a, b) => a.hora - b.hora),
        conciliacao: LOJAS.map((l) => ({
          lojaId: l.id,
          nome: l.nome,
          aRepassarCentavos: estado.lancamentos
            .flatMap((x) => x.linhas)
            .filter((linha) => linha.conta === CONTAS.loja(l.id))
            .reduce(
              (s, linha) => s + (linha.tipo === 'C' ? linha.valorCentavos : -linha.valorCentavos),
              0,
            ),
        })),
      };
    },

    async alunos() {
      await atraso(360);
      const estado = await db();
      return estado.alunos.map((aluno) => ({
        aluno,
        conta: contaDoAluno(estado, aluno.id),
      }));
    },

    async lojas() {
      await atraso(200);
      return LOJAS;
    },

    async operadores() {
      await atraso(240);
      const estado = await db();
      return estado.usuarios.filter((u: Usuario) => u.perfil === 'lojista');
    },

    async auditoria() {
      await atraso(300);
      const estado = await db();
      return estado.auditoria;
    },
  },

  solicitacoes: {
    async criar(dados) {
      await atraso(700);
      const estado = await db();

      const matricula = dados.aluno.matricula.trim();
      if (estado.alunos.some((a) => a.matricula === matricula)) {
        throw new ErroApi(
          'Já existe uma conta para esta matrícula. Procure a secretaria.',
          'matricula_em_uso',
        );
      }
      const pendente = estado.solicitacoes.find(
        (x) => x.aluno.matricula === matricula && x.status === 'pendente',
      );
      if (pendente) {
        throw new ErroApi(
          `Já há um pedido em análise para esta matrícula (protocolo ${pendente.id}).`,
          'solicitacao_duplicada',
        );
      }
      if (!dados.consentimentoLgpd) {
        throw new ErroApi(
          'É preciso autorizar o uso dos dados do estudante para abrir a conta.',
          'consentimento_ausente',
        );
      }

      const solicitacao: SolicitacaoConta = {
        id: `SOL-${codigoNumerico(4)}`,
        criadaEm: new Date().toISOString(),
        status: 'pendente',
        responsavel: { ...dados.responsavel, email: dados.responsavel.email.trim().toLowerCase() },
        aluno: { ...dados.aluno, matricula },
        consentimentoLgpd: true,
      };
      estado.solicitacoes.unshift(solicitacao);
      estado.auditoria.unshift({
        id: id('aud'),
        autor: solicitacao.responsavel.nome,
        acao: `Solicitação de conta ${solicitacao.id} recebida para ${solicitacao.aluno.nome}`,
        criadoEm: solicitacao.criadaEm,
      });
      await persistir();
      return solicitacao;
    },

    async consultar(protocolo) {
      await atraso(400);
      const estado = await db();
      const alvo = protocolo.trim().toUpperCase();
      return estado.solicitacoes.find((s) => s.id.toUpperCase() === alvo) ?? null;
    },

    async listar(status) {
      await atraso(360);
      const estado = await db();
      const lista = status
        ? estado.solicitacoes.filter((s) => s.status === status)
        : estado.solicitacoes;
      return [...lista].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
    },

    async aprovar(solicitacaoId, avaliadorId) {
      await atraso(900);
      const estado = await db();
      const s = estado.solicitacoes.find((x) => x.id === solicitacaoId);
      if (!s) throw new ErroApi('Solicitação não encontrada.', 'nao_encontrado');
      if (s.status !== 'pendente') {
        throw new ErroApi('Esta solicitação já foi avaliada.', 'ja_avaliada');
      }

      const avaliador = estado.usuarios.find((u) => u.id === avaliadorId);
      const agora = new Date().toISOString();

      // 1. O aluno e sua conta nascem juntos, com os limites do segmento.
      const alunoId = id('alu');
      const contaId = id('cta');
      const limitesPorSegmento = {
        infantil: { diarioCentavos: 3000, porTransacaoCentavos: 2000 },
        padrao: { diarioCentavos: 5000, porTransacaoCentavos: 3000 },
        profissional: { diarioCentavos: 8000, porTransacaoCentavos: 5000 },
      }[s.aluno.segmento];

      // 2. O responsável: reaproveita o acesso se ele já tiver um.
      let responsavel = estado.usuarios.find(
        (u) => u.email.toLowerCase() === s.responsavel.email.toLowerCase(),
      );
      let senhaProvisoria: string | undefined;
      if (!responsavel) {
        senhaProvisoria = `FP${codigoNumerico(6)}`;
        responsavel = {
          id: id('usr'),
          nome: s.responsavel.nome,
          email: s.responsavel.email,
          perfil: 'responsavel',
          alunosIds: [],
          temPin: false,
          biometriaAtiva: false,
          notificacoes: { modo: 'toda_compra', acimaDeCentavos: 0, recargas: true },
        };
        estado.usuarios.push(responsavel);
        estado.senhas[responsavel.id] = hash(senhaProvisoria);
      }

      estado.alunos.push({
        id: alunoId,
        nome: s.aluno.nome,
        matricula: s.aluno.matricula,
        turma: s.aluno.turma,
        segmento: s.aluno.segmento,
        contaId,
        responsavelIds: [responsavel.id],
        maiorDeIdade: false,
      });
      estado.contas.push({
        id: contaId,
        alunoId,
        saldoCentavos: 0,
        ativa: true,
        limites: { ...limitesPorSegmento, lojasBloqueadas: [] },
        recargaAutomatica: null,
      });
      estado.cartoes.push({
        id: id('crt'),
        contaId,
        tipo: 'virtual',
        ultimos4: codigoNumerico(4),
        titular: s.aluno.nome.toUpperCase(),
        turma: s.aluno.turma,
        bloqueado: false,
        ativo: true,
        criadoEm: agora,
      });
      responsavel.alunosIds = Array.from(new Set([...(responsavel.alunosIds ?? []), alunoId]));

      // 3. O código de vínculo permite ao responsável somar o aluno a um
      //    acesso que ele já use no app.
      const codigo = `${s.aluno.turma.replace(/[^0-9A-Za-zÀ-ú]/g, '').toUpperCase().slice(0, 6)}-${codigoNumerico(4)}`;
      CODIGOS_VINCULO[codigo] = alunoId;

      s.status = 'aprovada';
      s.avaliadaEm = agora;
      s.avaliadaPor = avaliador?.nome ?? 'Secretaria';
      s.codigoVinculo = codigo;
      s.senhaProvisoria = senhaProvisoria;

      estado.auditoria.unshift({
        id: id('aud'),
        autor: avaliador?.nome ?? 'Secretaria',
        acao: `Solicitação ${s.id} aprovada: conta criada para ${s.aluno.nome} (${s.aluno.turma})`,
        criadoEm: agora,
      });
      await persistir();
      return s;
    },

    async recusar(solicitacaoId, avaliadorId, motivo) {
      await atraso(600);
      const estado = await db();
      const s = estado.solicitacoes.find((x) => x.id === solicitacaoId);
      if (!s) throw new ErroApi('Solicitação não encontrada.', 'nao_encontrado');
      if (s.status !== 'pendente') {
        throw new ErroApi('Esta solicitação já foi avaliada.', 'ja_avaliada');
      }
      if (motivo.trim().length < 5) {
        throw new ErroApi('Descreva o motivo da recusa.', 'motivo_curto');
      }
      const avaliador = estado.usuarios.find((u) => u.id === avaliadorId);
      s.status = 'recusada';
      s.avaliadaEm = new Date().toISOString();
      s.avaliadaPor = avaliador?.nome ?? 'Secretaria';
      s.motivoRecusa = motivo.trim();
      estado.auditoria.unshift({
        id: id('aud'),
        autor: avaliador?.nome ?? 'Secretaria',
        acao: `Solicitação ${s.id} recusada: ${s.motivoRecusa}`,
        criadoEm: s.avaliadaEm,
      });
      await persistir();
      return s;
    },
  },

  notificacoes: {
    async listar(usuarioId) {
      await atraso(260);
      const estado = await db();
      return estado.notificacoes.filter((n) => n.usuarioId === usuarioId);
    },

    async marcarComoLidas(usuarioId) {
      const estado = await db();
      for (const n of estado.notificacoes) {
        if (n.usuarioId === usuarioId) n.lida = true;
      }
      await persistir();
    },
  },

  async reiniciarDemo() {
    await AsyncStorage.removeItem(CHAVE_SESSAO);
    await reiniciar();
  },
};
