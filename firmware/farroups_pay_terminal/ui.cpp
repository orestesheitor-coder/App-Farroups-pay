#include "config.h"
#include "ui.h"

#if USAR_LCD
  #include <Wire.h>
  #include <LiquidCrystal_I2C.h>
  static LiquidCrystal_I2C lcd(LCD_ENDERECO_I2C, LCD_COLUNAS, LCD_LINHAS);
#endif

String formatarReais(long centavos) {
  bool negativo = centavos < 0;
  long v = negativo ? -centavos : centavos;
  char buf[24];
  snprintf(buf, sizeof(buf), "%sR$ %ld,%02ld",
           negativo ? "-" : "", v / 100, v % 100);
  return String(buf);
}

static String ajustarLinha(const String &texto) {
  String s = texto;
  if ((int)s.length() > LCD_COLUNAS) s = s.substring(0, LCD_COLUNAS);
  while ((int)s.length() < LCD_COLUNAS) s += ' ';
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
  Serial.print("[LCD] ");
  Serial.print(linha1);
  Serial.print(" | ");
  Serial.println(linha2);
}

void uiTelaOciosa(long valorCentavos, bool modoConsulta, bool online) {
  String l1 = modoConsulta ? String("CONSULTA SALDO") : formatarReais(valorCentavos);
  if (!online) l1 += " *";
  uiMostrar(l1, "Aproxime cracha");
}

void uiTelaProcessando() {
  uiMostrar("Processando...", "Aguarde");
}

void uiTelaAprovado(const String &nome, long valorCentavos, long saldoCentavos) {
  String l1 = "APROVADO " + formatarReais(valorCentavos);
  String l2 = nome.length() ? nome : String("Saldo:");
  if (l2.length() > 9) l2 = l2.substring(0, 9);
  l2 += " " + formatarReais(saldoCentavos);
  uiMostrar(l1, l2);
}

void uiTelaRecusado(const String &nome, const String &motivo, long saldoCentavos) {
  (void)nome;
  String l2 = motivo;
  if (saldoCentavos >= 0 && motivo.startsWith("Saldo")) {
    l2 = "Saldo " + formatarReais(saldoCentavos);
  }
  uiMostrar("RECUSADO", l2);
}

void uiTelaSaldo(const String &nome, long saldoCentavos) {
  String l1 = nome.length() ? nome : String("Cracha lido");
  uiMostrar(l1, "Saldo " + formatarReais(saldoCentavos));
}

void uiTelaErro(const String &linha1, const String &linha2) {
  uiMostrar(linha1, linha2);
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

void uiSinalErro() {
  digitalWrite(PINO_LED_VERMELHO, HIGH);
  for (int i = 0; i < 3; i++) {
    bip(500, 90);
    delay(70);
  }
}
