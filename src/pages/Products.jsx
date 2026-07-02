import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Products() {
  const { companyId } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    if (!companyId) return;

    const { data: p } = await supabase
      .from("products")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    const { data: c } = await supabase
      .from("categories")
      .select("*")
      .eq("company_id", companyId);

    setProducts(p || []);
    setCategories(c || []);
  }

  useEffect(() => {
    load();
  }, [companyId]);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function uploadImage(file) {
    setUploading(true);

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, file);

    if (error) {
      console.log(error);
      setUploading(false);
      return null;
    }

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    setUploading(false);
    return data.publicUrl;
  }

  async function createProduct(e) {
    e.preventDefault();
    if (!companyId) return;

    let image_url = null;

    if (imageFile) {
      image_url = await uploadImage(imageFile);
    }

    const { error } = await supabase.from("products").insert([
      {
        name,
        price: Number(price),
        stock: Number(stock),
        category_id: categoryId,
        company_id: companyId,
        image_url,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setPrice("");
    setStock("");
    setCategoryId("");
    setImageFile(null);
    setPreview(null);

    load();
  }

  async function deleteProduct(id) {
    if (!confirm("Excluir produto?")) return;

    await supabase.from("products").delete().eq("id", id);
    load();
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar />

      <div className="flex-1 p-6 space-y-6">

        <h1 className="text-2xl font-bold">📦 Produtos</h1>

        {/* FORM */}
        <form
          onSubmit={createProduct}
          className="bg-zinc-900 p-4 rounded space-y-3"
        >

          <input
            className="w-full p-2 bg-zinc-800 rounded"
            placeholder="Nome do produto"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            className="w-full p-2 bg-zinc-800 rounded"
            placeholder="Preço"
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />

          <input
            className="w-full p-2 bg-zinc-800 rounded"
            placeholder="Estoque"
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
          />

          <select
            className="w-full p-2 bg-zinc-800 rounded"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            <option value="">Selecione categoria</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* UPLOAD IMAGE */}
          <div className="space-y-2">

            <input
              type="file"
              accept="image/*"
              id="img"
              className="hidden"
              onChange={handleImage}
            />

            <label
              htmlFor="img"
              className="block bg-indigo-600 text-center p-2 rounded cursor-pointer"
            >
              📷 Escolher imagem
            </label>

            {preview && (
              <img
                src={preview}
                className="w-32 h-32 object-cover rounded"
              />
            )}

          </div>

          <button
            className="w-full bg-green-600 p-2 rounded"
            disabled={uploading}
          >
            {uploading ? "Enviando..." : "Criar Produto"}
          </button>

        </form>

        {/* LISTA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {products.map(p => (
            <div
              key={p.id}
              className="bg-zinc-900 p-4 rounded space-y-2"
            >

              {p.image_url && (
                <img
                  src={p.image_url}
                  className="w-full h-40 object-cover rounded"
                />
              )}

              <h2 className="font-bold">{p.name}</h2>
              <p>R$ {Number(p.price).toFixed(2)}</p>
              <p>Estoque: {p.stock}</p>

              <button
                onClick={() => deleteProduct(p.id)}
                className="w-full bg-red-600 p-2 rounded"
              >
                Excluir
              </button>

            </div>
          ))}

        </div>

      </div>
    </div>
  );
}