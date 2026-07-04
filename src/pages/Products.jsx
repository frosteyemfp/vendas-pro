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

  // Estados dos Campos do Formulário
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
      if (!companyId) return;

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
    setEditingId(null);
    setName("");
    setCostPrice("");
    setSalePrice("");
    setStock("");
    setImageUrl("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(product) {
    setEditingId(product.id);
    setName(product.name);
    setCostPrice(product.cost_price || "");
    setSalePrice(product.price || ""); 
    setStock(product.stock || "");
    setImageUrl(product.image_url || "");
    setIsModalOpen(true);
  }

  // Função para fazer o upload da imagem no Storage do Supabase
  async function handleUploadImage(e) {
    try {
      setError(null);
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      // Validação básica de tipo de arquivo
      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecione um arquivo de imagem válido.");
        return;
      }

      const fileExt = file.name.split('.').pop();
      // Usando o timestamp atual para garantir nomes únicos e limpos
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${companyId}/${fileName}`;

      // Envia o arquivo para o bucket chamado 'products'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permite sobrescrever se houver conflito raro
        });

      if (uploadError) throw uploadError;

      // Pega a URL pública gerada
      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err) {
      // Exibe o erro real do Supabase no console para te ajudar a debugar
      console.error("Erro detalhado no upload da imagem:", err);
      setError(err.message || "Não foi possível enviar a imagem selecionada.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    if (!name.trim() || !salePrice || !stock) return;

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
    <div className="flex min-h-screen bg-[#fafafa] text-black font-sans antialiased select-none">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 ml-0 md:ml-64 transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cadastro de Produtos</h1>
              <p className="text-xs text-gray-400 font-medium">Controle seu catálogo de mercadorias, custos e estoque ativo</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Produto</span>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Grid de Listagem */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-xs font-medium text-gray-400 border border-dashed border-gray-100 rounded-2xl bg-white">
              Nenhum item cadastrado no seu portfólio de vendas.
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/40 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-4">Foto</th>
                    <th className="p-4">Item / Nome</th>
                    <th className="p-4">Preço Custo</th>
                    <th className="p-4">Preço Venda</th>
                    <th className="p-4 text-center">Estoque</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-gray-700 divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="p-4">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-9 h-9 object-cover rounded-xl border border-gray-100 shadow-2xs" />
                        ) : (
                          <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400"><ImageIcon className="w-4 h-4" /></div>
                        )}
                      </td>
                      <td className="p-4 text-gray-900 font-bold">{product.name}</td>
                      <td className="p-4 text-gray-500">R$ {(product.cost_price || 0).toFixed(2)}</td>
                      <td className="p-4 text-gray-900">R$ {(product.price || 0).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          product.stock <= 5 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"
                        }`}>
                          {product.stock} un
                        </span>
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MODAL SUSPENSO: Adicionar ou Editar */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">
                    {editingId ? "Editar Informações do Produto" : "Cadastrar Novo Produto"}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-50 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  
                  {/* Upload de Imagem */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Imagem de Exibição</label>
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        <div className="relative group w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                          <img src={imageUrl} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setImageUrl("")}
                            className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Trocar
                          </button>
                        </div>
                      ) : (
                        <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              <UploadCloud className="h-4 w-4 text-gray-400" />
                              <span className="text-[8px] font-bold text-gray-400 mt-0.5">Upload</span>
                            </>
                          )}
                          <input type="file" accept="image/*" disabled={uploading} onChange={handleUploadImage} className="hidden" />
                        </label>
                      )}
                      <div className="text-[10px] text-gray-400 font-medium">
                        Selecione um arquivo quadrado (PNG ou JPG) para renderização nas listagens e balcão de vendas.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Nome Comercial</label>
                    <input 
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Ração Golden 15kg"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Preço Custo (R$)</label>
                      <input 
                        type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Preço Venda (R$)</label>
                      <input 
                        type="number" step="0.01" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Quantidade em Estoque</label>
                    <input 
                      type="number" required value={stock} onChange={(e) => setStock(e.target.value)}
                      placeholder="Ex: 50"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" disabled={submitting || uploading}
                      className="flex-1 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      <span>{editingId ? "Salvar Alterações" : "Cadastrar Item"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}