#include <SPI.h>
#include <MFRC522.h>
#include "config.h"
#include "rfid.h"

static MFRC522 leitores[NUM_LEITORES];

static String uidParaHex(const MFRC522::Uid &uid) {
  String s;
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) s += '0';
    s += String(uid.uidByte[i], HEX);
  }
  s.toUpperCase();
  return s;
}

void rfidIniciar() {
  SPI.begin();
  for (int i = 0; i < NUM_LEITORES; i++) {
    leitores[i].PCD_Init(PINOS_SS_RFID[i], PINO_RST_RFID);
    delay(50);
    byte versao = leitores[i].PCD_ReadRegister(MFRC522::VersionReg);
    Serial.printf("[RFID] Leitor %d (SS=%d) versao 0x%02X %s\n",
                  i, PINOS_SS_RFID[i], versao,
                  (versao == 0x00 || versao == 0xFF) ? "ERRO NA FIACAO" : "OK");
  }
}

#if USAR_TOKEN_CARTAO
static String lerTokenCartao(MFRC522 &leitor) {
  MFRC522::MIFARE_Key chave;
  for (byte i = 0; i < 6; i++) chave.keyByte[i] = CHAVE_A_CARTAO[i];

  MFRC522::StatusCode status = leitor.PCD_Authenticate(
      MFRC522::PICC_CMD_MF_AUTH_KEY_A, BLOCO_TOKEN_CARTAO, &chave, &(leitor.uid));
  if (status != MFRC522::STATUS_OK) {
    Serial.print("[RFID] Falha na autenticacao: ");
    Serial.println(MFRC522::GetStatusCodeName(status));
    return String();
  }

  byte buffer[18];
  byte tamanho = sizeof(buffer);
  status = leitor.MIFARE_Read(BLOCO_TOKEN_CARTAO, buffer, &tamanho);
  if (status != MFRC522::STATUS_OK) {
    Serial.print("[RFID] Falha ao ler bloco: ");
    Serial.println(MFRC522::GetStatusCodeName(status));
    return String();
  }

  String token;
  for (byte i = 0; i < 16; i++) {
    if (buffer[i] < 0x10) token += '0';
    token += String(buffer[i], HEX);
  }
  token.toUpperCase();
  return token;
}
#endif

LeituraCartao rfidVerificar() {
  LeituraCartao leitura;

  for (int i = 0; i < NUM_LEITORES; i++) {
    MFRC522 &leitor = leitores[i];

    if (!leitor.PICC_IsNewCardPresent()) continue;
    if (!leitor.PICC_ReadCardSerial()) continue;

    leitura.valida = true;
    leitura.leitor = i;
    leitura.uid = uidParaHex(leitor.uid);

#if USAR_TOKEN_CARTAO
    leitura.token = lerTokenCartao(leitor);
#endif

    leitor.PICC_HaltA();
    leitor.PCD_StopCrypto1();
    return leitura;
  }

  return leitura;
}
