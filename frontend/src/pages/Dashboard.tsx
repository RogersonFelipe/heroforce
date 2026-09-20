import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Target,
  TrendingUp,
  Clock3,
  CheckCircle2,
  LogOut,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { projectsAPI, usersAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { type Project, ProjectStatus, type User } from "../types";
import ProjectModal from "../components/ProjectModal";

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getAvatarColor = (name: string) => {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const Avatar: React.FC<{ name: string; size?: "sm" | "md" }> = ({
  name,
  size = "md",
}) => {
  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${sizeClasses} ${getAvatarColor(name)} rounded-full flex items-center justify-center font-semibold shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: ProjectStatus.PENDING, label: "Pendente" },
  { value: ProjectStatus.IN_PROGRESS, label: "Em andamento" },
  { value: ProjectStatus.COMPLETED, label: "Concluído" },
];

const GOALS: { key: keyof Project; label: string }[] = [
  { key: "agilidade", label: "Agilidade" },
  { key: "encantamento", label: "Encantamento" },
  { key: "eficiencia", label: "Eficiência" },
  { key: "excelencia", label: "Excelência" },
  { key: "transparencia", label: "Transparência" },
  { key: "ambicao", label: "Ambição" },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
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

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProject(null);
    loadData();
  };

  const StatusBadge = ({ status }: { status: ProjectStatus }) => {
    const configs = {
      [ProjectStatus.PENDING]: {
        classes: "bg-slate-100 text-slate-600",
        text: "Pendente",
      },
      [ProjectStatus.IN_PROGRESS]: {
        classes: "bg-blue-50 text-blue-700",
        text: "Em andamento",
      },
      [ProjectStatus.COMPLETED]: {
        classes: "bg-emerald-50 text-emerald-700",
        text: "Concluído",
      },
    };

    const config = configs[status];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.classes}`}
      >
        {config.text}
      </span>
    );
  };

  const GoalBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-700 font-medium">{value}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900">
                HeroForce
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500">{user?.character}</p>
              </div>
              <Avatar name={user?.name || "?"} size="sm" />
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total de projetos</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Pendentes</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {stats.pending}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Em andamento</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {stats.inProgress}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Concluídos</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {stats.completed}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {user?.role === "admin" && (
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo projeto
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600"></div>
            <p className="text-slate-500 mt-4 text-sm">
              Carregando projetos...
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Target className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Nenhum projeto encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-slate-500 text-sm mb-3">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={project.status} />
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Avatar name={project.responsible.name} size="sm" />
                        <span>{project.responsible.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="text-right mr-2">
                      <div className="text-2xl font-semibold text-slate-900">
                        {project.completion}%
                      </div>
                      <div className="text-xs text-slate-500">Conclusão</div>
                    </div>

                    {user?.role === "admin" && (
                      <>
                        <button
                          onClick={() => handleEditProject(project)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                  {GOALS.map(({ key, label }) => (
                    <GoalBar
                      key={key}
                      label={label}
                      value={project[key] as number}
                    />
                  ))}
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
