/*
  rfid.h - Leitura de caroes RFID/NFC (leitor MFRC522)
*/
#ifndef RFID_H
#define RFID_H

#include <Arduino.h>

struct LeituraCartao {
  bool valida = false;
  int leitor = -1;
  String uid = "";
#if USAR_TOKEN_CARTAO
  String token = "";
#endif
};

void rfidIniciar();
LeituraCartao rfidVerificar();

#endif // RFID_H
