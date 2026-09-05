# Farroups-pay

Aplicativo de pagamentos internos do **Colégio Farroupilha**. Uma carteira digital
fechada: o responsável adiciona saldo, o aluno gasta apenas nos três pontos de venda
da escola — **Bar do Zé**, **La Brunita** e **Saúde no Copo** — aproximando o cartão
da maquininha ou apresentando um QR Code.

Sem transferência entre alunos, sem saque, sem compra fora do colégio e sem saldo
negativo.

## Stack

| Camada | Escolha |
| --- | --- |
| App | React Native com Expo SDK 57 e expo-router (aluno, responsável, lojista e painel do colégio no mesmo binário, separados por perfil) |
| Estado | Context da sessão + hook `useAsync` com estados de carregando, vazio e erro |
| Dados | Camada de serviço isolada (`src/services`) com implementação **mock em memória**, persistida em AsyncStorage |
| Design | Tokens próprios (`src/theme`), tipografia Sora, ícones SVG de traço fino desenhados no projeto |
| Testes | `node --test` sobre as regras de negócio puras |

O app roda em iOS, Android e web (o painel administrativo foi pensado para a web,
mas funciona nas três plataformas).

## Como rodar

```bash
npm install
npm start          # abre o Expo (i = iOS, a = Android, w = web)
npm run web        # direto no navegador
npm run typecheck  # TypeScript em modo estrito
npm test           # regras de negócio, ledger e formatação
```

### No emulador, a partir do VS Code

Todas as dependências do projeto estão contidas no Expo Go, então o app roda no
emulador sem compilar nada de nativo — basta o servidor de desenvolvimento.

Pré-requisitos: **Node 20+**, **Git** e o **Android Studio** (que é quem fornece o
emulador; o VS Code não cria um). No macOS, o Xcode dá o simulador de iPhone.

1. Abra a pasta do projeto no VS Code.
2. Ligue o emulador no Android Studio (*Device Manager* → ▶ no aparelho virtual).
3. `Ctrl+Shift+P` → **Tasks: Run Task** → **2 · Rodar no emulador Android**.

As tarefas ficam em `.vscode/tasks.json` e cobrem também o simulador de iOS, o
navegador, a limpeza de cache do Metro e a listagem de emuladores conectados.

## Demonstração sem instalar nada

`demo/farroups-pay-ao-vivo.html` é o app inteiro reescrito em um único arquivo HTML,
rodando dentro de um chassi Android simulado — para apresentar em reunião sem
instalar Expo, SDK ou emulador. Basta abrir o arquivo no navegador.

É interativo de verdade: recarga por Pix, pagamento nas três lojas, PIN acima de
R$ 50,00, limite diário, bloqueio de cartão, estorno pelo caixa e o painel do
colégio. As regras de autorização são as mesmas de `src/domain/regras.ts`, com as
mesmas mensagens de recusa, e cada operação escreve no ledger de dupla entrada
exibido ao lado do aparelho.

Não é o app de produção: é uma vitrine de um arquivo só, com dados fictícios e sem
backend. O app de verdade continua sendo o projeto Expo deste repositório.

### A vitrine como APK

`demo/android/` é um app Android mínimo — uma `Activity` com `WebView` carregando a
vitrine dos assets, sem nenhuma dependência. O Gradle copia
`demo/farroups-pay-ao-vivo.html` para os assets antes de compilar, então o HTML
continua sendo a fonte única.

**Baixar pronto**: a cada mudança em `demo/`, o workflow *APK da demonstração*
compila e publica o arquivo em **Actions → a execução → Artifacts →
`farroups-pay-demo-apk`**. Baixe o `.zip`, extraia e instale o `.apk` no aparelho.
Também dá para disparar manualmente em Actions → *APK da demonstração* → *Run
workflow*.

**Compilar na sua máquina** (precisa do Android SDK):

