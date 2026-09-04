#ifndef UI_H
#define UI_H

#include <Arduino.h>

void uiIniciar();
void uiMostrar(const String &linha1, const String &linha2);
void uiTelaOciosa(long valorCentavos, bool modoConsulta, bool online);
void uiTelaProcessando();
void uiTelaAprovado(const String &nome, long valorCentavos, long saldoCentavos);
void uiTelaRecusado(const String &nome, const String &motivo, long saldoCentavos);
void uiTelaSaldo(const String &nome, long saldoCentavos);
void uiTelaErro(const String &linha1, const String &linha2);
void uiBipLeitura();
void uiSinalAprovado();
void uiSinalRecusado();
void uiSinalErro();
void uiLimparLeds();
String formatarReais(long centavos);

#endif
