import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTrace } from "../../api/traces.js";
import { fetchLanguages, fetchSkills, fetchProjectTypes, fetchContexts } from "../../api/filters.js";
import { createTrace, updateTrace } from "../../api/admin.js";
import "./admin.css";

const EMPTY_FORM = {
    title: "",
    description: "",
    img: "",
    date_debut: "",
    date_fin: "",
    context_id: "",
    language_ids: [],
    skill_ids: [],
    project_type_ids: [],
    sections: [],
};

export default function TraceForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit   = !!id && id !== "new";

    const [form,     setForm]     = useState(EMPTY_FORM);
    const [refs,     setRefs]     = useState({ languages: [], skills: [], projectTypes: [], contexts: [] });
    const [loading,  setLoading]  = useState(isEdit);
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState(null);

    // Charger les listes de référence
    useEffect(() => {
        Promise.all([
            fetchLanguages(),
            fetchSkills(),
            fetchProjectTypes(),
            fetchContexts(),
        ]).then(([languages, skills, projectTypes, contexts]) => {
            setRefs({ languages, skills, projectTypes, contexts });
        });
    }, []);

    // Charger la trace à éditer
    useEffect(() => {
        if (!isEdit) return;
        fetchTrace(id)
            .then(trace => {
                setForm({
                    title:            trace.title            ?? "",
                    description:      trace.description      ?? "",
                    img:              trace.img              ?? "",
                    date_debut:       trace.date_debut       ?? "",
                    date_fin:         trace.date_fin         ?? "",
                    context_id:       trace.context_id       ?? "",
                    language_ids:     (trace.languages      ?? []).map(l => l.id),
                    skill_ids:        (trace.skills         ?? []).map(s => s.id),
                    project_type_ids: (trace.project_types  ?? []).map(p => p.id),
                    sections:         mapSections(trace.sections ?? []),
                });
                setLoading(false);
            })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [id, isEdit]);

    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const toggleMulti = (key, itemId) => {
        setForm(prev => ({
            ...prev,
            [key]: prev[key].includes(itemId)
                ? prev[key].filter(x => x !== itemId)
                : [...prev[key], itemId],
        }));
    };

    // ---- Sections ----
    const addSection = () =>
        set('sections', [...form.sections, { title: "", paragraphs: [] }]);

    const removeSection = (si) =>
        set('sections', form.sections.filter((_, i) => i !== si));

    const updateSection = (si, key, value) =>
        set('sections', form.sections.map((s, i) => i === si ? { ...s, [key]: value } : s));

    const addParagraph = (si) => {
        const sections = form.sections.map((s, i) =>
            i === si ? { ...s, paragraphs: [...s.paragraphs, { content: "", images: [] }] } : s
        );
        set('sections', sections);
    };

    const removeParagraph = (si, pi) => {
        const sections = form.sections.map((s, i) =>
            i === si ? { ...s, paragraphs: s.paragraphs.filter((_, j) => j !== pi) } : s
        );
        set('sections', sections);
    };

    const updateParagraph = (si, pi, key, value) => {
        const sections = form.sections.map((s, i) =>
            i === si ? {
                ...s,
                paragraphs: s.paragraphs.map((p, j) =>
                    j === pi ? { ...p, [key]: value } : p
                )
            } : s
        );
        set('sections', sections);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (isEdit) {
                await updateTrace(id, form);
            } else {
                await createTrace(form);
            }
            navigate("/admin");
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    if (loading) return <p className="admin-status">Chargement…</p>;

    return (
        <div className="admin-section">
            <h2>{isEdit ? "Modifier la trace" : "Nouvelle trace"}</h2>

            {error && <p className="admin-error">{error}</p>}

            <form className="admin-form" onSubmit={handleSubmit}>

                {/* Champs principaux */}
                <fieldset className="admin-fieldset">
                    <legend>Informations générales</legend>

                    <label>
                        Titre *
                        <input value={form.title} onChange={e => set('title', e.target.value)} required />
                    </label>

                    <label>
                        Description
                        <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
                    </label>

                    <div className="admin-row">
                        <label>
                            Image principale (nom de fichier)
                            <input value={form.img} onChange={e => set('img', e.target.value)} placeholder="cover.png" />
                        </label>
                        <label>
                            Contexte
                            <select value={form.context_id} onChange={e => set('context_id', e.target.value)}>
                                <option value="">— Choisir —</option>
                                {refs.contexts.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="admin-row">
                        <label>
                            Date début
                            <input type="date" value={form.date_debut} onChange={e => set('date_debut', e.target.value)} />
                        </label>
                        <label>
                            Date fin <small>(vide = en cours)</small>
                            <input type="date" value={form.date_fin} onChange={e => set('date_fin', e.target.value)} />
                        </label>
                    </div>
                </fieldset>

                {/* Langages */}
                <fieldset className="admin-fieldset">
                    <legend>Langages / Technologies</legend>
                    <div className="admin-chip-group">
                        {refs.languages.map(l => (
                            <button
                                key={l.id}
                                type="button"
                                className={`admin-chip${form.language_ids.includes(l.id) ? " admin-chip--active" : ""}`}
                                onClick={() => toggleMulti('language_ids', l.id)}
                                style={l.color && form.language_ids.includes(l.id) ? { borderColor: l.color } : {}}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </fieldset>

                {/* Types de projet */}
                <fieldset className="admin-fieldset">
                    <legend>Types de projet</legend>
                    <div className="admin-chip-group">
                        {refs.projectTypes.map(pt => (
                            <button
                                key={pt.id}
                                type="button"
                                className={`admin-chip${form.project_type_ids.includes(pt.id) ? " admin-chip--active" : ""}`}
                                onClick={() => toggleMulti('project_type_ids', pt.id)}
                            >
                                {pt.icon && <>{pt.icon} </>}{pt.label}
                            </button>
                        ))}
                    </div>
                </fieldset>

                {/* Compétences */}
                <fieldset className="admin-fieldset">
                    <legend>Compétences</legend>
                    <div className="admin-chip-group">
                        {refs.skills.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                className={`admin-chip${form.skill_ids.includes(s.id) ? " admin-chip--active" : ""}`}
                                onClick={() => toggleMulti('skill_ids', s.id)}
                            >
                                {s.label}
                            </button>
                        ))}
                        {refs.skills.length === 0 && (
                            <p className="admin-muted">Aucune compétence définie en base.</p>
                        )}
                    </div>
                </fieldset>

                {/* Sections de contenu */}
                <fieldset className="admin-fieldset">
                    <legend>Contenu</legend>

                    {form.sections.map((section, si) => (
                        <div key={si} className="admin-section-block">
                            <div className="admin-section-block-header">
                                <input
                                    placeholder={`Titre section ${si + 1}`}
                                    value={section.title}
                                    onChange={e => updateSection(si, 'title', e.target.value)}
                                    className="admin-section-title"
                                />
                                <button type="button" className="admin-btn admin-btn--sm admin-btn--danger"
                                    onClick={() => removeSection(si)}>
                                    Supprimer section
                                </button>
                            </div>

                            {section.paragraphs.map((para, pi) => (
                                <div key={pi} className="admin-paragraph-block">
                                    <textarea
                                        rows={3}
                                        placeholder="Paragraphe…"
                                        value={para.content}
                                        onChange={e => updateParagraph(si, pi, 'content', e.target.value)}
                                    />
                                    <input
                                        placeholder="Images (séparées par virgule)"
                                        value={(para.images ?? []).join(', ')}
                                        onChange={e => updateParagraph(si, pi, 'images',
                                            e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                        )}
                                    />
                                    <button type="button" className="admin-btn admin-btn--sm admin-btn--danger"
                                        onClick={() => removeParagraph(si, pi)}>
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <button type="button" className="admin-btn admin-btn--sm"
                                onClick={() => addParagraph(si)}>
                                + Paragraphe
                            </button>
                        </div>
                    ))}

                    <button type="button" className="admin-btn" onClick={addSection}>
                        + Section
                    </button>
                </fieldset>

                <div className="admin-form-actions">
                    <button type="button" className="admin-btn" onClick={() => navigate("/admin")}>
                        Annuler
                    </button>
                    <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                        {saving ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function mapSections(sections) {
    return sections.map(s => ({
        title: s.title ?? "",
        paragraphs: (s.paragraphs ?? []).map(p => ({
            content: p.content ?? "",
            images:  Array.isArray(p.images) ? p.images : [],
        })),
    }));
}
