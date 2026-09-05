import {
  LIMITE_DIARIO_PADRAO,
  LIMITE_TRANSACAO_PADRAO,
} from '@/domain/regras';
import { lancamentoCompra, lancamentoRecarga } from '@/domain/ledger';
import type {
  Aluno,
  Cartao,
  Conta,
  Dispositivo,
  Lancamento,
  Loja,
  Notificacao,
  Transacao,
  Usuario,
} from '@/domain/types';

/** Gerador determinístico: a demonstração precisa ser sempre a mesma. */
function rng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const LOJAS: Loja[] = [
  {
    id: 'bar-do-ze',
    nome: 'Bar do Zé',
    descricao: 'Lanches, salgados e bebidas',
    sigla: 'BZ',
    abre: '07:00',
    fecha: '18:00',
    autorizada: true,
    itensFrequentes: [
      { nome: 'Pão de queijo', valorCentavos: 600 },
      { nome: 'Coxinha', valorCentavos: 900 },
      { nome: 'Misto quente', valorCentavos: 1200 },
      { nome: 'Suco natural', valorCentavos: 800 },
      { nome: 'Água', valorCentavos: 400 },
      { nome: 'Combo lanche', valorCentavos: 1800 },
    ],
  },
  {
    id: 'la-brunita',
    nome: 'La Brunita',
    descricao: 'Cafeteria e confeitaria',
    sigla: 'LB',
    abre: '07:30',
    fecha: '17:30',
    autorizada: true,
    itensFrequentes: [
      { nome: 'Café expresso', valorCentavos: 700 },
      { nome: 'Cappuccino', valorCentavos: 1100 },
      { nome: 'Croissant', valorCentavos: 1400 },
      { nome: 'Cookie', valorCentavos: 900 },
      { nome: 'Bolo de cenoura', valorCentavos: 1200 },
      { nome: 'Chocolate quente', valorCentavos: 1300 },
    ],
  },
  {
    id: 'saude-no-copo',
    nome: 'Saúde no Copo',
    descricao: 'Sucos, açaí e saladas de fruta',
    sigla: 'SC',
    abre: '08:00',
    fecha: '17:00',
    autorizada: true,
    itensFrequentes: [
      { nome: 'Suco detox', valorCentavos: 1500 },
      { nome: 'Açaí 300ml', valorCentavos: 1900 },
      { nome: 'Salada de frutas', valorCentavos: 1300 },
      { nome: 'Vitamina de banana', valorCentavos: 1400 },
      { nome: 'Água de coco', valorCentavos: 900 },
      { nome: 'Wrap de frango', valorCentavos: 2200 },
    ],
  },
];

export interface EstadoMock {
  usuarios: Usuario[];
  alunos: Aluno[];
  contas: Conta[];
  cartoes: Cartao[];
  transacoes: Transacao[];
  lancamentos: Lancamento[];
  notificacoes: Notificacao[];
  dispositivos: Dispositivo[];
  cobrancas: import('@/domain/types').Cobranca[];
  auditoria: { id: string; autor: string; acao: string; criadoEm: string }[];
  solicitacoes: import('@/domain/types').SolicitacaoConta[];
  /** PINs guardados apenas como hash — nunca em texto plano. */
  pins: Record<string, string>;
  senhas: Record<string, string>;
  idempotencia: Record<string, string>;
  /** Tentativas erradas de PIN por usuário, para travar a força bruta. */
  tentativasPin: Record<string, { erros: number; travadoAte?: string }>;
}

/**
 * Ofuscação didática, NÃO é hash criptográfico.
 *
 * É DJB2 de 32 bits, sem sal e sem custo de trabalho: um PIN de quatro dígitos
 * cai por força bruta em milissegundos. O prefixo era `sha$`, o que dava a
 * entender que havia SHA aqui — não há, e o nome agora diz isso em voz alta,
 * porque a trava de produção em `services/index.ts` depende de ninguém
 * confundir os dois.
 *
 * No backend real: argon2id (ou bcrypt), com sal por usuário, e o PIN nunca
 * verificado no cliente.
 */
