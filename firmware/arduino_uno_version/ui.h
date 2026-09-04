/*
  ui.h - Interface do terminal Arduino Uno (LCD 16x2, LEDs, buzzer)
*/
#ifndef UI_H
#define UI_H

void uiIniciar();
void uiMostrar(const String &linha1, const String &linha2);
void uiTelaOciosa(long valorCentavos);
void uiTelaProcessando();
void uiTelaAprovado(long valorCentavos, long saldoCentavos);
void uiTelaRecusado(const String &motivo, long saldoCentavos);
void uiBipLeitura();
void uiSinalAprovado();
void uiSinalRecusado();
void uiLimparLeds();

String formatarReais(long centavos);

#endif // UI_H
