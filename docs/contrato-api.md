# Contrato da API

Referência para implementar o backend que substitui o mock. A fonte da verdade é
`src/services/types.ts`; este documento mapeia cada método para um endpoint sugerido.

Regras que valem para todos os endpoints:

- Valores monetários são **inteiros em centavos**. Nada de float.
- Datas em ISO 8601 com fuso; a interface formata em `DD/MM/AAAA` no fuso
  `America/Sao_Paulo`.
- Erros respondem `{ "codigo": "saldo_insuficiente", "mensagem": "Saldo insuficiente — faltam R$ 3,50." }`.
  A mensagem é exibida ao usuário como veio: escreva em português claro, nunca um código.
- Rotas de recarga e pagamento exigem `Idempotency-Key`; repetir a chave devolve a
  transação já criada, sem novo débito.

## Autenticação

| Método | Endpoint | Observações |
| --- | --- | --- |
| `auth.entrar` | `POST /sessoes` | Aceita matrícula ou e-mail. Devolve token curto + refresh |
| `auth.restaurarSessao` | `POST /sessoes/refresh` | |
| `auth.sair` | `DELETE /sessoes/atual` | |
| `auth.definirPin` | `PUT /usuarios/{id}/pin` | Envie o hash; o servidor aplica argon2id |
| `auth.validarPin` | `POST /usuarios/{id}/pin/validar` | Rate limit obrigatório |
| `auth.ativarBiometria` | `PUT /usuarios/{id}/biometria` | |
| `auth.vincularAluno` | `POST /responsaveis/{id}/alunos` | Código emitido pela secretaria |
| `auth.dispositivos` | `GET /usuarios/{id}/dispositivos` | |
| `auth.encerrarDispositivo` | `DELETE /dispositivos/{id}` | Logout remoto |
| `auth.atualizarNotificacoes` | `PUT /usuarios/{id}/notificacoes` | |

## Carteira

| Método | Endpoint |
| --- | --- |
| `carteira.resumo` | `GET /alunos/{id}/carteira` |
| `carteira.transacoes` | `GET /contas/{id}/transacoes?loja=&tipo=&periodo=&busca=` |
| `carteira.transacao` | `GET /transacoes/{id}` |
| `carteira.contestar` | `POST /transacoes/{id}/contestacoes` |
| `carteira.resumoMensal` | `GET /contas/{id}/resumo-mensal?mes=AAAA-MM` |
| `carteira.exportarCsv` / `exportarHtml` | `GET /contas/{id}/extrato.csv` e `.html` |

## Cartões

| Método | Endpoint |
| --- | --- |
| `cartoes.listar` | `GET /contas/{id}/cartoes` |
| `cartoes.ativar` | `PUT /cartoes/{id}/ativo` |
| `cartoes.alternarBloqueio` | `PUT /cartoes/{id}/bloqueio` |
| `cartoes.solicitarSegundaVia` | `POST /contas/{id}/cartoes/segunda-via` |
| `cartoes.qrDinamico` | `POST /contas/{id}/qr` (validade de 60s) |

## Recargas

| Método | Endpoint |
| --- | --- |
| `recargas.criarPix` | `POST /contas/{id}/recargas/pix` |
| `recargas.confirmarPix` | webhook do PSP → `POST /webhooks/psp/pix` |
| `recargas.pagarComCredito` | `POST /contas/{id}/recargas/credito` (recebe token do gateway) |
| `recargas.configurarAutomatica` | `PUT /contas/{id}/recarga-automatica` |
| `recargas.historico` | `GET /responsaveis/{id}/recargas` |

O app **nunca** envia número, validade ou CVV ao backend: o gateway tokeniza no
dispositivo e só o token trafega.

## Pagamentos

| Método | Endpoint |
| --- | --- |
| `pagamentos.cobrancaAberta` | `GET /lojas/{id}/cobrancas/aberta` |
| `pagamentos.autorizar` | `POST /pagamentos` |

`POST /pagamentos` recebe conta, loja, valor, itens, forma (`cartao` ou `qrcode`),
`cobrancaId` opcional e a autorização (PIN ou biometria). O servidor revalida **todas**
as regras de `src/domain/regras.ts` — o app apenas antecipa o resultado para dar
feedback rápido. Ordem das recusas: conta inativa, cartão bloqueado, loja não
autorizada, loja bloqueada pelo responsável, loja fechada, limite por transação,
limite diário, saldo insuficiente.

## Lojista

| Método | Endpoint |
| --- | --- |
| `lojista.abrirCobranca` | `POST /lojas/{id}/cobrancas` |
| `lojista.cancelarCobranca` | `DELETE /cobrancas/{id}` |
| `lojista.filaDoDia` | `GET /lojas/{id}/transacoes?dia=hoje` |
| `lojista.estornar` | `POST /transacoes/{id}/estornos` (justificativa + senha do operador, 24h) |
| `lojista.fechamento` | `GET /lojas/{id}/fechamento` |

## Responsável e colégio

| Método | Endpoint |
| --- | --- |
| `responsavel.alunos` | `GET /responsaveis/{id}/alunos` |
| `responsavel.definirLimites` | `PUT /contas/{id}/limites` |
| `responsavel.bloquearLoja` | `PUT /contas/{id}/lojas/{loja}` |
| `admin.metricas` | `GET /admin/metricas` |
| `admin.alunos` / `lojas` / `operadores` | `GET /admin/...` |
| `admin.auditoria` | `GET /admin/auditoria` |

Toda ação administrativa entra no log de auditoria com autor, ação e data.

## Ledger

O backend deve escriturar as mesmas contas do mock:

```
ativo:caixa_psp
passivo:aluno:<contaId>
passivo:loja:<lojaId>
```

Recarga: D caixa / C aluno. Compra: D aluno / C loja. Estorno: D loja / C aluno,
sempre como lançamento novo. Repasse: D loja / C caixa. Débitos e créditos de um
lançamento precisam fechar; um lançamento desbalanceado é erro de programação.
