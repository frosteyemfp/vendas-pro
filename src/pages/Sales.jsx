import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { 
  Plus, Trash2, Loader2, AlertCircle, Save, X, 
  ChevronDown, ChevronUp, ShoppingBag, CreditCard, Info, Calendar
} from "lucide-react";

export default function Sales() {
  const { companyId } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Controle de Modais e Expansão de Itens
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  // Estados do Formulário de Venda
  const [saleDate, setSaleDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [hasTip, setHasTip] = useState(false);
  const [tip, setTip] = useState("");
  const [observation, setObservation] = useState("");
  const [cart, setCart] = useState([]); 

  // Carrega Vendas e Produtos fazendo o relacionamento correto para pegar o nome do produto
  async function loadData() {
    try {
      setLoading(true);
      if (!companyId) return;

      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("company_id", companyId)
        .order("name", { ascending: true });
      setProducts(prods || []);

      // Buscando os itens da venda e trazendo o nome do produto associado a partir do product_id
      const { data: sls, error: err } = await supabase
        .from("sales")
        .select(`*, sale_items(*, products(name))`)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (err) throw err;
      setSales(sls || []);
    } catch (err) {
      console.error(err);
      setError("Erro ao processar o histórico de vendas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [companyId]);

  function handleOpenAdd() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
    
    setSaleDate(localISOTime);
    setPaymentMethod("");
    setHasTip(false);
    setTip("");
    setObservation("");
    setCart([]);
    setIsModalOpen(true);
  }

  function handleAddToBag(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    if (p.stock <= 0) {
      alert(`O produto "${p.name}" está com o estoque zerado!`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.product_id === productId);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= p.stock) {
        alert(`Limite atingido! Só existem ${p.stock} unidades de "${p.name}" em estoque.`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        product_id: p.id,
        name: p.name,
        quantity: 1,
        price: p.price || 0,
        maxStock: p.stock
      }]);
    }
  }

  function handleUpdateQuantity(index, value) {
    const qty = parseInt(value) || 0;
    const item = cart[index];
    
    if (qty > item.maxStock) {
      alert(`Quantidade indisponível! Estoque máximo é de ${item.maxStock} un.`);
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = qty;
    setCart(updatedCart.filter(i => i.quantity > 0));
  }

  const totalSaleAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  async function handleSaveSale(e) {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Adicione pelo menos um produto para efetuar a venda.");
      return;
    }
    if (!paymentMethod) {
      alert("Selecione uma forma de pagamento.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const finalTip = hasTip ? (parseFloat(tip) || 0) : 0;

      const salePayload = {
        payment_method: paymentMethod,
        total: totalSaleAmount + finalTip,
        company_id: companyId,
        created_at: new Date(saleDate).toISOString()
      };

      const { data: newSale, error: saleErr } = await supabase
        .from("sales")
        .insert([salePayload])
        .select()
        .single();

      if (saleErr) throw saleErr;

      // REMOVIDO: 'product_name' do payload para obedecer a estrutura do seu banco
      const itemsPayload = cart.map(item => ({
        sale_id: newSale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsErr } = await supabase.from("sale_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(`Falha ao salvar: ${err.message || "Erro de validação nos campos."}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSale(id) {
    if (!confirm("Excluir esta venda reverterá os dados. Deseja prosseguir?")) return;
    try {
      await supabase.from("sale_items").delete().eq("sale_id", id);
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir a venda selecionada.");
    }
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-black font-sans antialiased select-none">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 ml-0 md:ml-64 transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
              <p className="text-xs text-gray-400 font-medium">{sales.length} vendas registradas</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Venda</span>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Lista de Vendas */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : sales.length === 0 ? (
            <div className="py-16 text-center text-xs font-medium text-gray-400 border border-dashed border-gray-100 rounded-2xl bg-white">
              Nenhuma movimentação de venda registrada.
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => {
                const isExpanded = expandedSaleId === sale.id;
                const totalItems = sale.sale_items ? sale.sale_items.reduce((acc, i) => acc + i.quantity, 0) : 0;

                return (
                  <div key={sale.id} className="bg-white border border-gray-100 rounded-2xl shadow-2xs overflow-hidden transition-all">
                    <div 
                      onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">V-{sale.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-xs font-semibold text-gray-700 block">
                          {new Date(sale.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }).replace(",", " às")}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium block">
                          {totalItems} {totalItems === 1 ? "produto" : "produtos"} · {sale.payment_method}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-gray-900">R$ {(sale.total || 0).toFixed(2)}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Expandido - Detalhes do Relacionamento */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50/20 space-y-3 pt-3 animate-in fade-in duration-200">
                        <div className="space-y-2">
                          {sale.sale_items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-gray-100 font-semibold">
                              {/* Busca dinamicamente o nome vindo do relacionamento products */}
                              <span className="text-gray-900">{item.products?.name || "Produto Removido"}</span>
                              <span className="text-gray-500">{item.quantity}x <span className="text-gray-900 ml-2 font-bold">R$ {((item.price || 0) * item.quantity).toFixed(2)}</span></span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end pt-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSale(sale.id); }}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-transparent hover:border-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Estornar Venda</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* MODAL: Nova Venda */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[90vh] overflow-y-auto">
                
                {/* Coluna Checkout */}
                <form onSubmit={handleSaveSale} className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <h3 className="text-sm font-bold text-gray-900">Nova Venda</h3>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-50 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
                    </div>

                    {/* Data e Horário */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> Data e Horário</label>
                      <input 
                        type="datetime-local" required value={saleDate} onChange={(e) => setSaleDate(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black transition-all"
                      />
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1"><CreditCard className="w-3 h-3"/> Forma de Pagamento</label>
                      <select 
                        required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-black transition-all"
                      >
                        <option value="">Selecione...</option>
                        <option value="Pix">Pix</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Débito">Cartão Débito</option>
                        <option value="Crédito">Cartão Crédito</option>
                      </select>
                    </div>

                    {/* Toggles de Gorjeta */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between p-1">
                        <span className="text-xs font-semibold text-gray-700">Recebeu gorjeta?</span>
                        <input 
                          type="checkbox" checked={hasTip} onChange={(e) => setHasTip(e.target.checked)}
                          className="w-4 h-4 accent-black cursor-pointer"
                        />
                      </div>
                      {hasTip && (
                        <input 
                          type="number" step="0.01" value={tip} onChange={(e) => setTip(e.target.value)}
                          placeholder="Valor da gorjeta (R$)"
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black"
                        />
                      )}
                    </div>

                    {/* Campo de Observação */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Observação (opcional)</label>
                      <textarea 
                        value={observation} onChange={(e) => setObservation(e.target.value)}
                        placeholder="Anotações sobre esta venda..." rows="2"
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black resize-none transition-all"
                      />
                    </div>

                    {/* Sacola de Compras */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Sacola atual ({cart.length})</span>
                      <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-2xl p-2 bg-gray-50/40 space-y-1">
                        {cart.length === 0 ? (
                          <p className="text-[10px] py-4 text-center text-gray-400 font-medium">Toque nos itens ao lado.</p>
                        ) : (
                          cart.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-100 text-xs font-semibold">
                              <div className="truncate max-w-[120px] text-gray-900">{item.name}</div>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" value={item.quantity} onChange={(e) => handleUpdateQuantity(index, e.target.value)}
                                  className="w-10 p-1 text-center bg-gray-50 border border-gray-200 rounded-md text-xs font-bold focus:outline-none"
                                />
                                <span className="text-gray-950 font-black min-w-[50px] text-right">R$ {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <div className="pt-4 border-t border-gray-50 space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-gray-400 uppercase">Total Geral</span>
                      <span className="text-lg font-black text-black">R$ {(totalSaleAmount + (hasTip ? parseFloat(tip) || 0 : 0)).toFixed(2)}</span>
                    </div>
                    <button 
                      type="submit" disabled={submitting}
                      className="w-full py-3 bg-zinc-400 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      <span>Finalizar Venda</span>
                    </button>
                  </div>
                </form>

                {/* Coluna Catálogo Lateral */}
                <div className="flex flex-col border-l border-gray-100 pl-0 md:pl-6 space-y-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-gray-900">Produtos</h4>
                    <input 
                      type="text" placeholder="Buscar produto..."
                      className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none"
                    />
                  </div>

                  <div className="flex-1 max-h-[400px] overflow-y-auto space-y-2 pr-1">
                    {products.map(p => {
                      const itemInCart = cart.find(i => i.product_id === p.id);
                      const currentQty = itemInCart ? itemInCart.quantity : 0;
                      const isOutOfStock = p.stock <= 0 || currentQty >= p.stock;

                      return (
                        <div key={p.id} className="p-3 border border-gray-100 rounded-2xl flex items-center justify-between bg-white shadow-3xs">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-gray-900 block">{p.name}</span>
                            <span className="text-xs font-black text-zinc-600 block">R$ {(p.price || 0).toFixed(2)}</span>
                            <span className="text-[9px] font-medium text-gray-400 block">Estoque: {p.stock - currentQty} un</span>
                          </div>
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleAddToBag(p.id)}
                            className="px-2.5 py-1.5 bg-gray-50 hover:bg-black hover:text-white border border-gray-100 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40"
                          >
                            + Adicionar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}