export function hash(valor: string): string {
  let h = 5381;
  for (let i = 0; i < valor.length; i++) {
    h = ((h << 5) + h + valor.charCodeAt(i)) >>> 0;
  }
  return `inseguro$${h.toString(16)}`;
}

const ALUNO_HELENA: Aluno = {
  id: 'alu_helena',
  nome: 'Helena Ribeiro Antunes',
  matricula: '2026081',
  turma: '8º ano A',
  segmento: 'padrao',
  contaId: 'cta_helena',
  responsavelIds: ['usr_camila'],
  maiorDeIdade: false,
};

const ALUNO_BENTO: Aluno = {
  id: 'alu_bento',
  nome: 'Bento Ribeiro Antunes',
  matricula: '2026114',
  turma: '5º ano B',
  segmento: 'infantil',
  contaId: 'cta_bento',
  responsavelIds: ['usr_camila'],
  maiorDeIdade: false,
};

const ALUNO_ANTONELLA: Aluno = {
  id: 'alu_antonella',
  nome: 'Antonella Kaufmann Prado',
  matricula: '2026207',
  turma: '1º ano EM',
  segmento: 'profissional',
  contaId: 'cta_antonella',
  responsavelIds: ['usr_camila'],
  maiorDeIdade: false,
};

const ALUNO_THEO: Aluno = {
  id: 'alu_theo',
  nome: 'Théo Vasconcellos Lima',
  matricula: '2024118',
  turma: '3º ano EM',
  segmento: 'profissional',
  contaId: 'cta_theo',
  responsavelIds: ['usr_camila'],
  // Aos 18 anos ele já responde pela própria conta.
  maiorDeIdade: true,
};

