import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, AlertCircle } from "lucide-react";
import { authAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    character: "",
    password: "",
    role: "hero" as const,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const characters = [
    "Homem de Ferro",
    "Capitã Marvel",
    "Homem-Aranha",
    "Mulher Maravilha",
    "Batman",
    "Superman",
    "Viúva Negra",
    "Pantera Negra",
    "Thor",
    "Hulk",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      setAuth(response.data.user, response.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Cadastro de Herói
          </h2>
          <p className="text-gray-300">Escolha sua identidade heroica</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Seu nome"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="seu-email@heroforce.com"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Personagem Heroico
            </label>
            <select
              value={formData.character}
              onChange={(e) =>
                setFormData({ ...formData, character: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            >
              <option value="" className="bg-gray-800">
                Escolha seu personagem
              </option>
              {characters.map((char) => (
                <option key={char} value={char} className="bg-gray-800">
                  {char}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
            <input
              type="checkbox"
              id="admin-role"
              checked={formData.role === "admin"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.checked ? "admin" : "hero",
                })
              }
              className="w-5 h-5 accent-yellow-400 cursor-pointer"
            />
            <label
              htmlFor="admin-role"
              className="text-gray-200 cursor-pointer select-none"
            >
              Registrar como Administrador
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Ativando Poderes..." : "Ativar Poderes"}
          </button>

          <Link
            to="/login"
            className="block w-full text-center bg-white/10 text-white font-medium py-3 rounded-lg border border-white/30 hover:bg-white/20 transition-all"
          >
            Voltar
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Register;
