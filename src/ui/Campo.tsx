import React, { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { raio, useTema } from '@/theme';
import { Icone, type NomeIcone } from './Icones';
import { Texto } from './Texto';
import { BotaoIcone } from './Botao';

export interface PropsCampo extends TextInputProps {
  rotulo?: string;
  erro?: string | null;
  auxiliar?: string;
  icone?: NomeIcone;
  segredo?: boolean;
}

export function Campo({
  rotulo,
  erro,
  auxiliar,
  icone,
  segredo,
  style,
  ...props
}: PropsCampo) {
  const { cores, fonte } = useTema();
  const [focado, setFocado] = useState(false);
  const [visivel, setVisivel] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      {rotulo && (
        <Texto variante="legenda" peso="600" suave>
          {rotulo}
        </Texto>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 52,
          paddingHorizontal: 14,
          borderRadius: raio.md,
          backgroundColor: cores.superficie,
          borderWidth: 1.4,
          borderColor: erro ? cores.alerta : focado ? cores.texto : cores.borda,
        }}
      >
        {icone && <Icone nome={icone} tamanho={19} cor={cores.textoSuave} />}
        <TextInput
          accessibilityLabel={rotulo}
          placeholderTextColor={cores.textoSuave}
          secureTextEntry={segredo && !visivel}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          style={[
            {
              flex: 1,
              color: cores.texto,
              fontSize: 16,
              paddingVertical: 14,
              ...fonte('400'),
            },
            style,
          ]}
          {...props}
        />
        {segredo && (
          <View style={{ marginRight: -10 }}>
            <BotaoIcone
              nome={visivel ? 'olhoFechado' : 'olho'}
              rotulo={visivel ? 'Ocultar senha' : 'Mostrar senha'}
              cor={cores.textoSuave}
              onPress={() => setVisivel((v) => !v)}
            />
          </View>
        )}
      </View>
      {(erro || auxiliar) && (
        <Texto variante="legenda" cor={erro ? cores.alerta : cores.textoSuave}>
          {erro ?? auxiliar}
        </Texto>
      )}
    </View>
  );
}