export function criarEstadoInicial(agora = new Date()): EstadoMock {
  const aleatorio = rng(20260401);

  const contas: Conta[] = [
    {
      id: 'cta_helena',
      alunoId: 'alu_helena',
      saldoCentavos: 0,
      ativa: true,
      limites: {
        diarioCentavos: LIMITE_DIARIO_PADRAO,
        porTransacaoCentavos: LIMITE_TRANSACAO_PADRAO,
        lojasBloqueadas: [],
      },
      recargaAutomatica: {
        ativa: false,
        gatilhoCentavos: 2000,
        valorCentavos: 5000,
        maximoPorDia: 2,
      },
    },
    {
      id: 'cta_bento',
      alunoId: 'alu_bento',
      saldoCentavos: 0,
      ativa: true,
      limites: {
        diarioCentavos: 3000,
        porTransacaoCentavos: 2000,
        lojasBloqueadas: ['bar-do-ze'],
      },
      recargaAutomatica: null,
    },
    {
      id: 'cta_antonella',
      alunoId: 'alu_antonella',
      saldoCentavos: 0,
      ativa: true,
      limites: {
        diarioCentavos: 8000,
        porTransacaoCentavos: 5000,
        lojasBloqueadas: [],
      },
      recargaAutomatica: {
        ativa: false,
        gatilhoCentavos: 3000,
        valorCentavos: 8000,
        maximoPorDia: 2,
      },
    },
    {
      id: 'cta_theo',
      alunoId: 'alu_theo',
      saldoCentavos: 0,
      ativa: true,
      limites: {
        diarioCentavos: 12000,
        porTransacaoCentavos: 8000,
        lojasBloqueadas: [],
      },
      recargaAutomatica: null,
    },
  ];

  const cartoes: Cartao[] = [
    {
      id: 'crt_helena_v',
      contaId: 'cta_helena',
      tipo: 'virtual',
      ultimos4: '4417',
      titular: 'HELENA R ANTUNES',
      turma: '8º ano A',
      bloqueado: false,
      ativo: true,
      criadoEm: dias(agora, -240),
    },
    {
      id: 'crt_helena_f',
      contaId: 'cta_helena',
      tipo: 'fisico',
      ultimos4: '8032',
      titular: 'HELENA R ANTUNES',
      turma: '8º ano A',
      bloqueado: false,
      ativo: false,
      criadoEm: dias(agora, -238),
    },
    {
      id: 'crt_bento_v',
      contaId: 'cta_bento',
      tipo: 'virtual',
      ultimos4: '2290',
      titular: 'BENTO R ANTUNES',
      turma: '5º ano B',
      bloqueado: false,
      ativo: true,
      criadoEm: dias(agora, -190),
    },
    {
      id: 'crt_antonella_v',
      contaId: 'cta_antonella',
      tipo: 'virtual',
      ultimos4: '7318',
      titular: 'ANTONELLA K PRADO',
      turma: '1º ano EM',
      bloqueado: false,
      ativo: true,
      criadoEm: dias(agora, -160),
    },
    {
      id: 'crt_theo_f',
      contaId: 'cta_theo',
      tipo: 'fisico',
      ultimos4: '9045',
      titular: 'THEO V LIMA',
      turma: '3º ano EM',
      bloqueado: false,
      ativo: true,
      criadoEm: dias(agora, -420),
    },
    {
      id: 'crt_theo_v',
      contaId: 'cta_theo',
      tipo: 'virtual',
      ultimos4: '6612',
      titular: 'THEO V LIMA',
      turma: '3º ano EM',
      bloqueado: false,
      ativo: false,
      criadoEm: dias(agora, -418),
    },
  ];

  const usuarios: Usuario[] = [
    {
      id: 'usr_helena',
      nome: 'Helena Ribeiro Antunes',
      email: 'helena@farroupilha.br',
      perfil: 'aluno',
      alunoId: 'alu_helena',
      segmento: 'padrao',
      temPin: true,
  tamanhoPin: 4 as const,
      biometriaAtiva: false,
      notificacoes: { modo: 'toda_compra', acimaDeCentavos: 0, recargas: true },
    },
    {
      id: 'usr_camila',
      nome: 'Camila Ribeiro Antunes',
      email: 'camila@farroupilha.br',
      perfil: 'responsavel',
      alunosIds: ['alu_helena', 'alu_bento', 'alu_antonella', 'alu_theo'],
      temPin: true,
  tamanhoPin: 4 as const,
      biometriaAtiva: false,
      notificacoes: { modo: 'acima_de', acimaDeCentavos: 2000, recargas: true },
    },
    {
      id: 'usr_bento',
      nome: 'Bento Ribeiro Antunes',
      email: 'bento@farroupilha.br',
      perfil: 'aluno',
      alunoId: 'alu_bento',
      segmento: 'infantil',
      temPin: true,
  tamanhoPin: 4 as const,
      biometriaAtiva: false,
      notificacoes: { modo: 'toda_compra', acimaDeCentavos: 0, recargas: true },
    },
    {
      id: 'usr_antonella',
      nome: 'Antonella Kaufmann Prado',
      email: 'antonella@farroupilha.br',
      perfil: 'aluno',
      alunoId: 'alu_antonella',
      segmento: 'profissional',
      temPin: true,
  tamanhoPin: 4 as const,
      biometriaAtiva: false,
      notificacoes: { modo: 'acima_de', acimaDeCentavos: 3000, recargas: true },
    },
    {
      id: 'usr_theo',
      nome: 'Théo Vasconcellos Lima',
      email: 'theo@farroupilha.br',
      perfil: 'aluno',
      alunoId: 'alu_theo',
      segmento: 'profissional',
      temPin: true,
  tamanhoPin: 4 as const,
      biometriaAtiva: false,
      notificacoes: { modo: 'resumo_diario', acimaDeCentavos: 0, recargas: false },
    },
    {
      id: 'usr_ze',
      nome: 'José Rocha',
      email: 'ze@barodoze.com.br',
      perfil: 'lojista',
      lojaId: 'bar-do-ze',
      temPin: true,
  tamanhoPin: 4 as const,
      biometriaAtiva: false,
      notificacoes: { modo: 'nenhuma', acimaDeCentavos: 0, recargas: false },
    },
    {
      id: 'usr_bruna',
      nome: 'Bruna Salvi',
      email: 'bruna@labrunita.com.br',
      perfil: 'lojista',
      lojaId: 'la-brunita',
      temPin: true,
  tamanhoPin: 4 as const,
      biometriaAtiva: false,
      notificacoes: { modo: 'nenhuma', acimaDeCentavos: 0, recargas: false },
    },
    {
      id: 'usr_admin',
      nome: 'Secretaria Farroupilha',
      email: 'secretaria@farroupilha.br',
      perfil: 'admin',
      temPin: true,
  tamanhoPin: 4 as const,
      biometriaAtiva: false,
      notificacoes: { modo: 'resumo_diario', acimaDeCentavos: 0, recargas: false },
    },
  ];

  const estado: EstadoMock = {
    usuarios,
    alunos: [ALUNO_HELENA, ALUNO_BENTO, ALUNO_ANTONELLA, ALUNO_THEO],
    contas,
    cartoes,
    transacoes: [],
    lancamentos: [],
    notificacoes: [],
    dispositivos: [
      { id: 'dsp_1', nome: 'iPhone 13 — Helena', ultimoAcesso: agora.toISOString(), atual: true },
      { id: 'dsp_2', nome: 'iPad da sala', ultimoAcesso: dias(agora, -12), atual: false },
    ],
    cobrancas: [],
    auditoria: [
      {
        id: 'aud_1',
        autor: 'Secretaria Farroupilha',
        acao: 'Cadastro da loja Saúde no Copo aprovado',
        criadoEm: dias(agora, -30),
      },
      {
        id: 'aud_2',
        autor: 'Secretaria Farroupilha',
        acao: 'Limite diário padrão alterado para R$ 50,00',
        criadoEm: dias(agora, -21),
      },
    ],
    solicitacoes: [
      {
        id: 'SOL-4827',
        criadaEm: dias(agora, -1),
        status: 'pendente',
        responsavel: {
          nome: 'Rodrigo Menezes Ferraz',
          cpf: '028.114.760-33',
          email: 'rodrigo.ferraz@email.com',
          telefone: '(51) 99184-2207',
        },
        aluno: {
          nome: 'Cecília Menezes Ferraz',
          matricula: '2026318',
          turma: '2º ano A',
          segmento: 'infantil',
        },
        consentimentoLgpd: true,
      },
      {
        id: 'SOL-4831',
        criadaEm: dias(agora, 0),
        status: 'pendente',
        responsavel: {
          nome: 'Patrícia Goulart Nunes',
          cpf: '911.472.030-08',
          email: 'patricia.goulart@email.com',
          telefone: '(51) 98822-4410',
        },
        aluno: {
          nome: 'Enzo Goulart Nunes',
          matricula: '2025092',
          turma: '2º ano EM',
          segmento: 'profissional',
        },
        consentimentoLgpd: true,
      },
    ],
    // Contas de demonstração já vêm com o PIN 1234 definido, para trocar entre
    // as faixas etárias sem repetir o cadastro a cada login. A criação de PIN
    // continua disponível em Perfil → Alterar PIN.
    tentativasPin: {},
    pins: Object.fromEntries(usuarios.map((u) => [u.id, hash('1234')])),
    senhas: Object.fromEntries(usuarios.map((u) => [u.id, hash('farroupilha')])),
    idempotencia: {},
  };

  semearHistorico(estado, agora, aleatorio);
  return estado;
}

