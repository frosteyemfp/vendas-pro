import Sidebar from "../components/Sidebar";

export default function Reports() {
  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar />

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            📈 Relatórios
          </h1>

          <p className="text-gray-400 mt-2">
            Ainda em desenvolvimento 🚧
          </p>
        </div>
      </div>
    </div>
  );
}