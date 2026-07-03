import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart3, 
  Table2, 
  ClipboardList, 
  Download, 
  ChevronDown
} from "lucide-react";

export default function Reports() {
  const { companyId } = useAuth();
  const [activeTab, setActiveTab] = useState("charts");
  const [dateFilter, setDateFilter] = useState("30");
  const [salesData, setSalesData] = useState([]);
  
  const [summary, setSummary] = useState({
    topPayment: "PIX",
    topProduct: "Nenhum",
    bestDay: "Sexta-feira",
    maxSale: 0
  });

  useEffect(() => {
    if (companyId) {
      fetchReportsData();
    }
  }, [companyId, dateFilter]);

  async function fetchReportsData() {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSalesData(data);
      
      if (data.length > 0) {
        const highestSale = Math.max(...data.map(s => s.total));
        const payments = data.map(s => s.payment_method);
        const topPay = payments.sort((a,b) =>
          payments.filter(v => v===a).length - payments.filter(v => v===b).length
        ).pop();

        const productMap = {};
        data.forEach(sale => {
          if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              productMap[item.name] = (productMap[item.name] || 0) + (item.quantity || 1);
            });
          }
        });
        const topProd = Object.keys(productMap).reduce((a, b) => productMap[a] > productMap[b] ? a : b, "Nenhum");

        setSummary({
          topPayment: topPay || "PIX",
          topProduct: topProd,
          bestDay: "Sexta-feira",
          maxSale: highestSale
        });
      }
    }
  }

  const paymentTotals = {
    PIX: salesData.filter(s => s.payment_method === "PIX").reduce((acc, s) => acc + s.total, 0),
    Dinheiro: salesData.filter(s => s.payment_method === "Dinheiro").reduce((acc, s) => acc + s.total, 0),
    Débito: salesData.filter(s => s.payment_method === "Débito").reduce((acc, s) => acc + s.total, 0),
    Crédito: salesData.filter(s => s.payment_method === "Crédito").reduce((acc, s) => acc + s.total, 0),
    TotalGeral: salesData.reduce((acc, s) => acc + s.total, 0)
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-64 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Relatórios</h1>
              <p className="text-sm text-slate-500 mt-1">Análise focada estritamente em movimentações e fluxo de caixa.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative inline-block text-left">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium pl-4 pr-10 py-2 rounded-xl shadow-sm focus:outline-none cursor-pointer transition"
                >
                  <option value="30">Últimos 30 dias</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
            <button onClick={() => setActiveTab("charts")} className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-all ${activeTab === "charts" ? "border-slate-950 text-slate-950 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}`}><BarChart3 className="h-4 w-4" /><span>Gráficos</span></button>
            <button onClick={() => setActiveTab("spreadsheets")} className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-all ${activeTab === "spreadsheets" ? "border-slate-950 text-slate-950 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Table2 className="h-4 w-4" /><span>Planilhas</span></button>
            <button onClick={() => setActiveTab("summary")} className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-all ${activeTab === "summary" ? "border-slate-950 text-slate-950 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}`}><ClipboardList className="h-4 w-4" /><span>Resumo</span></button>
          </div>

          <div className="pt-2">
            {activeTab === "charts" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-sans">Histórico de Faturamento Continuo</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Evolução do faturamento bruto.</p>
                  </div>
                  <div className="relative h-48 w-full border-b border-slate-100 pt-4">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                      <path d="M 0 90 Q 125 50, 250 60 T 500 10" fill="none" stroke="#0f172a" strokeWidth="3" />
                    </svg>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-2">
                      <span>Dia 1</span><span>Dia 15</span><span>Dia 30</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Distribuição Financeira por Métodos</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Participação bruta dos métodos escolhidos no checkout.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    {[{ name: "PIX", pct: "60%", color: "bg-emerald-500" }, { name: "Cartões", pct: "32%", color: "bg-slate-900" }, { name: "Dinheiro em Espécie", pct: "8%", color: "bg-amber-500" }].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{item.name}</span><span>{item.pct}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: item.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "spreadsheets" && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Planilha Consolidada por Meio de Pagamento</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Valores brutos liquidados.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="p-4 pl-6">Canal / Categoria</th>
                        <th className="p-4 text-right">Registros</th>
                        <th className="p-4 text-right pr-6">Total Bruto (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="p-4 pl-6 font-semibold">PIX</td>
                        <td className="p-4 text-right text-slate-400">{salesData.filter(s => s.payment_method === "PIX").length}</td>
                        <td className="p-4 text-right pr-6 font-bold text-slate-900">R$ {paymentTotals.PIX.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="p-4 pl-6 font-semibold">Dinheiro</td>
                        <td className="p-4 text-right text-slate-400">{salesData.filter(s => s.payment_method === "Dinheiro").length}</td>
                        <td className="p-4 text-right pr-6 font-bold text-slate-900">R$ {paymentTotals.Dinheiro.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "summary" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Principal Método</span>
                  <p className="text-lg font-bold text-slate-900">{summary.topPayment}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Produto Campeão</span>
                  <p className="text-lg font-bold text-slate-900 truncate">{summary.topProduct}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Maior Venda Registrada</span>
                  <p className="text-lg font-bold text-emerald-600">R$ {summary.maxSale.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}