/*
  ui.h - Interface do terminal: display LCD 16x2, LEDs e buzzer.
  Todas as funcoes sao seguras mesmo com USAR_LCD 0 (viram no-op no
  display, mas continuam imprimindo no Serial).
*/
#ifndef UI_H
#define UI_H

#include <Arduino.h>

void uiIniciar();

// Escreve duas linhas no display (e no Serial). Linhas com mais de
// 16 caracteres sao cortadas.
void uiMostrar(const String &linha1, const String &linha2);

// Telas prontas
void uiTelaOciosa(long valorCentavos, bool modoConsulta, bool online);
void uiTelaProcessando();
void uiTelaAprovado(const String &nome, long valorCentavos, long saldoCentavos);
void uiTelaRecusado(const String &nome, const String &motivo, long saldoCentavos);
void uiTelaSaldo(const String &nome, long saldoCentavos);
void uiTelaErro(const String &linha1, const String &linha2);

// Sinais sonoros / luminosos
void uiBipLeitura();
void uiSinalAprovado();
void uiSinalRecusado();
void uiSinalErro();
void uiLimparLeds();

// Formata centavos -> "R$ 12,34"
String formatarReais(long centavos);

#endif // UI_H
