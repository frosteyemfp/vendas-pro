import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { 
  Plus, Trash2, Loader2, AlertCircle, X, 
  ChevronDown, ChevronUp, CreditCard, Calendar, Search
} from "lucide-react";

export default function Sales() {
  const { companyId } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [saleDate, setSaleDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [hasTip, setHasTip] = useState(false);
  const [tip, setTip] = useState("");
  const [observation, setObservation] = useState("");
  const [cart, setCart] = useState([]); 

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
    setSearchTerm("");
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
        observation: observation || null,
        created_at: new Date(saleDate).toISOString()
      };

      const { data: newSale, error: saleErr } = await supabase
        .from("sales")
        .insert([salePayload])
        .select()
        .single();

      if (saleErr) throw saleErr;

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
    if (!confirm("Excluir esta venda reverterá os dados e estornará os itens ao estoque. Deseja prosseguir?")) return;
    try {
      setLoading(true);
      setError(null);

      const { error: itemsErr } = await supabase
        .from("sale_items")
        .delete()
        .eq("sale_id", id);
        
      if (itemsErr) throw itemsErr;

      const { error: saleErr } = await supabase
        .from("sales")
        .delete()
        .eq("id", id);
        
      if (saleErr) throw saleErr;

      loadData();
    } catch (err) {
      console.error(err);
      setError(`Não foi possível estornar a venda: ${err.message || "Erro de conexão."}`);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-chat-bg text-zinc-900 dark:text-chat-text font-sans antialiased transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 w-full p-4 md:p-10 ml-0 md:ml-64 pt-24 md:pt-10 pb-24 transition-all duration-200">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-zinc-950 dark:text-white">Vendas</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{sales.length} vendas registradas</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Venda</span>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-semibold text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Lista de Vendas */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400 dark:text-zinc-600" />
            </div>
          ) : sales.length === 0 ? (
            <div className="py-16 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-chat-card">
              Nenhuma movimentação de venda registrada.
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => {
                const isExpanded = expandedSaleId === sale.id;
                const totalItems = sale.sale_items ? sale.sale_items.reduce((acc, i) => acc + i.quantity, 0) : 0;

                return (
                  <div key={sale.id} className="bg-white dark:bg-chat-card border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl shadow-xs overflow-hidden transition-all">
                    <div 
                      onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 block uppercase tracking-wider">V-{sale.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                          {new Date(sale.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }).replace(",", " às")}
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium block">
                          {totalItems} {totalItems === 1 ? "produto" : "produtos"} · {sale.payment_method}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-zinc-950 dark:text-white">R$ {(sale.total || 0).toFixed(2)}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-800/10 space-y-3 pt-3">
                        <div className="space-y-2">
                          {sale.sale_items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-chat-bg p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60 font-semibold">
                              <span className="text-zinc-900 dark:text-zinc-100">{item.products?.name || "Produto Removido"}</span>
                              <span className="text-zinc-500 dark:text-zinc-400">{item.quantity}x <span className="text-zinc-950 dark:text-white ml-2 font-bold">R$ {((item.price || 0) * item.quantity).toFixed(2)}</span></span>
                            </div>
                          ))}
                        </div>
                        {sale.observation && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-chat-bg p-2 rounded-lg italic">Obs: {sale.observation}</p>
                        )}
                        <div className="flex justify-end pt-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSale(sale.id); }}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-transparent hover:border-red-500/20"
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
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-chat-card rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-chat-text">
                
                {/* Coluna Checkout */}
                <form onSubmit={handleSaveSale} className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
                      <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Nova Venda</h3>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                        <X className="h-4 w-4 text-zinc-400" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Data e Hora da Venda</label>
                        <input 
                          type="datetime-local" 
                          value={saleDate} 
                          onChange={(e) => setSaleDate(e.target.value)}
                          required
                          className="w-full bg-zinc-50 dark:bg-chat-bg p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-zinc-300 dark:focus:border-zinc-700 text-zinc-800 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Forma de Pagamento</label>
                        <select 
                          value={paymentMethod} 
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          required
                          className="w-full bg-zinc-50 dark:bg-chat-bg p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs font-semibold focus:outline-none text-zinc-800 dark:text-zinc-100"
                        >
                          <option value="">Selecione...</option>
                          <option value="PIX">PIX</option>
                          <option value="Dinheiro">Dinheiro em Espécie</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input 
                          type="checkbox" 
                          id="hasTip" 
                          checked={hasTip} 
                          onChange={(e) => setHasTip(e.target.checked)}
                          className="rounded text-zinc-950 focus:ring-0"
                        />
                        <label htmlFor="hasTip" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 select-none cursor-pointer">
                          Adicionar Gorjeta / Extra
                        </label>
                      </div>

                      {hasTip && (
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Valor da Gorjeta (R$)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00" 
                            value={tip} 
                            onChange={(e) => setTip(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-chat-bg p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs font-semibold focus:outline-none text-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Observações internas</label>
                        <textarea 
                          rows="2" 
                          placeholder="Ex: Embrulhado para presente..." 
                          value={observation} 
                          onChange={(e) => setObservation(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-chat-bg p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs font-semibold focus:outline-none text-zinc-800 dark:text-zinc-100 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumo da Sacola e Botão Concluir */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-4 space-y-3">
                    <div className="bg-zinc-50 dark:bg-chat-bg/60 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800/40 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-zinc-500">
                        <span>Produtos:</span>
                        <span>R$ {totalSaleAmount.toFixed(2)}</span>
                      </div>
                      {hasTip && (
                        <div className="flex justify-between text-xs font-semibold text-zinc-500">
                          <span>Gorjeta:</span>
                          <span>R$ {(parseFloat(tip) || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black text-zinc-950 dark:text-white pt-1 border-t border-zinc-200/40 dark:border-zinc-800/40">
                        <span>TOTAL GERAL:</span>
                        <span className="text-emerald-500">R$ {(totalSaleAmount + (hasTip ? (parseFloat(tip) || 0) : 0)).toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Salvando Venda...</span>
                        </>
                      ) : (
                        <span>Concluir e Lançar Caixa</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Coluna de Seleção de Produtos */}
                <div className="flex flex-col space-y-4 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800/60 md:pt-0 md:pl-6 pt-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-950 dark:text-white mb-2 flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Adicionar Itens ao Carrinho</span>
                    </h4>
                    <input 
                      type="text" 
                      placeholder="Buscar produto pelo nome..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-chat-bg p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs font-medium focus:outline-none text-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  {/* Lista Fluida de Itens */}
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[30vh] pr-1">
                    {filteredProducts.length === 0 ? (
                      <p className="text-center text-[11px] font-medium text-zinc-400 py-4">Nenhum produto em estoque.</p>
                    ) : (
                      filteredProducts.map((p) => {
                        const inCart = cart.find(item => item.product_id === p.id);
                        const qtyInCart = inCart ? inCart.quantity : 0;

                        return (
                          <div 
                            key={p.id} 
                            onClick={() => handleAddToBag(p.id)}
                            className="p-2 bg-zinc-50 hover:bg-zinc-100/80 dark:bg-chat-bg dark:hover:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer transition-all select-none group"
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">{p.name}</p>
                              <p className="text-[10px] font-medium text-zinc-400">Estoque: {p.stock} un · R$ {(p.price || 0).toFixed(2)}</p>
                            </div>
                            {qtyInCart > 0 ? (
                              <span className="px-2 py-0.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-bold rounded-md">{qtyInCart}x</span>
                            ) : (
                              <Plus className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Itens Atuais na Sacola de Compras */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-3 flex-1 flex flex-col min-h-[150px]">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">Sacola Atual ({cart.length})</span>
                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[25vh] pr-1">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center text-[10px] font-medium text-zinc-400">
                          Toque nos produtos ao lado para montar o pedido.
                        </div>
                      ) : (
                        cart.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-zinc-50/50 dark:bg-chat-bg/30 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/40 text-xs font-semibold">
                            <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0"
                                max={item.maxStock}
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(index, e.target.value)}
                                className="w-10 bg-white dark:bg-chat-bg text-center p-1 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-white"
                              />
                              <span className="text-zinc-400 text-[11px]">un</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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