#include "config.h"
#include "ui.h"

#if USAR_LCD
  #include <Wire.h>
  #include <LiquidCrystal_I2C.h>
  static LiquidCrystal_I2C lcd(LCD_ENDERECO_I2C, LCD_COLUNAS, LCD_LINHAS);
#endif

String formatarReais(long centavos) {
  long v = centavos;
  char buf[16];
  snprintf(buf, sizeof(buf), "R$ %ld,%02ld", v / 100, v % 100);
  return String(buf);
}

static String ajustarLinha(const String &texto) {
  String s = texto;
  if (s.length() > LCD_COLUNAS) s = s.substring(0, LCD_COLUNAS);
  while (s.length() < LCD_COLUNAS) s += ' ';
  return s;
}

void uiIniciar() {
  pinMode(PINO_LED_VERDE, OUTPUT);
  pinMode(PINO_LED_VERMELHO, OUTPUT);
  pinMode(PINO_BUZZER, OUTPUT);
  uiLimparLeds();

#if USAR_LCD
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.clear();
#endif
  uiMostrar("Farroups Pay", "Iniciando...");
}

void uiMostrar(const String &linha1, const String &linha2) {
#if USAR_LCD
  lcd.setCursor(0, 0);
  lcd.print(ajustarLinha(linha1));
  lcd.setCursor(0, 1);
  lcd.print(ajustarLinha(linha2));
#endif
  Serial.print(F("[LCD] "));
  Serial.print(linha1);
  Serial.print(F(" | "));
  Serial.println(linha2);
}

void uiTelaOciosa(long valorCentavos) {
  uiMostrar(formatarReais(valorCentavos), "Aproxime cracha");
}

void uiTelaProcessando() {
  uiMostrar("Processando...", "Aguarde");
}

void uiTelaAprovado(long valorCentavos, long saldoCentavos) {
  String l1 = "APROVADO";
  String l2 = formatarReais(saldoCentavos);
  uiMostrar(l1, l2);
}

void uiTelaRecusado(const String &motivo, long saldoCentavos) {
  String l2 = motivo.length() ? motivo : formatarReais(saldoCentavos);
  uiMostrar("RECUSADO", l2);
}

void uiLimparLeds() {
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_VERMELHO, LOW);
}

static void bip(unsigned int freq, unsigned long duracaoMs) {
  tone(PINO_BUZZER, freq, duracaoMs);
  delay(duracaoMs);
  noTone(PINO_BUZZER);
}

void uiBipLeitura() {
  bip(1800, 60);
}

void uiSinalAprovado() {
  digitalWrite(PINO_LED_VERDE, HIGH);
  bip(2000, 90);
  delay(60);
  bip(2600, 140);
}

void uiSinalRecusado() {
  digitalWrite(PINO_LED_VERMELHO, HIGH);
  bip(300, 400);
}
