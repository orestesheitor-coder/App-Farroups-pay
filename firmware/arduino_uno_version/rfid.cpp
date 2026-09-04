#include <SPI.h>
#include <MFRC522.h>
#include "config.h"
#include "rfid.h"

static MFRC522 leitor(PINO_SS_RFID, PINO_RST_RFID);

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
  leitor.PCD_Init(PINO_SS_RFID, PINO_RST_RFID);
  delay(50);

  byte versao = leitor.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("[RFID] Versao: 0x");
  Serial.println(versao, HEX);

  if (versao == 0x00 || versao == 0xFF) {
    Serial.println("[RFID] ERRO: Verifique a fiacao!");
  } else {
    Serial.println("[RFID] OK - Pronto para ler cardes");
  }
}

LeituraCartao rfidVerificar() {
  LeituraCartao leitura;
  leitura.valida = false;

  if (!leitor.PICC_IsNewCardPresent()) return leitura;
  if (!leitor.PICC_ReadCardSerial()) return leitura;

  leitura.valida = true;
  leitura.uid = uidParaHex(leitor.uid);

  leitor.PICC_HaltA();
  leitor.PCD_StopCrypto1();

  return leitura;
}