```bash
cd demo/android
gradle assembleDebug        # ou ./gradlew, se você gerar o wrapper
# APK em app/build/outputs/apk/debug/
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

O APK é assinado com a chave de depuração, então o Android pede para permitir
"instalar apps de fontes desconhecidas" na primeira vez. É uma demonstração
offline: só usa rede para buscar as fontes do Google e, sem internet, cai na
fonte do sistema.

## Gerar um APK

O projeto usa *Continuous Native Generation*: as pastas `android/` e `ios/` não são
versionadas, o Expo as gera na hora do build. Há dois caminhos.

**Pelo GitHub Actions, sem conta Expo e sem Android Studio** (mais direto): o
workflow *APK do app* roda typecheck, testes, gera o projeto nativo e compila um
APK de **release** — com o JavaScript embutido, ou seja, o app roda sozinho no
aparelho, sem Metro e sem computador ligado. Baixe em **Actions → APK do app → a
execução → Artifacts → `farroups-pay-apk`**, ou dispare manualmente em *Run
workflow*. A primeira compilação leva de 20 a 40 minutos porque o React Native
com a nova arquitetura compila o C++ de cada módulo; as seguintes reaproveitam o
cache do Gradle.

O APK é assinado com a chave de depuração que o Expo configura por padrão, então
o Android pede para permitir "fontes desconhecidas" na primeira instalação.

**Pelo EAS, com conta Expo** (útil quando quiser assinatura gerenciada e
distribuição interna):

```bash
npm install -g eas-cli
eas login                                   # conta Expo gratuita
eas build:configure                         # só na primeira vez, vincula o projeto
eas build --platform android --profile preview
```

O perfil `preview` já está configurado em `eas.json` para gerar **APK** (e não AAB),
instalável direto no aparelho. Ao terminar, o EAS devolve um link de download e um QR
Code. A fila gratuita costuma levar de 10 a 25 minutos.

**Localmente**, com Android Studio (SDK 36) e JDK 17+ instalados:

```bash
npx expo run:android --variant release      # compila e instala no aparelho conectado
# ou, para ficar com o arquivo em mãos:
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK em android/app/build/outputs/apk/release/
```

Um APK de release precisa de assinatura: o EAS gera e guarda a keystore para você; no
build local, o Gradle usa a keystore de debug se você não configurar uma própria.

## Contas de demonstração

Senha de todas: `farroupilha`. A tela de login tem atalhos para cada uma.

| Perfil | Login | O que dá para ver |
| --- | --- | --- |
| Aluna | `helena@farroupilha.br` (matrícula `2026081`) | Carteira, cartão, pagamento nas lojas, extrato |
| Responsável | `camila@farroupilha.br` | Dois alunos, limites, bloqueio de loja, recargas |
| Lojista | `ze@barodoze.com.br` | Cobrança, fila do dia, estorno, fechamento de caixa |
| Colégio | `secretaria@farroupilha.br` | Fila de pedidos de conta, métricas, conciliação e auditoria |

No primeiro acesso de aluno e responsável o app pede a criação do PIN (4 ou 6
dígitos). Códigos de vínculo de aluno: `8ANO-HELENA` e `5ANO-BENTO`.

Em **Perfil → Recomeçar demonstração** a base volta ao estado inicial.

## Identidade por faixa etária

A marca do colégio é azul e branca; o vermelho entra como acento. Sobre essa
base, o app se veste conforme a idade de quem entrou — a paleta inteira troca,
não só um detalhe:

| Faixa | Turmas | Paleta |
| --- | --- | --- |
| Infantil | até o 5º ano | Branco e azul bebê, com nuvens, estrelas e folhas no fundo |
| Padrão | 6º ao 9º ano | Azul institucional, branco e vermelho |
| Profissional | Ensino Médio | Preto, cinza e branco, com azul-aço discreto |

O segmento é um dado do aluno (`Aluno.segmento`), derivável da turma por
`segmentoDaTurma`. Perfis adultos — responsável, lojista e secretaria — usam
sempre a paleta padrão. A marca do colégio acompanha o uso: fixa no cartão e
discreta no canto de cada tela.

## Abertura de conta

Ninguém se cadastra sozinho numa carteira fechada de escola. O fluxo tem dois
lados:

1. **O responsável solicita** — formulário público em *Solicitar conta*, com os
   dados dele, os do estudante e o consentimento LGPD. Sai um número de
   protocolo; nada é criado ainda.
2. **A secretaria aprova** — em *Painel → Pedidos*, confere a matrícula contra o
   sistema acadêmico e aprova. A aprovação cria de uma vez o aluno, a conta, o
   cartão virtual e o acesso do responsável, devolvendo o código de vínculo e
   uma senha provisória para entregar. Recusar exige motivo. Tudo entra na
   auditoria.

Os limites da conta nova saem do segmento: R$ 30/dia no infantil, R$ 50 no
padrão, R$ 80 no Ensino Médio.

## Parâmetros de negócio

Confirmados antes da implementação e centralizados em `src/domain/regras.ts`:

- Valores rápidos de recarga: R$ 20 / 50 / 100 / 200 (mínimo R$ 5, máximo R$ 1.000).
- Métodos de recarga: **Pix** (QR + copia e cola, confirmação automática) e
  **cartão de crédito** (tokenizado pelo gateway). Boleto ficou de fora.
- Compras acima de **R$ 50,00** exigem PIN ou biometria.
- Limite diário padrão R$ 50,00 e limite por compra R$ 30,00, ajustáveis pelo responsável.
- Estorno pelo caixa em até **24 horas**, com justificativa e senha do operador.
- Limites zeram à meia-noite no fuso `America/Sao_Paulo`.

## Arquitetura

```
app/                  rotas (expo-router)
  (auth)/             login, criação de PIN, vínculo de aluno
  (aluno)/            carteira, cartão, extrato, perfil
  (responsavel)/      alunos, limites por aluno, recargas
  (lojista)/          cobrar, fila do dia, fechamento de caixa
  admin/              painel do colégio
  recarga/            valor, Pix, cartão, sucesso, recarga automática
  pagar/[loja].tsx    pagamento na maquininha (aproximação ou QR)
  transacao/[id].tsx  comprovante e contestação
