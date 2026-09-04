'use client';
import { useState, useEffect } from 'react';

export default function GerenciarAssinaturaPage() {
  const [loading, setLoading] = useState(true);
  const [assinatura, setAssinatura] = useState(null);
  const [diasRestantes, setDiasRestantes] = useState(0);
  const [statusAtivo, setStatusAtivo] = useState(false);
  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [dadosPix, setDadosPix] = useState(null);

  // Simula a busca dos dados da assinatura do usuário logado no Supabase
  useEffect(() => {
    async function carregarDadosAssinatura() {
      try {
        // Substitua pela sua chamada real ao Supabase ou API para buscar os dados da barbearia logada
        // Exemplo: const res = await fetch('/api/minha-assinatura');
        // const data = await res.json();
        
        // Exemplo fictício para demonstração:
        const dadosMock = {
          status_assinatura: 'ativo', // 'ativo' ou 'pendente'
          data_vencimento: '2026-10-04T00:00:00.000Z' // 30 dias à frente
        };

        setAssinatura(dadosMock);

        if (dadosMock?.data_vencimento) {
          const hoje = new Date();
          const vencimento = new Date(dadosMock.data_vencimento);
          const diferencaTempo = vencimento.getTime() - hoje.getTime();
          const diferencaDias = Math.ceil(diferencaTempo / (1000 * 3600 * 24));

          setDiasRestantes(diferencaDias > 0 ? diferencaDias : 0);
          setStatusAtivo(diferencaDias > 0 && dadosMock.status_assinatura === 'ativo');
        }
      } catch (error) {
        console.error('Erro ao carregar assinatura:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosAssinatura();
  }, []);

  // Função para gerar o Pix de renovação utilizando a rota que criamos anteriormente
  async function handleGerarPixRenovacao() {
    try {
      const response = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_amount: 9.90,
          description: 'Renovação de Assinatura Mensal - Gestor',
          payer_email: 'exemplo@email.com',
          payer_name: 'Gestor'
        })
      });

      const data = await response.json();
      if (response.ok) {
        setDadosPix(data);
        setModalPixAberto(true);
      } else {
        alert('Erro ao gerar Pix de pagamento.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão ao gerar Pix.');
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando informações da assinatura...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Assinatura</h1>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-4">
        {/* Status */}
        <div className="flex justify-between items-center border-b pb-3">
          <span className="text-gray-600 font-medium">Status do Plano:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            statusAtivo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {statusAtivo ? 'Ativo' : 'Expirado / Pendente'}
          </span>
        </div>

        {/* Data de Vencimento */}
        <div className="flex justify-between items-center border-b pb-3">
          <span className="text-gray-600 font-medium">Data de Vencimento:</span>
          <span className="text-gray-800 font-semibold">
            {assinatura?.data_vencimento 
              ? new Date(assinatura.data_vencimento).toLocaleDateString('pt-BR') 
              : 'N/A'}
          </span>
        </div>

        {/* Dias Restantes */}
        <div className="flex justify-between items-center border-b pb-3">
          <span className="text-gray-600 font-medium">Tempo Restante:</span>
          <span className="text-blue-600 font-bold">
            {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
          </span>
        </div>

        {/* Botão de Ação (Renovar caso esteja próximo de vencer ou expirado) */}
        <div className="pt-4">
          <button
            onClick={handleGerarPixRenovacao}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-sm"
          >
            Renovar por mais 30 dias (R$ 9,90)
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">
            O sistema é liberado automaticamente assim que o pagamento via Pix é confirmado.
          </p>
        </div>
      </div>

      {/* Modal Simples de Exibição do Pix (Caso queira integrar na mesma página) */}
      {modalPixAberto && dadosPix && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 text-center">Pague via Pix para Renovar</h3>
            
            {dadosPix.qrCodeBase64 && (
              <div className="flex justify-center">
                <img 
                  src={`data:image/png;base64,${dadosPix.qrCodeBase64}`} 
                  alt="QR Code Pix" 
                  className="w-48 h-48 border rounded-lg p-2"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 font-semibold">Pix Copia e Cola:</label>
              <textarea 
                readOnly 
                value={dadosPix.copiaECola} 
                className="w-full text-xs p-2 border rounded bg-gray-50 h-20 text-gray-700"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(dadosPix.copiaECola);
                  alert('Código Pix copiado com sucesso!');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm"
              >
                Copiar Código
              </button>
              <button 
                onClick={() => setModalPixAberto(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}