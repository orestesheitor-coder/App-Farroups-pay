/** Tipos do domínio Farroups-pay. Valores monetários sempre em centavos (inteiro). */

export type Perfil = 'aluno' | 'responsavel' | 'lojista' | 'admin';

export type LojaId = 'bar-do-ze' | 'la-brunita' | 'saude-no-copo';

export interface Loja {
  id: LojaId;
  nome: string;
  descricao: string;
  /** Sigla de duas letras usada no ícone da loja. */
  sigla: string;
  /** Faixa de funcionamento em horário de Brasília, formato HH:MM. */
  abre: string;
  fecha: string;
  /** Estabelecimento autorizado a receber pelo Farroups-pay. */
  autorizada: boolean;
  itensFrequentes: ItemPdv[];
}

export interface ItemPdv {
  nome: string;
  valorCentavos: number;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  turma: string;
  contaId: string;
  responsavelIds: string[];
  /** Aluno maior de idade pode ser o próprio responsável financeiro. */
  maiorDeIdade: boolean;
}

export interface Conta {
  id: string;
  alunoId: string;
  /** Nunca negativo. Sem crédito, sem cheque especial. */
  saldoCentavos: number;
  ativa: boolean;
  limites: Limites;
  recargaAutomatica: RecargaAutomatica | null;
}

export interface Limites {
  /** Teto de gasto por dia civil (America/Sao_Paulo). */
  diarioCentavos: number;
  /** Teto por compra individual. */
  porTransacaoCentavos: number;
  /** Lojas que o responsável bloqueou para este aluno. */
  lojasBloqueadas: LojaId[];
}

export interface RecargaAutomatica {
  ativa: boolean;
  gatilhoCentavos: number;
  valorCentavos: number;
}

export type TipoCartao = 'virtual' | 'fisico';

export interface Cartao {
  id: string;
  contaId: string;
  tipo: TipoCartao;
  ultimos4: string;
  titular: string;
  turma: string;
  bloqueado: boolean;
  /** Somente um cartão ativo por vez em cada modalidade. */
  ativo: boolean;
  criadoEm: string;
}

export type TipoTransacao = 'debito' | 'credito' | 'estorno';
export type StatusTransacao = 'aprovada' | 'recusada' | 'pendente' | 'estornada';
export type MetodoRecarga = 'pix' | 'credito';
export type FormaPagamento = 'cartao' | 'qrcode';

export interface Transacao {
  id: string;
  contaId: string;
  tipo: TipoTransacao;
  status: StatusTransacao;
  valorCentavos: number;
  criadaEm: string;
  descricao: string;
  lojaId?: LojaId;
  metodo?: MetodoRecarga;
  forma?: FormaPagamento;
  itens?: ItemPdv[];
  operadorId?: string;
  motivoRecusa?: MotivoRecusa;
  mensagemRecusa?: string;
  /** Aponta para a transação original quando tipo === 'estorno'. */
  transacaoOriginalId?: string;
  estornadaPorId?: string;
  contestada?: boolean;
  chaveIdempotencia: string;
  lancamentoId?: string;
}

export type MotivoRecusa =
  | 'conta_inativa'
  | 'cartao_bloqueado'
  | 'loja_nao_autorizada'
  | 'loja_bloqueada_responsavel'
  | 'loja_fechada'
  | 'saldo_insuficiente'
  | 'limite_transacao'
  | 'limite_diario'
  | 'valor_invalido'
  | 'pin_incorreto'
  | 'transacao_duplicada';

/** Ledger imutável de dupla entrada: a soma dos débitos é igual à dos créditos. */
export interface Lancamento {
  id: string;
  criadoEm: string;
  descricao: string;
  transacaoId: string;
  linhas: LinhaLancamento[];
}

export interface LinhaLancamento {
  conta: string;
  tipo: 'D' | 'C';
  valorCentavos: number;
}

export interface Cobranca {
  id: string;
  lojaId: LojaId;
  operadorId: string;
  valorCentavos: number;
  itens: ItemPdv[];
  criadaEm: string;
  status: 'aberta' | 'paga' | 'cancelada';
  transacaoId?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  /** Aluno vinculado (perfil aluno) ou alunos sob responsabilidade. */
  alunoId?: string;
  alunosIds?: string[];
  lojaId?: LojaId;
  temPin: boolean;
  biometriaAtiva: boolean;
  notificacoes: PreferenciasNotificacao;
}

export type ModoNotificacao = 'toda_compra' | 'acima_de' | 'resumo_diario' | 'nenhuma';

export interface PreferenciasNotificacao {
  modo: ModoNotificacao;
  acimaDeCentavos: number;
  recargas: boolean;
}

export interface Notificacao {
  id: string;
  usuarioId: string;
  titulo: string;
  corpo: string;
  criadaEm: string;
  lida: boolean;
  transacaoId?: string;
}

export interface Sessao {
  token: string;
  refreshToken: string;
  expiraEm: string;
  usuario: Usuario;
  dispositivo: string;
}

export interface Dispositivo {
  id: string;
  nome: string;
  ultimoAcesso: string;
  atual: boolean;
}

export interface ResumoDia {
  dia: string;
  totalCentavos: number;
  quantidade: number;
}

export interface FechamentoCaixa {
  lojaId: LojaId;
  turno: string;
  abertura: string;
  fechamento: string;
  totalCentavos: number;
  quantidade: number;
  estornosCentavos: number;
  ticketMedioCentavos: number;
}