/** 45 dias de recargas e compras, para o extrato e os gráficos não nascerem vazios. */
function semearHistorico(estado: EstadoMock, agora: Date, aleatorio: () => number) {
  const contas = estado.contas;
  // Recargas na linha do tempo: entram no dia em que aconteceram, não de uma vez.
  const agenda: Record<string, Record<number, number>> = {
    cta_helena: { 42: 10000, 28: 10000, 13: 10000, 4: 10000 },
    cta_bento: { 40: 6000, 15: 6000 },
    cta_antonella: { 38: 15000, 20: 12000, 6: 12000 },
    cta_theo: { 35: 20000, 14: 15000, 3: 15000 },
  };

  for (let d = 44; d >= 0; d--) {
    const data = new Date(agora.getTime() - d * 86400000);

    for (const conta of contas) {
      const recarga = agenda[conta.id]?.[d];
      if (recarga) {
        const quando = new Date(data);
        quando.setHours(8, 15, 0, 0);
        creditar(estado, conta, recarga, quando.toISOString(), 'pix');
      }
    }

    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;

    for (const conta of contas) {
      const compras =
        conta.id === 'cta_helena' ? (aleatorio() > 0.35 ? 2 : 1) : aleatorio() > 0.6 ? 1 : 0;
      for (let i = 0; i < compras; i++) {
        const loja = LOJAS[Math.floor(aleatorio() * LOJAS.length)];
        if (conta.limites.lojasBloqueadas.includes(loja.id)) continue;
        const item = loja.itensFrequentes[Math.floor(aleatorio() * loja.itensFrequentes.length)];
        // Nunca gasta mais do que tem: o saldo do app jamais fica negativo.
        if (conta.saldoCentavos < item.valorCentavos) continue;
        const hora = 9 + Math.floor(aleatorio() * 7);
        const minuto = Math.floor(aleatorio() * 60);
        const quando = new Date(data);
        quando.setHours(hora, minuto, 0, 0);
        if (quando.getTime() > agora.getTime()) continue;
        debitar(estado, conta, loja.id, item, quando.toISOString());
      }
    }
  }

  // Fecha a semeadura com uma recarga recente: a demonstração começa com saldo.
  for (const conta of contas) {
    const alvo =
      { cta_helena: 8700, cta_bento: 4200, cta_antonella: 11400, cta_theo: 16850 }[
        conta.id
      ] ?? 5000;
    if (conta.saldoCentavos < alvo) {
      creditar(estado, conta, alvo - conta.saldoCentavos, dias(agora, -1), 'pix');
    }
  }

  estado.transacoes.sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
}

