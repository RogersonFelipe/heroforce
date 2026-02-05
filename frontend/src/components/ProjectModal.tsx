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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {project ? "Editar Projeto" : "Novo Projeto"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Projeto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              >
                <option className="text-black" value={ProjectStatus.PENDING}>
                  Pendente
                </option>
                <option
                  className="text-black"
                  value={ProjectStatus.IN_PROGRESS}
                >
                  Em Andamento
                </option>
                <option className="text-black" value={ProjectStatus.COMPLETED}>
                  Concluído
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Responsável *
              </label>
              <select
                value={formData.responsibleId}
                onChange={(e) =>
                  setFormData({ ...formData, responsibleId: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              >
                <option value="" className="text-black">
                  Selecione um herói
                </option>
                {users.map((user) => (
                  <option className="text-black" key={user.id} value={user.id}>
                    {user.name} ({user.character})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="border-t border-white/10 pt-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Metas de Valores
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : project ? "Atualizar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 bg-white/10 text-white font-medium py-3 rounded-lg border border-white/30 hover:bg-white/20 transition-all"
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
