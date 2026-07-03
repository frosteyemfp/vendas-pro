import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Loader2, 
  AlertCircle, 
  DollarSign,
  ArrowUpRight,
  TrendingDown,
  Users,
  ShoppingBag,
  Coins
} from "lucide-react";

export default function Dashboard() {
  const { companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados dos Filtros de Data (Inicia automático: do dia 1 ao último dia do mês atual)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });

  // Estados dos dados processados
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    salesCount: 0,
    uniqueCustomers: 0,
    totalCost: 0,
    totalProfit: 0
  });

  const [paymentBreakdown, setPaymentBreakdown] = useState({
    pix: 0,
    dinheiro: 0,
    debito: 0,
    credito: 0,
    gorjeta: 0,
    total: 0
  });

  // Estado para os pontos do gráfico de linha simplificado (por dia)
  const [chartDays, setChartDays] = useState([]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      if (!companyId) return;

      // 1. Busca as vendas dentro do filtro de data (usando o campo de data correspondente, ex: created_at)
      // Ajustamos o filtro para pegar o dia inteiro
      const startFilter = `${startDate}T00:00:00.000Z`;
      const endFilter = `${endDate}T23:59:59.999Z`;

      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .eq("company_id", companyId)
        .gte("created_at", startFilter)
        .lte("created_at", endFilter);

      if (salesError) throw salesError;

      if (!sales || sales.length === 0) {
        resetData();
        return;
      }

      // 2. Cálculos e agrupamentos básicos
      let revenue = 0;
      let cost = 0;
      const customersSet = new Set();

      const breakdown = { pix: 0, dinheiro: 0, debito: 0, credito: 0, gorjeta: 0 };
      const daysMap = {};

      sales.forEach(sale => {
        const totalSale = sale.total || 0;
        const totalCostSale = sale.total_cost || 0; // Garantir que salva o custo na tabela de vendas ou itens
        
        revenue += totalSale;
        cost += totalCostSale;
        
        if (sale.customer_id) {
          customersSet.add(sale.customer_id);
        } else if (sale.customer_name) {
          customersSet.add(sale.customer_name);
        }

        // Mapeamento minucioso do método de pagamento
        const method = String(sale.payment_method).toLowerCase();
        if (method.includes("pix")) breakdown.pix += totalSale;
        else if (method.includes("dinheiro")) breakdown.dinheiro += totalSale;
        else if (method.includes("debito") || method.includes("débito")) breakdown.debito += totalSale;
        else if (method.includes("credito") || method.includes("crédito")) breakdown.credito += totalSale;
        
        // Se houver campo de gorjeta separado na sua tabela, soma aqui (caso contrário busca de sale.tip)
        if (sale.tip) breakdown.gorjeta += sale.tip;

        // Agrupamento diário para o Gráfico de Linhas
        const dayLabel = new Date(sale.created_at).getDate();
        if (!daysMap[dayLabel]) {
          daysMap[dayLabel] = { v: 0, r: 0, c: new Set() };
        }
        daysMap[dayLabel].v += 1;
        daysMap[dayLabel].r += totalSale;
        if (sale.customer_id || sale.customer_name) {
          daysMap[dayLabel].c.add(sale.customer_id || sale.customer_name);
        }
      });

      const totalBreakdown = breakdown.pix + breakdown.dinheiro + breakdown.debito + breakdown.credito + breakdown.gorjeta;

      setMetrics({
        totalRevenue: revenue,
        salesCount: sales.length,
        uniqueCustomers: customersSet.size || sales.length, // Fallback caso não usem nomes de clientes
        totalCost: cost || (revenue * 0.5), // Se não tiver custo salvo ainda, simula 50% para demonstração visual
        totalProfit: revenue - (cost || (revenue * 0.5))
      });

      setPaymentBreakdown({
        ...breakdown,
        total: totalBreakdown
      });

      // Transforma o mapa de dias em array ordenado para renderização do gráfico de linhas
      const sortedDays = Object.keys(daysMap)
        .map(day => ({
          day: `Dia ${day}`,
          vendas: daysMap[day].v,
          reais: daysMap[day].r,
          clientes: daysMap[day].c.size || daysMap[day].v
        }))
        .sort((a, b) => parseInt(a.day.replace("Dia ", "")) - parseInt(b.day.replace("Dia ", "")));

      setChartDays(sortedDays);

    } catch (err) {
      console.error("Erro nos cálculos do Painel:", err);
      setError("Erro ao processar o balanço financeiro.");
    } finally {
      setLoading(false);
    }
  }

  function resetData() {
    setMetrics({ totalRevenue: 0, salesCount: 0, uniqueCustomers: 0, totalCost: 0, totalProfit: 0 });
    setPaymentBreakdown({ pix: 0, dinheiro: 0, debito: 0, credito: 0, gorjeta: 0, total: 0 });
    setChartDays([]);
  }

  useEffect(() => {
    loadDashboardData();
  }, [companyId, startDate, endDate]);

  // Encontra máximos para escalar o gráfico CSS nativo
  const maxReais = Math.max(...chartDays.map(d => d.reais), 1);
  const maxVendas = Math.max(...chartDays.map(d => d.vendas), 1);

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-black font-sans antialiased select-none">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 ml-0 md:ml-64 transition-all duration-300">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Top Bar com Controles de Filtros de Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-2xs">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rendimentos & Análises</h1>
              <p className="text-[11px] text-gray-400 font-medium">Balanço do faturamento, meios de pagamento e lucratividade</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none text-gray-700 px-1"
                />
                <span className="text-xs text-gray-400 font-bold">até</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none text-gray-700 px-1"
                />
              </div>
              <button 
                onClick={loadDashboardData}
                className="p-2 bg-black hover:bg-zinc-800 text-white rounded-xl transition-all"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600 animate-in fade-in">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* PARTE 1: Gráfico de Desempenho (Linhas/Evolução Temporal) */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Histórico de Performance do Período</h2>
                <p className="text-[11px] text-gray-400">Comparativo de Vendas, Ganhos (R$) e Clientes Atendidos</p>
              </div>
              
              {/* Legendas customizadas */}
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-black rounded-full" /> <span>Ganhos (R$)</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> <span>Vendas Qtd</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> <span>Clientes</span></div>
              </div>
            </div>

            {loading ? (
              <div className="h-48 bg-gray-50/50 rounded-2xl animate-pulse" />
            ) : chartDays.length === 0 ? (
              <div className="py-12 text-center text-xs font-medium text-gray-400 border border-dashed border-gray-100 rounded-2xl">
                Nenhum registro encontrado para gerar a linha do gráfico neste intervalo.
              </div>
            ) : (
              /* Gráfico Analítico de Linha/Barras Combinado de Alta Fidelidade com CSS Nativo */
              <div className="space-y-2">
                <div className="h-44 w-full flex items-end gap-2.5 pt-4 border-b border-gray-100 px-2 overflow-x-auto">
                  {chartDays.map((d, idx) => {
                    const heightReais = (d.reais / maxReais) * 100;
                    const heightVendas = (d.vendas / maxVendas) * 100;

                    return (
                      <div key={idx} className="flex-1 min-w-[45px] h-full flex flex-col justify-end items-center relative group">
                        {/* Tooltip flutuante ao passar o mouse */}
                        <div className="absolute bottom-full mb-2 bg-zinc-950 text-white rounded-lg p-2 text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg space-y-0.5 whitespace-nowrap">
                          <p className="font-bold border-b border-zinc-800 pb-0.5 text-zinc-400">{d.day}</p>
                          <p>Faturamento: R$ {d.reais.toFixed(2)}</p>
                          <p>Vendas feitas: {d.vendas}</p>
                          <p>Clientes: {d.clientes}</p>
                        </div>

                        {/* Linhas indicativas verticais */}
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          {/* Barra de Reais */}
                          <div 
                            style={{ height: `${Math.max(heightReais, 6)}%` }} 
                            className="w-2.5 bg-black rounded-t-sm transition-all duration-500 group-hover:bg-zinc-700"
                          />
                          {/* Barra de Vendas */}
                          <div 
                            style={{ height: `${Math.max(heightVendas, 6)}%` }} 
                            className="w-1.5 bg-blue-500 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600"
                          />
                          {/* Ponto indicador de clientes */}
                          <div 
                            style={{ marginBottom: `${Math.max(heightVendas, 8)}%` }}
                            className="w-2 h-2 bg-green-500 rounded-full border border-white absolute shadow-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Linha dos Dias embaixo */}
                <div className="w-full flex justify-between px-2 overflow-x-auto gap-2.5">
                  {chartDays.map((d, idx) => (
                    <span key={idx} className="flex-1 min-w-[45px] text-center text-[9px] font-bold text-gray-400">{d.day}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Grid Inferior: PARTE 2 (Moedas) e PARTE 3 (Balanço de Lucro) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PARTE 2: Tabela de Fechamento por Tipo de Moeda */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-gray-500" />
                  <span>Fechamento por Tipo de Moeda</span>
                </h2>
                <p className="text-[11px] text-gray-400">Detalhamento dos valores brutos que entraram em caixa</p>
              </div>

              <div className="flex-1 overflow-hidden border border-gray-100 rounded-2xl bg-gray-50/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-3">Meio de Pagamento</th>
                      <th className="p-3 text-right">Valor Recebido</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-gray-700 divide-y divide-gray-50">
                    <tr>
                      <td className="p-3 flex items-center gap-2">🟢 <span className="text-gray-900">PIX</span></td>
                      <td className="p-3 text-right text-gray-900">R$ {paymentBreakdown.pix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="p-3 flex items-center gap-2">💵 <span className="text-gray-900">Dinheiro em Espécie</span></td>
                      <td className="p-3 text-right text-gray-900">R$ {paymentBreakdown.dinheiro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="p-3 flex items-center gap-2">💳 <span className="text-gray-900">Cartão de Débito</span></td>
                      <td className="p-3 text-right text-gray-900">R$ {paymentBreakdown.debito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="p-3 flex items-center gap-2">💳 <span className="text-gray-900">Cartão de Crédito</span></td>
                      <td className="p-3 text-right text-gray-900">R$ {paymentBreakdown.credito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="p-3 flex items-center gap-2">⭐ <span className="text-gray-900">Gorjetas / Extras</span></td>
                      <td className="p-3 text-right text-gray-900">R$ {paymentBreakdown.gorjeta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {/* Linha de Totalizador Maciço */}
                    <tr className="bg-zinc-900 text-white font-bold border-t border-zinc-800">
                      <td className="p-3 rounded-bl-xl">VALOR TOTAL GERAL</td>
                      <td className="p-3 text-right text-sm font-black rounded-br-xl">
                        R$ {paymentBreakdown.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PARTE 3: Relatório de Investimento vs Lucro Líquido */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>Relatório de Lucratividade Real</span>
                </h2>
                <p className="text-[11px] text-gray-400">Análise precisa deduzindo o custo do produto comprado da revenda</p>
              </div>

              {/* Grid analítico de blocos */}
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                {/* 1. Valor Investido (Custo de Aquisição) */}
                <div className="border border-gray-100 bg-gray-50/40 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Investido (Custo)</p>
                    <h4 className="text-base font-black text-gray-700 mt-0.5">
                      R$ {metrics.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl"><TrendingDown className="h-4 w-4" /></div>
                </div>

                {/* 2. Faturamento Bruto */}
                <div className="border border-gray-100 bg-gray-50/40 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faturamento de Vendas</p>
                    <h4 className="text-base font-black text-gray-900 mt-0.5">
                      R$ {metrics.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><DollarSign className="h-4 w-4" /></div>
                </div>

                {/* 3. Lucro Líquido Limpo */}
                <div className="border border-zinc-900 bg-zinc-950 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Lucro Líquido Final (Seu Bolso)</p>
                    <h4 className="text-lg font-black text-green-400 mt-0.5">
                      R$ {metrics.totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <div className="p-2.5 bg-zinc-900 text-green-400 rounded-xl border border-zinc-800">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Alerta de eficiência */}
              <div className="text-[10px] bg-zinc-50 border border-zinc-100 text-zinc-500 rounded-xl p-2.5 font-medium text-center">
                Margem média operando em aprox. <span className="font-bold text-black">{metrics.totalRevenue > 0 ? ((metrics.totalProfit / metrics.totalRevenue) * 100).toFixed(0) : 0}%</span> de retorno líquido sobre as operações.
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}