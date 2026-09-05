import type {
  Aluno,
  SolicitacaoConta,
  StatusSolicitacao,
  Cartao,
  Cobranca,
  Conta,
  Dispositivo,
  FechamentoCaixa,
  ItemPdv,
  Limites,
  Loja,
  LojaId,
  Notificacao,
  PreferenciasNotificacao,
  RecargaAutomatica,
  Sessao,
  Transacao,
  Usuario,
} from '@/domain/types';

/**
 * Contrato único entre a interface e o mundo. Hoje quem implementa é o mock
 * em memória (`services/mock`); para plugar a API real basta implementar esta
 * mesma interface em `services/http` e trocar a exportação de `services/index`.
 */
export interface Api {
  auth: AuthApi;
  carteira: CarteiraApi;
  cartoes: CartoesApi;
  recargas: RecargasApi;
  pagamentos: PagamentosApi;
  lojista: LojistaApi;
  responsavel: ResponsavelApi;
  admin: AdminApi;
  solicitacoes: SolicitacoesApi;
  notificacoes: NotificacoesApi;
  /** Só existe no mock: restaura a base de demonstração. */
  reiniciarDemo?: () => Promise<void>;
}

export interface AuthApi {
  entrar(login: string, senha: string): Promise<Sessao>;
  restaurarSessao(): Promise<Sessao | null>;
  sair(): Promise<void>;
  definirPin(usuarioId: string, pin: string): Promise<void>;
  validarPin(usuarioId: string, pin: string): Promise<boolean>;
  ativarBiometria(usuarioId: string, ativa: boolean): Promise<Usuario>;
  vincularAluno(usuarioId: string, codigo: string): Promise<Aluno>;
  dispositivos(usuarioId: string): Promise<Dispositivo[]>;
  encerrarDispositivo(id: string): Promise<void>;
  atualizarNotificacoes(usuarioId: string, prefs: PreferenciasNotificacao): Promise<Usuario>;
}

export interface ResumoCarteira {
  aluno: Aluno;
  conta: Conta;
  cartoes: Cartao[];
  lojas: Loja[];
  ultimas: Transacao[];
  gastoNoDiaCentavos: number;
  restanteHojeCentavos: number;
}

export interface FiltrosExtrato {
  lojaId?: LojaId | 'todas';
  tipo?: 'todos' | 'debito' | 'credito';
  periodo?: '7d' | '30d' | '90d' | 'tudo';
  busca?: string;
}

export interface ResumoMensal {
  mes: string;
  totalCentavos: number;
  totalMesAnteriorCentavos: number;
  porLoja: { lojaId: LojaId; nome: string; totalCentavos: number }[];
}

export interface CarteiraApi {
  resumo(alunoId: string): Promise<ResumoCarteira>;
  transacoes(contaId: string, filtros?: FiltrosExtrato): Promise<Transacao[]>;
  transacao(id: string): Promise<Transacao>;
  contestar(id: string, motivo: string): Promise<Transacao>;
  resumoMensal(contaId: string, mes?: string): Promise<ResumoMensal>;
  exportarCsv(contaId: string, filtros?: FiltrosExtrato): Promise<string>;
  exportarHtml(contaId: string, filtros?: FiltrosExtrato): Promise<string>;
}

export interface CartoesApi {
  listar(contaId: string): Promise<Cartao[]>;
  /** Só um cartão fica ativo por vez na conta. */
  ativar(cartaoId: string): Promise<Cartao[]>;
  alternarBloqueio(cartaoId: string, bloquear: boolean): Promise<Cartao>;
  solicitarSegundaVia(contaId: string): Promise<Cartao>;
  qrDinamico(contaId: string): Promise<{ codigo: string; expiraEm: string }>;
}

export interface CobrancaPix {
  id: string;
  brcode: string;
  valorCentavos: number;
  expiraEm: string;
}

