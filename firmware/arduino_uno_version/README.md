# Farroups Pay - Arduino Uno + WiFi Shield

Versão adaptada para **Arduino Uno R3** com **WiFi Shield** e leitor RFID MFRC522.

## Hardware Necessário

- **Arduino Uno R3** - Placa microcontroladora principal
- **MFRC522** - Leitor RFID/NFC (SPI)
- **WiFi Shield** - Para conectar à internet
  - Arduino WiFi Shield (recomendado)
  - Ou Ethernet Shield + módulo WiFi externo
- **Display LCD 16x2 I2C** - Interface do usuário
- **LEDs** - Sinais visuais (verde/vermelho)
- **Buzzer** - Sinais sonoros
- **Jumpers e protoboard**

## Pinagem - Arduino Uno

```
RFID (SPI):
  MISO (RFID)  -> Pin 12
  MOSI (RFID)  -> Pin 11
  SCK (RFID)   -> Pin 13
  SS (RFID)    -> Pin 10
  RST (RFID)   -> Pin 9

I2C (LCD):
  SDA -> Pin A4 (I2C_SDA)
  SCL -> Pin A5 (I2C_SCL)

Interface:
  LED Verde    -> Pin 6
  LED Vermelho -> Pin 7
  Buzzer       -> Pin 8

WiFi Shield:
  - Usa SPI (pins 10-13, compartilhado com RFID)
  - Alimentacao: 5V
  - GND: GND
```

## Instalação

### 1. Arduino IDE

Baixe a IDE do Arduino: https://www.arduino.cc/en/software

### 2. Bibliotecas Necessárias

No Arduino IDE, vá em **Sketch** → **Incluir Biblioteca** → **Gerenciar Bibliotecas**:

1. **MFRC522** by GithubCommunity
   ```
   Pesquise: mfrc522
   Instale: MFRC522 by GithubCommunity (v1.4.8+)
   ```

2. **LiquidCrystal_I2C** by Frank de Brabander
   ```
   Pesquise: liquidcrystal i2c
   Instale: LiquidCrystal I2C by Frank de Brabander
   ```

3. **WiFi Shield** (dependendo do seu shield):
   - Arduino WiFi Shield: Já vem com Arduino IDE
   - Ethernet Shield: `#include <Ethernet.h>`

### 3. Estrutura do Projeto

```
farroups_uno.ino          (arquivo principal)
config.h                  (copie de config.example.h)
rfid.h / rfid.cpp         (leitor RFID)
ui.h / ui.cpp             (interface LCD/LEDs/buzzer)
```

### 4. Abrir no Arduino IDE

1. Abra `farroups_uno.ino`
2. Copie os arquivos `.h` e `.cpp` para a mesma pasta
3. Verifique a configuração em `config.h`
4. Conecte o Arduino via USB
5. Selecione **Ferramentas** → **Placa** → **Arduino Uno**
6. Clique em **Upload**

## Configuração

### config.h

```c
// WiFi
#define WIFI_SSID           "NOME_DA_REDE"
#define WIFI_PASSWORD       "SENHA"

// Servidor
#define SERVIDOR_BASE_URL   "https://seu-site.com.br"
#define DEVICE_ID           "cantina-01"
#define DEVICE_SECRET       "seu-segredo-aleatorio"

// Pinos (ajuste conforme sua montagem)
#define PINO_SS_RFID        10
#define PINO_RST_RFID       9
#define PINO_LED_VERDE      6
#define PINO_LED_VERMELHO   7
#define PINO_BUZZER         8
```

## Limitações - Arduino Uno

⚠️ O Arduino Uno tem restrições importantes:

| Recurso | Arduino Uno | ESP32 |
|---------|-----------|-------|
| RAM | 2 KB | 520 KB |
| Flash | 32 KB | 4 MB |
| WiFi | Shield externo | Built-in |
| Velocidade | 16 MHz | 160/240 MHz |
| HTTPS | Não recomendado | Sim |

### O que fazer:

- ✅ Leitura RFID funciona normalmente
- ✅ Interface LCD/LEDs/Buzzer sem problemas
- ⚠️ WiFi é lento (use HTTP se possível, não HTTPS)
- ⚠️ Evite Strings longas (use `F()` para armazenar em Flash)
- ⚠️ Sem processamento complexo ou cálculos pesados

## Testando

### 1. Teste do Serial Monitor

```
Ferramentas → Monitor Serial (115200 baud)
```

Você deve ver:
```
=== FARROUPS PAY - ARDUINO UNO ===
Device: cantina-01
[RFID] Versao: 0x92
[RFID] OK - Pronto para ler cardes
Setup completo!
```

### 2. Teste do RFID

Aproxime um cartão MIFARE ao leitor. Você deve ver:
```
[LCD] Farroups Pay | Iniciando...
[LCD] R$ 7,50 | Aproxime cracha

[RFID] Versao: 0x92
[RFID] OK
[MAIN] Cartao lido: 1A2B3C4D
[LCD] Processando... | Aguarde
[LCD] APROVADO | Saldo R$ 50,00
```

### 3. Teste do Display LCD

O LCD deve mostrar mensagens conforme o status do terminal.

## Troubleshooting

### "error: 'config.h' No such file or directory"

**Solução**: 
1. Copie o arquivo `config.h` para a mesma pasta que `farroups_uno.ino`
2. No Arduino IDE, clique em **Arquivo** → **Mostrar Pasta do Sketch**
3. Confirme que `config.h` está lá

### "undefined reference to MFRC522"

**Solução**: Instale a biblioteca MFRC522 (veja **Instalação** acima)

### RFID não funciona "versao 0x00 ou 0xFF"

**Solução**: Verifique:
1. Fiação do SPI (SCK, MOSI, MISO, SS, RST)
2. Alimentação 3.3V do MFRC522
3. Resistores pull-up (10k) no RST se necessário

### Display LCD não mostra nada

**Solução**:
1. Verifique I2C (SDA=A4, SCL=A5)
2. Troque o endereço I2C em `config.h` (0x27 ou 0x3F)
3. Use o scanner I2C: https://playground.arduino.cc/Main/I2cScanner

### WiFi não conecta

**Solução**:
1. Confirme que o WiFi Shield está bem conectado
2. Verifique SSID e senha em `config.h`
3. Serial.println() do status de conexão para debug

## Próximos Passos

1. **Implementar WiFi**: Adicionar código HTTP para conectar ao servidor
2. **HMAC-SHA256**: Assinar requisicoes para validacao
3. **Persistencia**: Salvar ultimas transacoes na memória
4. **Modo offline**: Funcionar sem WiFi (fila local)

## Referências

- MFRC522: https://github.com/miguelbalboa/rfid
- Arduino Uno: https://www.arduino.cc/en/Guide/ArduinoUno
- LiquidCrystal I2C: https://github.com/johnrickman/LiquidCrystal_I2C
- WiFi Shield: https://www.arduino.cc/en/Guide/ArduinoWiFiShield

## Licenca

MIT - Veja LICENSE.md
