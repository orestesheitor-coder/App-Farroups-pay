/*
  Farroups Pay - Terminal RFID para Pagamentos
  =====================================================================
  ESP32 + MFRC522 (leitor RFID) + Display LCD 16x2

  Funcionalidades:
  - Leitura de cracha RFID (MIFARE Classic)
  - Comunicacao HTTPS com servidor
  - Interface LCD com LEDs e buzzer
  - Modo consulta de saldo
  - Suporte a multiplos leitores RFID
  - Validacao de certificado TLS (opcional)

  Veja config.h para configuracao e config.example.h para documentacao.
  =====================================================================
*/

#include "config.h"
#include "rfid.h"
#include "ui.h"

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n=== FARROUPS PAY TERMINAL ===");
  Serial.printf("Device: %s\n", DEVICE_ID);
  Serial.printf("Servidor: %s\n", SERVIDOR_BASE_URL);

  // Inicializa componentes
  uiIniciar();
  rfidIniciar();

  // TODO: Conectar Wi-Fi
  // TODO: Sincronizar relogio NTP
  // TODO: Inicializar teclado (se USAR_TECLADO)

  Serial.println("Setup concluido!");
}

void loop() {
  // TODO: Implementar maquina de estados:
  // 1. Aguardar leitura de cartao (telaOciosa)
  // 2. Processar cobranca (telaProcessando)
  // 3. Mostrar resultado (telaAprovado/telaRecusado)

  LeituraCartao leitura = rfidVerificar();
  if (leitura.valida) {
    Serial.printf("[MAIN] Cartao lido no leitor %d: %s\n",
                  leitura.leitor, leitura.uid.c_str());
    uiBipLeitura();

    // Exemplo: mostrar saldo
    // uiTelaSaldo("Joao Silva", 5000);  // R$ 50,00
    // uiSinalAprovado();
  }

  delay(100);
}
