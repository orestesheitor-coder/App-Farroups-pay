/*
  Farroups Pay - Terminal RFID com Arduino Uno + WiFi Shield
  =====================================================================
  Hardware:
  - Arduino Uno R3
  - MFRC522 RFID Reader (SPI: pins 10-13)
  - WiFi Shield (Ethernet Shield ou Arduino WiFi Shield)
  - Display LCD 16x2 I2C (A4=SDA, A5=SCL)
  - LEDs + Buzzer (pins 6, 7, 8)

  Nota: Arduino Uno tem apenas 2KB de RAM. Codigo otimizado para
  minima alocacao dinamica de memoria.
  =====================================================================
*/

#include "config.h"
#include "rfid.h"
#include "ui.h"

// Estado da maquina
enum Estado {
  ESTADO_OCIOSO,
  ESTADO_PROCESSANDO,
  ESTADO_RESULTADO
};

Estado estadoAtual = ESTADO_OCIOSO;
unsigned long tempoResultado = 0;
static long valorCentavos = VALOR_PADRAO_CENTAVOS;

void setup() {
  Serial.begin(9600);
  delay(1000);

  Serial.println("\n=== FARROUPS PAY - ARDUINO UNO ===");
  Serial.print("Device: ");
  Serial.println(DEVICE_ID);

  // Inicializa componentes
  uiIniciar();
  rfidIniciar();

  // TODO: Conectar WiFi Shield
  // WiFiManager ou manualmente com WiFi.begin()

  Serial.println("Setup completo!");
}

void loop() {
  // Maquina de estados simples
  switch (estadoAtual) {
    case ESTADO_OCIOSO:
      processarOcioso();
      break;

    case ESTADO_PROCESSANDO:
      // Aguardar resposta do servidor
      break;

    case ESTADO_RESULTADO:
      if (millis() - tempoResultado > TEMPO_RESULTADO_MS) {
        estadoAtual = ESTADO_OCIOSO;
        uiLimparLeds();
      }
      break;
  }

  delay(100);
}

void processarOcioso() {
  LeituraCartao leitura = rfidVerificar();

  if (leitura.valida) {
    Serial.print("[MAIN] Cartao lido: ");
    Serial.println(leitura.uid);

    uiBipLeitura();
    estadoAtual = ESTADO_PROCESSANDO;
    uiTelaProcessando();

    // TODO: Fazer requisicao HTTP para o servidor
    // - POST para ROTA_COBRANCA
    // - Enviar uid + valorCentavos + assinatura HMAC
    // - Receber resposta: APROVADO ou RECUSADO + saldo

    // Exemplo (para teste):
    simularAprovado(leitura.uid);
  }
}

void simularAprovado(const String &uid) {
  (void)uid;  // Suprimir warning de parametro nao usado

  delay(2000);  // Simular delay da rede

  uiTelaAprovado(valorCentavos, 5000);  // Saldo ficticio: R$ 50,00
  uiSinalAprovado();

  estadoAtual = ESTADO_RESULTADO;
  tempoResultado = millis();
}

void simularRecusado() {
  delay(2000);

  uiTelaRecusado("Saldo baixo", 500);  // R$ 5,00
  uiSinalRecusado();

  estadoAtual = ESTADO_RESULTADO;
  tempoResultado = millis();
}
