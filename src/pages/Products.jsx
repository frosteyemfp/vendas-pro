import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, Edit2, Loader2, AlertCircle, Save, X, ImageIcon, UploadCloud } from "lucide-react";

export default function Products() {
  const { companyId } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  async function loadProducts() {
    try {
      setLoading(true);
      if (!companyId) {
        setLoading(false);
        return;
      }

      const { data, error: err } = await supabase
        .from("products")
        .select("*")
        .eq("company_id", companyId)
        .order("name", { ascending: true });

      if (err) throw err;
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar a lista de produtos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [companyId]);

  function handleOpenAdd() {
    if (!companyId) {
      setError("Você precisa configurar e salvar os dados do seu Estabelecimento na tela de Configurações antes de adicionar produtos.");
      return;
    }
    setError(null);
    setEditingId(null);
    setName("");
    setCostPrice("");
    setSalePrice("");
    setStock("");
    setImageUrl("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(product) {
    setError(null);
    setEditingId(product.id);
    setName(product.name);
    setCostPrice(product.cost_price || "");
    setSalePrice(product.price || ""); 
    setStock(product.stock || "");
    setImageUrl(product.image_url || "");
    setIsModalOpen(true);
  }

  async function handleUploadImage(e) {
    try {
      setError(null);
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecione um arquivo de imagem válido.");
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${companyId || "anonymous"}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err) {
      console.error("Erro detalhado no upload da imagem:", err);
      setError(err.message || "Não foi possível enviar a imagem selecionada.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    if (!name.trim() || !salePrice || !stock) return;
    if (!companyId) {
      setError("Erro: ID do estabelecimento não encontrado. Configure sua loja primeiro.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        cost_price: parseFloat(costPrice) || 0,
        price: parseFloat(salePrice),
        stock: parseInt(stock),
        image_url: imageUrl,
        company_id: companyId
      };

      if (editingId) {
        const { error: err } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("products")
          .insert([payload]);
        if (err) throw err;
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      console.error(err);
      setError("Falha ao salvar as informações do produto.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProduct(id) {
    if (!confirm("Tem certeza que deseja excluir permanentemente este item?")) return;
    try {
      const { error: err } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      if (err) throw err;
      loadProducts();
    } catch (err) {
      console.error(err);
      setError("Não foi possível remover o produto selecionado.");
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-[#212121] text-zinc-900 dark:text-[#ececec] font-sans antialiased select-none transition-colors duration-200">
      <Sidebar />

      {/* RECUO PRINCIPAL: pt-24 impede sobreposições do topo no celular */}
      <main className="flex-1 p-4 md:p-10 ml-0 md:ml-64 pt-24 md:pt-10 pb-24 transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-zinc-950 dark:text-white">Cadastro de Produtos</h1>
              <p className="text-xs text-zinc-400 dark:text-zinc-400 font-medium">Controle seu catálogo de mercadorias, custos e estoque ativo</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Produto</span>
            </button>
          </div>

          {!companyId && !loading && (
            <div className="flex items-start gap-2.5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs font-semibold text-amber-500">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Estabelecimento não configurado</p>
                <p className="font-normal opacity-90 mt-0.5">Vá até a aba de <strong>Configurações</strong>, defina o nome da sua loja e salve para poder gerenciar seus produtos.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-semibold text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Listagem de Itens */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl bg-white dark:bg-[#2f2f2f]">
              Nenhum item cadastrado no seu portfólio de vendas.
            </div>
          ) : (
            <div className="bg-white dark:bg-[#2f2f2f] border border-zinc-100 dark:border-zinc-700/50 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-700/40 bg-zinc-50/40 dark:bg-[#212121]/40 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      <th className="p-4 w-16">Foto</th>
                      <th className="p-4">Item / Nome</th>
                      <th className="p-4">Preço Custo</th>
                      <th className="p-4">Preço Venda</th>
                      <th className="p-4 text-center">Estoque</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 divide-y divide-zinc-100 dark:divide-zinc-700/40">
                    {products.map((product) => {
                      const isOutOfStock = product.stock <= 0;

                      return (
                        <tr 
                          key={product.id} 
                          className={`hover:bg-zinc-50/30 dark:hover:bg-[#212121]/30 transition-all duration-200 ${
                            isOutOfStock ? "opacity-40" : ""
                          }`}
                        >
                          <td className="p-4">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-9 h-9 object-cover rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-xs" />
                            ) : (
                              <div className="w-9 h-9 bg-zinc-50 dark:bg-[#212121] border border-zinc-100 dark:border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400"><ImageIcon className="w-4 h-4" /></div>
                            )}
                          </td>
                          <td className="p-4 text-zinc-950 dark:text-white font-bold">{product.name}</td>
                          <td className="p-4 text-zinc-400 dark:text-zinc-500">R$ {(product.cost_price || 0).toFixed(2)}</td>
                          <td className="p-4 text-zinc-950 dark:text-zinc-200">R$ {(product.price || 0).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOutOfStock 
                                ? "bg-red-500/10 text-red-500" 
                                : product.stock <= 5 
                                  ? "bg-amber-500/10 text-amber-500" 
                                  : "bg-zinc-100 dark:bg-[#212121] text-zinc-600 dark:text-zinc-400"
                            }`}>
                              {isOutOfStock ? "Esgotado" : `${product.stock} un`}
                            </span>
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenEdit(product)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-[#212121] text-zinc-500 dark:text-zinc-400 rounded-lg transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODAL SUSPENSO */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#2f2f2f] rounded-3xl w-full max-w-md p-6 shadow-2xl border border-zinc-100 dark:border-zinc-700/60 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                    {editingId ? "Editar Informações do Produto" : "Cadastrar Novo Produto"}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><X className="h-4 w-4 text-zinc-400" /></button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase">Imagem de Exibição</label>
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        <div className="relative group w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                          <img src={imageUrl} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setImageUrl("")}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex flex-col items-center justify-center cursor-pointer text-zinc-400">
                          <UploadCloud className="h-4 w-4" />
                          <span className="text-[9px] font-bold mt-1">Upload</span>
                          <input type="file" accept="image/*" disabled={uploading} onChange={handleUploadImage} className="hidden" />
                        </label>
                      )}
                      {uploading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase">Nome do Item</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 bg-zinc-50 dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none" placeholder="Ex: Coca-Cola Lata 350ml" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase">Preço de Custo (R$)</label>
                      <input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full p-2.5 bg-zinc-50 dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none" placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase">Preço de Venda (R$)</label>
                      <input type="number" step="0.01" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full p-2.5 bg-zinc-50 dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase">Estoque Inicial (Qtd)</label>
                    <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} className="w-full p-2.5 bg-zinc-50 dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none" placeholder="Ex: 50" />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting || uploading}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-white text-xs font-bold p-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>{editingId ? "Salvar Alterações" : "Concluir Cadastro"}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}