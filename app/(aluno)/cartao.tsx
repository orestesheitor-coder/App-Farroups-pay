import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { api } from '@/services';
import { useSessao } from '@/state/sessao';
import { useAsync, useContagem } from '@/lib/hooks';
import type { Cartao } from '@/domain/types';
import { raio, useTema } from '@/theme';
import {
  Aviso,
  Botao,
  Divisor,
  EstadoErro,
  Esqueleto,
  Folha,
  LinhaLista,
  MarcaLoja,
  Selo,
  Seletor,
  Superficie,
  Tela,
  Texto,
  useAlerta,
} from '@/ui';
import { CartaoVirtual } from '@/ui/CartaoVirtual';

export default function MeuCartao() {
  const { usuario, alunoAtivoId, invalidar, versao } = useSessao();
  const { cores } = useTema();
  const { avisar } = useAlerta();
  const insets = useSafeAreaInsets();

  const alunoId = alunoAtivoId ?? usuario?.alunoId ?? '';
  const estado = useAsync(() => api.carteira.resumo(alunoId), [alunoId, versao], {
    recarregarAoFocar: true,
  });

  const [cartoes, setCartoes] = useState<Cartao[] | null>(null);
  const [tipo, setTipo] = useState<'virtual' | 'fisico'>('virtual');
  const [ocupado, setOcupado] = useState(false);
  const [qrAberto, setQrAberto] = useState(false);
  const [segundaViaAberta, setSegundaViaAberta] = useState(false);

  const lista = cartoes ?? estado.dados?.cartoes ?? [];
  const cartao = lista.find((c) => c.tipo === tipo) ?? lista[0];
  const ativo = lista.find((c) => c.ativo);
  const aluno = estado.dados?.aluno;

  async function alternarBloqueio() {
    if (!cartao) return;
    setOcupado(true);
    try {
      await api.cartoes.alternarBloqueio(cartao.id, !cartao.bloqueado);
      const atualizados = await api.cartoes.listar(cartao.contaId);
      setCartoes(atualizados);
      invalidar();
      avisar(
        cartao.bloqueado
          ? 'Cartão desbloqueado. Já dá para pagar.'
          : 'Cartão bloqueado. Nenhuma compra será aprovada.',
        cartao.bloqueado ? 'sucesso' : 'neutro',
      );
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível concluir.', 'erro');
    } finally {
      setOcupado(false);
    }
  }

  async function tornarAtivo() {
    if (!cartao) return;
    setOcupado(true);
    try {
      setCartoes(await api.cartoes.ativar(cartao.id));
      invalidar();
      avisar(`Cartão ${cartao.tipo === 'virtual' ? 'virtual' : 'físico'} agora é o ativo.`, 'sucesso');
    } finally {
      setOcupado(false);
    }
  }

  async function pedirSegundaVia() {
    if (!cartao) return;
    setOcupado(true);
    try {
      await api.cartoes.solicitarSegundaVia(cartao.contaId);
      setCartoes(await api.cartoes.listar(cartao.contaId));
      setSegundaViaAberta(false);
      avisar('Segunda via solicitada. Retire na secretaria em até 3 dias úteis.', 'sucesso');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível solicitar.', 'erro');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Tela estilo={{ paddingTop: insets.top + 8 }}>
      <View style={{ paddingVertical: 12, gap: 6 }}>
        <Texto variante="display">Meu cartão</Texto>
        <Texto variante="legenda" suave>
          Virtual e físico compartilham a mesma conta e o mesmo saldo.
        </Texto>
      </View>

      {estado.erro && !estado.dados ? (
        <EstadoErro mensagem={estado.erro} aoTentarNovamente={estado.recarregar} />
      ) : estado.carregando || !cartao || !aluno ? (
        <View style={{ gap: 16 }}>
          <Esqueleto altura={205} arredondamento={raio.xl} />
          <Esqueleto altura={48} />
          <Esqueleto altura={140} arredondamento={raio.lg} />
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          <Seletor
            valor={tipo}
            aoMudar={setTipo}
            opcoes={[
              { valor: 'virtual', rotulo: 'Virtual' },
              { valor: 'fisico', rotulo: 'Físico' },
            ]}
          />

          <CartaoVirtual cartao={cartao} nome={aluno.nome} />

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {cartao.ativo ? (
              <Selo texto="Cartão ativo" tom="sucesso" />
            ) : (
              <Selo texto="Inativo" />
            )}
            {cartao.bloqueado && <Selo texto="Bloqueado" tom="alerta" />}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={cartao.bloqueado ? 'Desbloquear' : 'Bloquear'}
                tipo={cartao.bloqueado ? 'primario' : 'secundario'}
                icone={cartao.bloqueado ? 'cadeadoAberto' : 'cadeado'}
                compacto
                carregando={ocupado}
                onPress={() => void alternarBloqueio()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Botao
                titulo="Pagar com QR"
                tipo="secundario"
                icone="qr"
                compacto
                onPress={() => setQrAberto(true)}
              />
            </View>
          </View>

          <Superficie preenchimento={4}>
            <View style={{ paddingHorizontal: 12 }}>
              <LinhaLista
                primeira
                titulo="Usar este cartão nas compras"
                descricao={
                  cartao.ativo
                    ? 'É o cartão ativo da conta'
                    : 'Só um cartão fica ativo por vez'
                }
                esquerda={<MarcaLoja tamanho={38} tom="marca" icone="cartao" />}
                direita={
                  cartao.ativo ? (
                    <Selo texto="Ativo" tom="sucesso" />
                  ) : (
                    <Botao
                      titulo="Ativar"
                      tipo="secundario"
                      compacto
                      largura="auto"
                      onPress={() => void tornarAtivo()}
                    />
                  )
                }
              />
              {tipo === 'fisico' && (
                <LinhaLista
                  titulo="Solicitar segunda via"
                  descricao="Perdeu ou danificou? O antigo é cancelado na hora."
                  esquerda={<MarcaLoja tamanho={38} tom="alerta" icone="atualizar" />}
                  onPress={() => setSegundaViaAberta(true)}
                />
              )}
            </View>
          </Superficie>

          <Aviso
            icone="escudo"
            texto="O número completo do cartão nunca é exibido no app. Em caso de perda, bloqueie aqui e avise a secretaria."
          />

          {ativo && ativo.id !== cartao.id && (
            <Texto variante="legenda" suave>
              Cartão ativo agora: {ativo.tipo === 'virtual' ? 'virtual' : 'físico'} final{' '}
              {ativo.ultimos4}.
            </Texto>
          )}
        </View>
      )}

      <FolhaQr
        aberta={qrAberto}
        contaId={cartao?.contaId}
        bloqueado={!!cartao?.bloqueado}
        aoFechar={() => setQrAberto(false)}
      />

      <Folha
        visivel={segundaViaAberta}
        aoFechar={() => setSegundaViaAberta(false)}
        titulo="Solicitar segunda via"
        subtitulo="O cartão atual é cancelado imediatamente e o novo fica pronto para retirada na secretaria."
      >
        <View style={{ gap: 12 }}>
          <Aviso
            tom="alerta"
            icone="alerta"
            texto="Enquanto o novo cartão não chega, use o cartão virtual ou o QR Code para pagar."
          />
          <Botao
            titulo="Confirmar solicitação"
            carregando={ocupado}
            onPress={() => void pedirSegundaVia()}
          />
          <Botao
            titulo="Agora não"
            tipo="fantasma"
            onPress={() => setSegundaViaAberta(false)}
          />
        </View>
      </Folha>
      <View style={{ height: 20 }} />
    </Tela>
  );
}

/** QR de pagamento com validade de 60 segundos. */
function FolhaQr({
  aberta,
  contaId,
  bloqueado,
  aoFechar,
}: {
  aberta: boolean;
  contaId?: string;
  bloqueado: boolean;
  aoFechar: () => void;
}) {
  const { cores } = useTema();
  const [geracao, setGeracao] = useState(0);
  const estado = useAsync(
    async () => (contaId && aberta ? api.cartoes.qrDinamico(contaId) : null),
    [contaId, aberta, geracao],
  );
  const { restante, reiniciar } = useContagem(60);

  React.useEffect(() => {
    if (estado.dados) reiniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.dados?.codigo]);

  return (
    <Folha
      visivel={aberta}
      aoFechar={aoFechar}
      titulo="Pagar com QR Code"
      subtitulo="Mostre para a maquininha da loja. O código expira em 60 segundos."
    >
      <View style={{ alignItems: 'center', gap: 16, paddingVertical: 8 }}>
        {bloqueado ? (
          <Aviso
            tom="alerta"
            icone="cadeado"
            texto="Cartão bloqueado: nenhum QR Code será aceito até o desbloqueio."
          />
        ) : estado.carregando || !estado.dados ? (
          <Esqueleto altura={196} largura={196} arredondamento={raio.lg} />
        ) : (
          <View
            style={{
              padding: 16,
              borderRadius: raio.lg,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: cores.borda,
            }}
          >
            <QRCode value={estado.dados.codigo} size={180} backgroundColor="#FFFFFF" color="#14161A" />
          </View>
        )}
        <Texto variante="legenda" suave tabular>
          {restante > 0 ? `Expira em ${restante}s` : 'Código expirado'}
        </Texto>
        <Divisor />
        <Botao
          titulo="Gerar novo código"
          tipo="secundario"
          icone="atualizar"
          onPress={() => setGeracao((g) => g + 1)}
        />
      </View>
    </Folha>
  );
}