function creditar(
  estado: EstadoMock,
  conta: Conta,
  valorCentavos: number,
  criadaEm: string,
  metodo: 'pix' | 'credito',
) {
  const idTransacao = `trx_seed_${estado.transacoes.length + 1}`;
  conta.saldoCentavos += valorCentavos;
  const descricao = metodo === 'pix' ? 'Recarga via Pix' : 'Recarga no cartão de crédito';
  const lanc = lancamentoRecarga(conta.id, valorCentavos, idTransacao, descricao);
  lanc.criadoEm = criadaEm;
  estado.lancamentos.push(lanc);
  estado.transacoes.push({
    id: idTransacao,
    contaId: conta.id,
    tipo: 'credito',
    status: 'aprovada',
    valorCentavos,
    criadaEm,
    descricao,
    metodo,
    chaveIdempotencia: idTransacao,
    lancamentoId: lanc.id,
  });
}

function debitar(
  estado: EstadoMock,
  conta: Conta,
  lojaId: Loja['id'],
  item: { nome: string; valorCentavos: number },
  criadaEm: string,
) {
  const idTransacao = `trx_seed_${estado.transacoes.length + 1}`;
  conta.saldoCentavos -= item.valorCentavos;
  const loja = LOJAS.find((l) => l.id === lojaId)!;
  const lanc = lancamentoCompra(conta.id, lojaId, item.valorCentavos, idTransacao, loja.nome);
  lanc.criadoEm = criadaEm;
  estado.lancamentos.push(lanc);
  estado.transacoes.push({
    id: idTransacao,
    contaId: conta.id,
    tipo: 'debito',
    status: 'aprovada',
    valorCentavos: item.valorCentavos,
    criadaEm,
    descricao: loja.nome,
    lojaId,
    forma: 'cartao',
    itens: [item],
    operadorId: 'usr_ze',
    chaveIdempotencia: idTransacao,
    lancamentoId: lanc.id,
  });
}

function dias(base: Date, delta: number): string {
  return new Date(base.getTime() + delta * 86400000).toISOString();
}

export const CODIGOS_VINCULO: Record<string, string> = {
  '8ANO-HELENA': 'alu_helena',
  '5ANO-BENTO': 'alu_bento',
  '1EM-ANTONELLA': 'alu_antonella',
  '3EM-THEO': 'alu_theo',
};
