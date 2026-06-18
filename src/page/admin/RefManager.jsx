import { useEffect, useState } from "react";
import { fetchLanguages, fetchSkills, fetchProjectTypes, fetchAcs } from "../../api/filters.js";
import {
    createLanguage, updateLanguage, deleteLanguage,
    createSkill,    updateSkill,    deleteSkill,
    createProjectType, updateProjectType, deleteProjectType,
    createAc,       updateAc,       deleteAc,
} from "../../api/admin.js";
import "./admin.css";

const TABS = [
    { key: "languages",    label: "Langages" },
    { key: "skills",       label: "Compétences" },
    { key: "projectTypes", label: "Types de projet" },
    { key: "acs",          label: "AC" },
];

const EMPTY_FORM = { mode: null, editId: null, fields: {}, saving: false, error: null };

const DEFAULT_FIELDS = {
    languages:    { label: "", color: "#6366f1" },
    skills:       { label: "", category: "technique" },
    projectTypes: { label: "", icon: "" },
    acs:          { title: "" },
};

const API = {
    languages:    { create: createLanguage,    update: updateLanguage,    remove: deleteLanguage    },
    skills:       { create: createSkill,       update: updateSkill,       remove: deleteSkill       },
    projectTypes: { create: createProjectType, update: updateProjectType, remove: deleteProjectType },
    acs:          { create: createAc,          update: updateAc,          remove: deleteAc          },
};

const FETCH = {
    languages:    fetchLanguages,
    skills:       fetchSkills,
    projectTypes: fetchProjectTypes,
    acs:          fetchAcs,
};

