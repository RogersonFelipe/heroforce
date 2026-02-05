import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  Target,
  TrendingUp,
  LogOut,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { projectsAPI, usersAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { type Project, ProjectStatus, type User } from "../types";
import ProjectModal from "../components/ProjectModal";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsRes, usersRes, statsRes] = await Promise.all([
        projectsAPI.getAll(
          filter !== "all" ? { status: filter as ProjectStatus } : undefined,
        ),
        usersAPI.getAll(),
        projectsAPI.getStatistics(),
      ]);

      setProjects(projectsRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
      try {
        await projectsAPI.delete(id);
        loadData();
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Erro ao excluir projeto");
      }
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProject(null);
    loadData(); // Recarrega os dados
  };

  const getCharacterEmoji = (character: string) => {
    const emojiMap: Record<string, string> = {
      "Homem de Ferro": "🦾",
      "Capitã Marvel": "⭐",
      "Homem-Aranha": "🕷️",
      "Mulher Maravilha": "👸",
      Batman: "🦇",
      Superman: "🦸",
      "Viúva Negra": "🕸️",
      "Pantera Negra": "🐆",
      Thor: "⚡",
      Hulk: "💪",
    };
    return emojiMap[character] || "🦸";
  };

  const StatusBadge = ({ status }: { status: ProjectStatus }) => {
    const configs = {
      [ProjectStatus.PENDING]: {
        bg: "bg-gray-500",
        icon: AlertCircle,
        text: "Pendente",
      },
      [ProjectStatus.IN_PROGRESS]: {
        bg: "bg-blue-500",
        icon: Clock,
        text: "Em Andamento",
      },
      [ProjectStatus.COMPLETED]: {
        bg: "bg-green-500",
        icon: CheckCircle,
        text: "Concluído",
      },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white ${config.bg}`}
      >
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const GoalBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-semibold">{value}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">HeroForce</h1>
                <p className="text-sm text-gray-400">Central de Comando</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.character}</p>
              </div>
              <div className="text-4xl">
                {user && getCharacterEmoji(user.character)}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Projetos</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pendentes</p>
                <p className="text-3xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Em Andamento</p>
                <p className="text-3xl font-bold text-white">
                  {stats.inProgress}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Concluídos</p>
                <p className="text-3xl font-bold text-white">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === "all"
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter(ProjectStatus.PENDING)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === ProjectStatus.PENDING
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Pendente
            </button>
            <button
              onClick={() => setFilter(ProjectStatus.IN_PROGRESS)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === ProjectStatus.IN_PROGRESS
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Em Andamento
            </button>
            <button
              onClick={() => setFilter(ProjectStatus.COMPLETED)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === ProjectStatus.COMPLETED
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Concluído
            </button>
          </div>

          {user?.role === "admin" && (
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Novo Projeto
            </button>
          )}
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
            <p className="text-gray-400 mt-4">Carregando projetos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400 text-lg">Nenhum projeto encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-yellow-400/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {project.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={project.status} />
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>
                          {getCharacterEmoji(project.responsible.character)}
                        </span>
                        <span>{project.responsible.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="text-right mr-4">
                      <div className="text-3xl font-bold text-yellow-400">
                        {project.completion}%
                      </div>
                      <div className="text-xs text-gray-400">Conclusão</div>
                    </div>

                    {user?.role === "admin" && (
                      <>
                        <button
                          onClick={() => handleEditProject(project)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  <GoalBar label="Agilidade" value={project.agilidade} />
                  <GoalBar label="Encantamento" value={project.encantamento} />
                  <GoalBar label="Eficiência" value={project.eficiencia} />
                  <GoalBar label="Excelência" value={project.excelencia} />
                  <GoalBar
                    label="Transparência"
                    value={project.transparencia}
                  />
                  <GoalBar label="Ambição" value={project.ambicao} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && (
        <ProjectModal
          project={editingProject}
          users={users}
          onClose={handleModalClose}
        />
      )}

    </div>
  );
};

export default Dashboard;