export interface RecargasApi {
  criarPix(contaId: string, valorCentavos: number): Promise<CobrancaPix>;
  /** Simula o webhook de confirmação do PSP. */
  confirmarPix(cobrancaId: string): Promise<Transacao>;
  pagarComCredito(
    contaId: string,
    valorCentavos: number,
    tokenCartao: string,
  ): Promise<Transacao>;
  configurarAutomatica(contaId: string, config: RecargaAutomatica): Promise<Conta>;
  historico(alunosIds: string[]): Promise<Transacao[]>;
}

export interface PedidoPagamento {
  contaId: string;
  lojaId: LojaId;
  valorCentavos: number;
  itens?: ItemPdv[];
  forma: 'cartao' | 'qrcode';
  pin?: string;
  /** Biometria validada pelo próprio aparelho substitui o PIN. */
  biometria?: boolean;
  cobrancaId?: string;
  chaveIdempotencia: string;
}

export interface PagamentosApi {
  cobrancaAberta(lojaId: LojaId): Promise<Cobranca | null>;
  autorizar(pedido: PedidoPagamento): Promise<Transacao>;
}

export interface LojistaApi {
  abrirCobranca(
    lojaId: LojaId,
    operadorId: string,
    valorCentavos: number,
    itens: ItemPdv[],
  ): Promise<Cobranca>;
  cancelarCobranca(id: string): Promise<void>;
  filaDoDia(lojaId: LojaId): Promise<Transacao[]>;
  estornar(
    transacaoId: string,
    justificativa: string,
    senhaOperador: string,
    operadorId: string,
  ): Promise<Transacao>;
  fechamento(lojaId: LojaId): Promise<FechamentoCaixa>;
}

export interface ResponsavelApi {
  alunos(usuarioId: string): Promise<{ aluno: Aluno; conta: Conta; gastoNoDiaCentavos: number }[]>;
  definirLimites(contaId: string, limites: Limites): Promise<Conta>;
  bloquearLoja(contaId: string, lojaId: LojaId, bloquear: boolean): Promise<Conta>;
}

export interface MetricasAdmin {
  saldoEmCustodiaCentavos: number;
  volumeMesCentavos: number;
  ticketMedioCentavos: number;
  transacoesMes: number;
  alunosAtivos: number;
  porLoja: { lojaId: LojaId; nome: string; totalCentavos: number; quantidade: number }[];
  horariosPico: { hora: number; quantidade: number }[];
  conciliacao: { lojaId: LojaId; nome: string; aRepassarCentavos: number }[];
}

export interface AdminApi {
  metricas(): Promise<MetricasAdmin>;
  alunos(): Promise<{ aluno: Aluno; conta: Conta }[]>;
  lojas(): Promise<Loja[]>;
  operadores(): Promise<Usuario[]>;
  auditoria(): Promise<{ id: string; autor: string; acao: string; criadoEm: string }[]>;
}

export interface NovaSolicitacao {
  responsavel: SolicitacaoConta['responsavel'];
  aluno: SolicitacaoConta['aluno'];
  consentimentoLgpd: boolean;
}

export interface SolicitacoesApi {
  /** Enviada pelo responsável, sem login. */
  criar(dados: NovaSolicitacao): Promise<SolicitacaoConta>;
  /** Consulta pública pelo número de protocolo. */
  consultar(protocolo: string): Promise<SolicitacaoConta | null>;
  listar(status?: StatusSolicitacao): Promise<SolicitacaoConta[]>;
  /** Cria aluno, conta, cartão e o acesso do responsável de uma vez. */
  aprovar(id: string, avaliadorId: string): Promise<SolicitacaoConta>;
  recusar(id: string, avaliadorId: string, motivo: string): Promise<SolicitacaoConta>;
}

export interface NotificacoesApi {
  listar(usuarioId: string): Promise<Notificacao[]>;
  marcarComoLidas(usuarioId: string): Promise<void>;
}

export class ErroApi extends Error {
  constructor(
    message: string,
    readonly codigo: string = 'erro_generico',
    readonly detalhes?: unknown,
  ) {
    super(message);
    this.name = 'ErroApi';
  }
}