export default function RefManager() {
    const [activeTab, setActiveTab] = useState("languages");
    const [data,      setData]      = useState({ languages: [], skills: [], projectTypes: [], acs: [] });
    const [loading,   setLoading]   = useState(true);
    const [form,      setForm]      = useState({ ...EMPTY_FORM });

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetchLanguages(),
            fetchSkills(),
            fetchProjectTypes(),
            fetchAcs(),
        ]).then(([languages, skills, projectTypes, acs]) => {
            setData({ languages, skills, projectTypes, acs });
            setLoading(false);
        });
    }, []);

    const closeForm = () => setForm({ ...EMPTY_FORM });

    const openAdd = () => setForm({
        ...EMPTY_FORM,
        mode: "add",
        fields: { ...DEFAULT_FIELDS[activeTab] },
    });

    const openEdit = (item) => {
        const fields = {
            languages:    { label: item.label, color: item.color ?? "#6366f1" },
            skills:       { label: item.label, category: item.category ?? "technique" },
            projectTypes: { label: item.label, icon: item.icon ?? "" },
            acs:          { title: item.title },
        }[activeTab];
        setForm({ mode: "edit", editId: item.id, fields, saving: false, error: null });
    };

    const handleSave = async () => {
        setForm(prev => ({ ...prev, saving: true, error: null }));
        try {
            if (form.mode === "add") {
                const result = await API[activeTab].create(form.fields);
                setData(prev => ({ ...prev, [activeTab]: [...prev[activeTab], result] }));
            } else {
                const result = await API[activeTab].update(form.editId, form.fields);
                setData(prev => ({
                    ...prev,
                    [activeTab]: prev[activeTab].map(item => item.id === form.editId ? result : item),
                }));
            }
            closeForm();
        } catch (err) {
            setForm(prev => ({ ...prev, saving: false, error: err.message }));
        }
    };

    const handleDelete = async (item) => {
        const label = activeTab === "acs" ? item.title : item.label;
        if (!window.confirm(`Supprimer « ${label} » ?`)) return;
        try {
            await API[activeTab].remove(item.id);
            setData(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].filter(i => i.id !== item.id),
            }));
            if (form.editId === item.id) closeForm();
        } catch (err) {
            const msg = err.message.includes("409") || err.message.includes("utilisé")
                ? "Impossible de supprimer : cet élément est utilisé par une ou plusieurs traces."
                : err.message;
            alert(msg);
        }
    };

    const setField = (key, value) => {
        setForm(prev => ({ ...prev, fields: { ...prev.fields, [key]: value } }));
    };

    const items = data[activeTab] ?? [];

    return (
        <div className="admin-section">
            <div className="admin-section-header">
                <h2>Référentiels</h2>
            </div>

            {/* Onglets */}
            <div className="ref-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`ref-tab${activeTab === tab.key ? " ref-tab--active" : ""}`}
                        onClick={() => { setActiveTab(tab.key); closeForm(); }}
                    >
                        {tab.label}
                        <span className="ref-tab-count">{data[tab.key]?.length ?? 0}</span>
                    </button>
                ))}
            </div>

            {/* Barre d'actions */}
            <div className="ref-toolbar">
                <button
                    className="admin-btn admin-btn--primary"
                    onClick={openAdd}
                    disabled={form.mode === "add"}
                >
                    + Ajouter
                </button>
            </div>

            {/* Formulaire inline add/edit */}
            {form.mode && (
                <div className="admin-ref-inline-form ref-form-page">
                    {form.error && <p className="admin-error">{form.error}</p>}
                    <div className="admin-row">
                        {activeTab === "acs" ? (
                            <label>
                                Titre *
                                <input
                                    value={form.fields.title ?? ""}
                                    onChange={e => setField("title", e.target.value)}
                                    placeholder="Ex : AC1 — Réaliser un développement"
                                    autoFocus
                                />
                            </label>
                        ) : (
                            <label>
                                Libellé *
                                <input
                                    value={form.fields.label ?? ""}
                                    onChange={e => setField("label", e.target.value)}
                                    autoFocus
                                />
                            </label>
                        )}

                        {activeTab === "languages" && (
                            <label>
                                Couleur
                                <div className="admin-ref-color-row">
                                    <input
                                        type="color"
                                        value={form.fields.color ?? "#6366f1"}
                                        onChange={e => setField("color", e.target.value)}
                                        style={{ width: 40, height: 32, padding: 2, cursor: "pointer" }}
                                    />
                                    <span style={{ fontSize: "0.85rem", color: "#888" }}>{form.fields.color}</span>
                                </div>
                            </label>
                        )}

                        {activeTab === "skills" && (
                            <label>
                                Catégorie *
                                <select
                                    value={form.fields.category ?? "technique"}
                                    onChange={e => setField("category", e.target.value)}
                                >
                                    <option value="technique">Technique</option>
                                    <option value="framework">Framework</option>
                                    <option value="transversale">Transversale</option>
                                    <option value="methodo">Méthodologie</option>
                                </select>
                            </label>
                        )}

                        {activeTab === "projectTypes" && (
                            <label>
                                Icône (emoji)
                                <input
                                    value={form.fields.icon ?? ""}
                                    onChange={e => setField("icon", e.target.value)}
                                    maxLength={4}
                                    placeholder="🌐"
                                />
                            </label>
                        )}
                    </div>
                    <div className="admin-ref-inline-actions">
                        <button className="admin-btn admin-btn--sm" onClick={closeForm} disabled={form.saving}>
                            Annuler
                        </button>
                        <button className="admin-btn admin-btn--sm admin-btn--primary" onClick={handleSave} disabled={form.saving}>
                            {form.saving ? "…" : form.mode === "add" ? "Créer" : "Enregistrer"}
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <p className="admin-status">Chargement…</p>
            ) : items.length === 0 ? (
                <p className="admin-muted" style={{ marginTop: "1rem" }}>Aucun élément.</p>
            ) : (
                <table className="admin-table ref-table">
                    <thead>
                        <tr>
                            <th>
                                {activeTab === "acs" ? "Titre" : "Libellé"}
                            </th>
                            {activeTab === "languages"    && <th>Couleur</th>}
                            {activeTab === "skills"       && <th>Catégorie</th>}
                            {activeTab === "projectTypes" && <th>Icône</th>}
                            <th style={{ width: 100 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className={form.editId === item.id ? "ref-row--editing" : ""}>
                                <td>
                                    {activeTab === "acs" ? item.title : item.label}
                                </td>
                                {activeTab === "languages" && (
                                    <td>
                                        <div className="ref-color-swatch">
                                            {item.color && (
                                                <span
                                                    className="ref-color-dot"
                                                    style={{ background: item.color }}
                                                />
                                            )}
                                            <span className="admin-muted">{item.color ?? "—"}</span>
                                        </div>
                                    </td>
                                )}
                                {activeTab === "skills" && (
                                    <td>
                                        <span className="admin-badge">{item.category}</span>
                                    </td>
                                )}
                                {activeTab === "projectTypes" && (
                                    <td>{item.icon ?? "—"}</td>
                                )}
                                <td className="admin-actions">
                                    <button
                                        className="admin-btn admin-btn--sm"
                                        onClick={() => openEdit(item)}
                                        title="Modifier"
                                    >✏</button>
                                    <button
                                        className="admin-btn admin-btn--sm admin-btn--danger"
                                        onClick={() => handleDelete(item)}
                                        title="Supprimer"
                                    >🗑</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
