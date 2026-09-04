/*
  Farroups Pay - Terminal RFID
  ---------------------------------------------------------------
  COPIE ESTE ARQUIVO PARA "config.h" E PREENCHA COM OS SEUS DADOS.
  O arquivo config.h esta no .gitignore para as senhas/segredos
  nunca irem parar no GitHub.
  ---------------------------------------------------------------
*/
#ifndef CONFIG_H
#define CONFIG_H

// =================================================================
// 1) REDE WI-FI
// =================================================================
#define WIFI_SSID           "NOME_DA_REDE_DO_COLEGIO"
#define WIFI_PASSWORD       "SENHA_DA_REDE"

// =================================================================
// 2) SERVIDOR (o site que ja esta pronto)
// =================================================================
// Use https:// em producao. Sem barra "/" no final.
#define SERVIDOR_BASE_URL   "https://seu-site.com.br"

// Caminhos da API (veja docs/API.md). Mude aqui se o site usar outros.
#define ROTA_COBRANCA       "/api/terminal/charge"
#define ROTA_CONSULTA       "/api/terminal/lookup"
#define ROTA_ESTORNO        "/api/terminal/void"
#define ROTA_PING           "/api/terminal/health"

// Identificacao desta maquina. Cada terminal (cantina, papelaria,
// biblioteca...) deve ter um DEVICE_ID diferente.
#define DEVICE_ID           "cantina-01"

// Segredo compartilhado com o servidor. Serve para assinar cada
// requisicao (HMAC-SHA256) e provar que a cobranca veio mesmo
// desta maquina, e nao de alguem chamando a API pelo navegador.
// Gere um valor aleatorio longo, ex.: openssl rand -hex 32
#define DEVICE_SECRET       "troque-por-um-segredo-aleatorio-de-64-caracteres"

// Timeout de cada requisicao HTTP (ms) e numero de tentativas.
#define HTTP_TIMEOUT_MS     8000
#define HTTP_TENTATIVAS     3

// TLS:
//  - 1 = valida o certificado do servidor usando SERVIDOR_ROOT_CA (recomendado)
//  - 0 = aceita qualquer certificado (setInsecure). So use em testes /
//        laboratorio, pois permite ataque de "man in the middle".
#define VALIDAR_CERTIFICADO 0

// Cole aqui o certificado raiz da CA do seu site (formato PEM) se
// VALIDAR_CERTIFICADO for 1. Ex.: ISRG Root X1 para Let's Encrypt.
static const char SERVIDOR_ROOT_CA[] PROGMEM = R"CERT(
-----BEGIN CERTIFICATE-----
...cole aqui o certificado raiz...
-----END CERTIFICATE-----
)CERT";

// =================================================================
// 3) COMPORTAMENTO DO TERMINAL
// =================================================================
// Valor cobrado por padrao, em CENTAVOS (750 = R$ 7,50).
// Pode ser alterado em tempo de execucao pelo teclado ou pelo Serial.
#define VALOR_PADRAO_CENTAVOS   750

// Valor maximo aceito numa unica cobranca (trava de seguranca).
#define VALOR_MAXIMO_CENTAVOS   10000

// Tempo que o resultado (APROVADO/RECUSADO) fica na tela (ms).
#define TEMPO_RESULTADO_MS      3000

// Tempo minimo entre duas leituras do MESMO cartao (ms).
// Evita cobrar duas vezes se o aluno demorar a tirar o cracha.
#define COOLDOWN_MESMO_CARTAO_MS 4000

// Fuso horario para o relogio (NTP). -3 = horario de Brasilia.
#define FUSO_HORARIO_HORAS      -3

// =================================================================
// 4) PINOS - LEITORES RFID (MFRC522, barramento SPI compartilhado)
// =================================================================
// SPI do ESP32: SCK=18, MISO=19, MOSI=23 (fixos no hardware)
#define PINO_RST_RFID       27

// Quantos leitores estao ligados nesta maquina (1 a 4).
// Todos compartilham SCK/MISO/MOSI/RST; muda apenas o pino SS/SDA.
#define NUM_LEITORES        1
static const uint8_t PINOS_SS_RFID[NUM_LEITORES] = { 5 };
// Exemplo com 2 leitores (ex.: fila da direita e da esquerda):
//   #define NUM_LEITORES 2
//   static const uint8_t PINOS_SS_RFID[NUM_LEITORES] = { 5, 15 };

// =================================================================
// 5) PINOS - INTERFACE (display, LEDs, buzzer)
// =================================================================
#define USAR_LCD            1       // 1 = display LCD 16x2 I2C
#define LCD_ENDERECO_I2C    0x27    // 0x27 ou 0x3F (varia com o modulo)
#define LCD_COLUNAS         16
#define LCD_LINHAS          2
#define PINO_SDA            21
#define PINO_SCL            22

#define PINO_LED_VERDE      25
#define PINO_LED_VERMELHO   26
#define PINO_BUZZER         33      // buzzer ativo ou passivo (usa tone())

// =================================================================
// 6) TECLADO NUMERICO (opcional)
// =================================================================
// 0 = sem teclado (valor definido por VALOR_PADRAO_CENTAVOS e pelo
//     monitor Serial). 1 = teclado matricial 4x4.
// ATENCAO: confira se os GPIOs escolhidos estao livres na sua placa.
// O GPIO12 e de boot (strapping); se der problema para ligar, troque.
#define USAR_TECLADO        0
#define TECLADO_LINHAS      4
#define TECLADO_COLUNAS     4
static const uint8_t PINOS_LINHAS_TECLADO[TECLADO_LINHAS]  = { 13, 12, 14, 32 };
static const uint8_t PINOS_COLUNAS_TECLADO[TECLADO_COLUNAS] = { 16, 17, 4, 2 };

// =================================================================
// 7) SEGUNDO FATOR NO CARTAO (opcional, avancado)
// =================================================================
// O UID de um MIFARE Classic pode ser clonado com cartoes "UID
// gravavel". Ativando esta opcao, o terminal tambem le um token
// secreto gravado num bloco protegido do cartao e envia junto para
// o servidor conferir. Veja docs/HARDWARE.md antes de ativar.
#define USAR_TOKEN_CARTAO   0
#define BLOCO_TOKEN_CARTAO  4       // bloco de dados (setor 1, bloco 0)
// Chave A do setor (6 bytes). O padrao de fabrica e FF FF FF FF FF FF.
static const uint8_t CHAVE_A_CARTAO[6] = { 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF };

#endif // CONFIG_H
