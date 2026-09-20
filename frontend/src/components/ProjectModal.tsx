import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { projectsAPI } from "../services/api";
import {
  type Project,
  ProjectStatus,
  type User,
  type CreateProjectDto,
} from "../types";

interface ProjectModalProps {
  project: Project | null;
  users: User[];
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  users,
  onClose,
}) => {
  const [formData, setFormData] = useState<CreateProjectDto>({
    name: "",
    description: "",
    status: ProjectStatus.PENDING,
    agilidade: 0,
    encantamento: 0,
    eficiencia: 0,
    excelencia: 0,
    transparencia: 0,
    ambicao: 0,
    completion: 0,
    responsibleId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        agilidade: project.agilidade,
        encantamento: project.encantamento,
        eficiencia: project.eficiencia,
        excelencia: project.excelencia,
        transparencia: project.transparencia,
        ambicao: project.ambicao,
        completion: project.completion,
        responsibleId: project.responsibleId,
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (project) {
        await projectsAPI.update(project.id, formData);
      } else {
        await projectsAPI.create(formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao salvar projeto");
    } finally {
      setLoading(false);
    }
  };

  const handleGoalChange = (field: string, value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    setFormData({ ...formData, [field]: clampedValue });
  };

  const inputClasses =
    "w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {project ? "Editar projeto" : "Novo projeto"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome do projeto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={inputClasses}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className={`${inputClasses} resize-none`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ProjectStatus,
                  })
                }
                className={inputClasses}
                required
              >
                <option value={ProjectStatus.PENDING}>Pendente</option>
                <option value={ProjectStatus.IN_PROGRESS}>
                  Em andamento
                </option>
                <option value={ProjectStatus.COMPLETED}>Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Responsável *
              </label>
              <select
                value={formData.responsibleId}
                onChange={(e) =>
                  setFormData({ ...formData, responsibleId: e.target.value })
                }
                className={inputClasses}
                required
              >
                <option value="">Selecione um responsável</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.character})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Conclusão: {formData.completion}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.completion}
              onChange={(e) =>
                handleGoalChange("completion", parseInt(e.target.value))
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Metas de valores
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "agilidade", label: "Agilidade" },
                { key: "encantamento", label: "Encantamento" },
                { key: "eficiencia", label: "Eficiência" },
                { key: "excelencia", label: "Excelência" },
                { key: "transparencia", label: "Transparência" },
                { key: "ambicao", label: "Ambição" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label}: {formData[key as keyof CreateProjectDto]}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData[key as keyof CreateProjectDto] as number}
                    onChange={(e) =>
                      handleGoalChange(key, parseInt(e.target.value))
                    }
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : project ? "Atualizar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 bg-white text-slate-700 font-medium py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
