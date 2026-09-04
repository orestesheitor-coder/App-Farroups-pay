#ifndef RFID_H
#define RFID_H

#include <Arduino.h>

struct LeituraCartao {
  bool   valida = false;
  String uid;
  String token;
  int    leitor = 0;
};

void rfidIniciar();
LeituraCartao rfidVerificar();

#endif