src/
  domain/             tipos, regras de autorização e ledger de dupla entrada
  services/           contrato da API + implementação mock
  state/              sessão e perfil ativo
  theme/              tokens de cor, tipografia, raio e sombra
  ui/                 componentes (botões, campos, folhas, estados, cartão 3D)
  features/           blocos de tela reaproveitados entre perfis
tests/                testes das regras puras
```

### Trocar o mock pela API real

Toda a interface conversa com `api`, exportado por `src/services/index.ts`, que
implementa a interface `Api` de `src/services/types.ts`. Para plugar o backend:

1. Escreva `src/services/http/index.ts` implementando a mesma interface `Api`
   (mesmos métodos, mesmos tipos de entrada e saída).
2. Troque a exportação em `src/services/index.ts` — por exemplo, escolhendo pelo
   valor de `process.env.EXPO_PUBLIC_API_URL`.

Nenhuma tela precisa mudar: elas não sabem de onde os dados vêm.

### Ledger

Toda operação financeira gera um lançamento de dupla entrada imutável
(`src/domain/ledger.ts`). O colégio é custodiante:

- **Recarga**: débito em `ativo:caixa_psp`, crédito em `passivo:aluno:<conta>`.
- **Compra**: débito no aluno, crédito em `passivo:loja:<loja>`.
- **Estorno**: lançamento novo e inverso — nada é apagado.
- **Repasse**: débito na loja, crédito no caixa.

O saldo em custódia e a conciliação por loja do painel administrativo são calculados
a partir do ledger, não de um campo solto. Pagamentos e recargas são idempotentes:
a mesma chave nunca debita duas vezes.

## Segurança e LGPD

O que está implementado no app:

- Sessão com token curto + refresh, logout remoto de dispositivos.
- PIN e senha guardados apenas como hash — nunca em texto puro.
- Biometria via `expo-local-authentication` (APIs nativas do sistema).
- Número completo do cartão nunca é exibido; a recarga no crédito gera um token e
  não guarda dados do cartão no dispositivo.
- Política de privacidade acessível dentro do app, com o mínimo de dados coletados e
  consentimento do responsável.

O que depende do backend real: TLS com *certificate pinning*, rate limiting nas rotas
de recarga e pagamento, gateway PCI-DSS e push via Firebase/Expo Notifications. O
mock simula latência, recusas e webhooks, mas não substitui esses controles.

## Critérios de aceite

| Critério | Onde conferir |
| --- | --- |
| Login → recarga Pix → saldo atualizado → pagar nas três lojas → extrato | Percurso completo do perfil Aluna |
| Responsável define limite diário e a compra acima dele é recusada com mensagem clara | Responsável → Ajustar → limite; depois pagar como aluna ("Limite diário atingido — restam R$ X") |
| Bloquear o cartão impede novas transações imediatamente | Cartão → Bloquear; a próxima compra recusa com "Cartão bloqueado" |
| 360px a 430px, claro e escuro | Layout com largura máxima de 460px e centralização; tema em Perfil → Aparência |
| Português do Brasil, R$ 0,00 e DD/MM/AAAA | `src/lib/format.ts` e os testes em `tests/format.test.mjs` |
| Carregando, vazio e erro em todas as telas | `Esqueleto`, `EstadoVazio` e `EstadoErro` em `src/ui/Estados.tsx` |
| Acessibilidade | Rótulos em todos os controles, áreas de toque de 44px, contraste AA nos dois temas |

## Limites desta entrega

- Os dados são de demonstração e vivem no dispositivo: não há backend, PSP nem push real.
- NFC é representado pelo fluxo de aproximação na tela de pagamento; a leitura física
  depende do hardware da maquininha e do build nativo.
- A exportação em PDF usa `expo-print`; o CSV é copiado para a área de transferência.
- O painel administrativo roda dentro do mesmo app (ideal na web); um painel web
  separado em React + Tailwind pode consumir a mesma interface `Api`.
