/*
  Farroups Pay - Terminal RFID
  Config exemplo - copie para config.h e preencha com seus dados
*/
#ifndef CONFIG_H
#define CONFIG_H

// REDE WI-FI
#define WIFI_SSID           "NOME_DA_REDE"
#define WIFI_PASSWORD       "SENHA_DA_REDE"

// SERVIDOR (site pronto)
#define SERVIDOR_BASE_URL   "https://seu-site.com.br"
#define ROTA_COBRANCA       "/api/terminal/charge"
#define ROTA_CONSULTA       "/api/terminal/lookup"
#define ROTA_ESTORNO        "/api/terminal/void"
#define ROTA_PING           "/api/terminal/health"

// DISPOSITIVO
#define DEVICE_ID           "cantina-01"
#define DEVICE_SECRET       "segredo-aleatorio-de-64-caracteres"

// HTTP
#define HTTP_TIMEOUT_MS     8000
#define HTTP_TENTATIVAS     3
#define VALIDAR_CERTIFICADO 0

// COMPORTAMENTO
#define VALOR_PADRAO_CENTAVOS   750
#define VALOR_MAXIMO_CENTAVOS   10000
#define TEMPO_RESULTADO_MS      3000
#define COOLDOWN_MESMO_CARTAO_MS 4000
#define FUSO_HORARIO_HORAS      -3

// PINOS RFID (SPI: SCK=18, MISO=19, MOSI=23)
#define PINO_RST_RFID       27
#define NUM_LEITORES        1
static const uint8_t PINOS_SS_RFID[NUM_LEITORES] = { 5 };

// DISPLAY LCD 16x2 I2C
#define USAR_LCD            1
#define LCD_ENDERECO_I2C    0x27
#define LCD_COLUNAS         16
#define LCD_LINHAS          2
#define PINO_SDA            21
#define PINO_SCL            22

// LEDS E BUZZER
#define PINO_LED_VERDE      25
#define PINO_LED_VERMELHO   26
#define PINO_BUZZER         33

// TECLADO (opcional)
#define USAR_TECLADO        0
#define TECLADO_LINHAS      4
#define TECLADO_COLUNAS     4
static const uint8_t PINOS_LINHAS_TECLADO[TECLADO_LINHAS] = { 13, 12, 14, 32 };
static const uint8_t PINOS_COLUNAS_TECLADO[TECLADO_COLUNAS] = { 16, 17, 4, 2 };

// TOKEN CARTAO (opcional, avancado)
#define USAR_TOKEN_CARTAO   0
#define BLOCO_TOKEN_CARTAO  4
static const uint8_t CHAVE_A_CARTAO[6] = { 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF };

#endif
