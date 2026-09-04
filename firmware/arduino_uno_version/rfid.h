/*
  rfid.h - Leitura RFID/NFC com MFRC522 (Arduino Uno)
*/
#ifndef RFID_H
#define RFID_H

#include <Arduino.h>

struct LeituraCartao {
  bool valida;
  String uid;
};

void rfidIniciar();
LeituraCartao rfidVerificar();

#endif // RFID_H
