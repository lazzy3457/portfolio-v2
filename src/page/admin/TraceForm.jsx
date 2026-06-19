import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTrace } from "../../api/traces.js";
import { fetchLanguages, fetchSkills, fetchProjectTypes, fetchContexts, fetchAcs } from "../../api/filters.js";
import {
    createTrace, updateTrace, uploadTraceImage,
    createLanguage, updateLanguage, deleteLanguage,
    createSkill, updateSkill, deleteSkill,
    createProjectType, updateProjectType, deleteProjectType,
    createAc, updateAc, deleteAc,
} from "../../api/admin.js";
import ImageDropZone from "./ImageDropZone.jsx";
import "./admin.css";

const EMPTY_FORM = {
    title: "",
    description: "",
    img: "",
    img_presentation: [],
    date_debut: "",
    date_fin: "",
    context_id: "",
    language_ids: [],
    skill_ids: [],
    project_type_ids: [],
    acs: [],
    sections: [],
    display_mode: "conteneur",
    carousel_interval: 4000,
};

const EMPTY_REF_FORM = { mode: null, editId: null, fields: {}, saving: false, error: null };

export default function TraceForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit   = !!id && id !== "new";

    const [form,     setForm]     = useState(EMPTY_FORM);
    const [refs,     setRefs]     = useState({ languages: [], skills: [], projectTypes: [], contexts: [], acs: [] });
    const [loading,  setLoading]  = useState(isEdit);
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState(null);

    const [refForms, setRefForms] = useState({
        languages:    { ...EMPTY_REF_FORM },
        skills:       { ...EMPTY_REF_FORM },
        projectTypes: { ...EMPTY_REF_FORM },
        acs:          { ...EMPTY_REF_FORM },
    });

    // Fichiers en attente (trace pas encore créée)
    const [pendingImg,          setPendingImg]          = useState(null);
    const [pendingPresentation, setPendingPresentation] = useState([]);

    // Charger les listes de référence
    useEffect(() => {
        Promise.all([
            fetchLanguages(),
            fetchSkills(),
            fetchProjectTypes(),
            fetchContexts(),
            fetchAcs(),
        ]).then(([languages, skills, projectTypes, contexts, acs]) => {
            setRefs({ languages, skills, projectTypes, contexts, acs });
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
                    img_presentation: Array.isArray(trace.img_presentation) ? trace.img_presentation : [],
                    date_debut:       trace.date_debut       ?? "",
                    date_fin:         trace.date_fin         ?? "",
                    context_id:       trace.context_id       ?? "",
                    language_ids:     (trace.languages      ?? []).map(l => l.id),
                    skill_ids:        (trace.skills         ?? []).map(s => s.id),
                    project_type_ids: (trace.project_types  ?? []).map(p => p.id),
                    acs:              (trace.acs            ?? []).map(a => ({ ac_id: a.id, description: a.description ?? "" })),
                    sections:         mapSections(trace.sections ?? []),
                    display_mode:     trace.display_mode      ?? "conteneur",
                    carousel_interval: trace.carousel_interval ?? 4000,
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

    // ---- ACs ----
    const toggleAc = (acId) => {
        setForm(prev => {
            const exists = prev.acs.find(a => a.ac_id === acId);
            if (exists) return { ...prev, acs: prev.acs.filter(a => a.ac_id !== acId) };
            return { ...prev, acs: [...prev.acs, { ac_id: acId, description: "" }] };
        });
    };

    const updateAcDescription = (acId, value) => {
        setForm(prev => ({
            ...prev,
            acs: prev.acs.map(a => a.ac_id === acId ? { ...a, description: value } : a),
        }));
    };

    // ---- Gestion inline des références ----
    const setRefForm = (section, patch) => {
        setRefForms(prev => ({ ...prev, [section]: { ...prev[section], ...patch } }));
    };

    const openAdd = (section) => {
        const defaults = {
            languages:    { label: "", color: "#6366f1" },
            skills:       { label: "", category: "technique" },
            projectTypes: { label: "", icon: "" },
            acs:          { title: "" },
        };
        setRefForm(section, { mode: "add", editId: null, fields: defaults[section], error: null });
    };

    const openEdit = (section, item) => {
        const fields = {
            languages:    { label: item.label, color: item.color ?? "#6366f1" },
            skills:       { label: item.label, category: item.category ?? "technique" },
            projectTypes: { label: item.label, icon: item.icon ?? "" },
            acs:          { title: item.title },
        }[section];
        setRefForm(section, { mode: "edit", editId: item.id, fields, error: null });
    };

    const cancelRefForm = (section) => {
        setRefForms(prev => ({ ...prev, [section]: { ...EMPTY_REF_FORM } }));
    };

    const handleRefDelete = async (section) => {
        const rf = refForms[section];
        const deleteFns = {
            languages:    deleteLanguage,
            skills:       deleteSkill,
            projectTypes: deleteProjectType,
            acs:          deleteAc,
        };
        const item = refs[section].find(i => i.id === rf.editId);
        const label = section === "acs" ? item?.title : item?.label;
        if (!window.confirm(`Supprimer « ${label} » ?`)) return;

        setRefForm(section, { saving: true, error: null });
        try {
            await deleteFns[section](rf.editId);
            setRefs(prev => ({ ...prev, [section]: prev[section].filter(i => i.id !== rf.editId) }));
            // Désélectionner si l'item était sélectionné
            if (section === "acs") {
                setForm(prev => ({ ...prev, acs: prev.acs.filter(a => a.ac_id !== rf.editId) }));
            } else {
                const idKey = { languages: "language_ids", skills: "skill_ids", projectTypes: "project_type_ids" }[section];
                if (idKey) setForm(prev => ({ ...prev, [idKey]: prev[idKey].filter(x => x !== rf.editId) }));
            }
            setRefForms(prev => ({ ...prev, [section]: { ...EMPTY_REF_FORM } }));
        } catch (err) {
            const msg = err.message.includes("409") || err.message.includes("utilisé")
                ? "Impossible de supprimer : cet élément est utilisé par une ou plusieurs traces."
                : err.message;
            setRefForm(section, { saving: false, error: msg });
        }
    };

    const handleRefSave = async (section) => {
        const rf = refForms[section];
        setRefForm(section, { saving: true, error: null });

        const apiFns = {
            languages:    { create: createLanguage,    update: updateLanguage    },
            skills:       { create: createSkill,       update: updateSkill       },
            projectTypes: { create: createProjectType, update: updateProjectType },
            acs:          { create: createAc,          update: updateAc          },
        };

        try {
            let result;
            if (rf.mode === "add") {
                result = await apiFns[section].create(rf.fields);
                setRefs(prev => ({ ...prev, [section]: [...prev[section], result] }));
                // Auto-sélection après création
                if (section === "acs") {
                    setForm(prev => ({ ...prev, acs: [...prev.acs, { ac_id: result.id, description: "" }] }));
                } else {
                    const idKey = { languages: "language_ids", skills: "skill_ids", projectTypes: "project_type_ids" }[section];
                    if (idKey) setForm(prev => ({ ...prev, [idKey]: [...prev[idKey], result.id] }));
                }
            } else {
                result = await apiFns[section].update(rf.editId, rf.fields);
                setRefs(prev => ({
                    ...prev,
                    [section]: prev[section].map(item => item.id === rf.editId ? result : item),
                }));
            }
            setRefForms(prev => ({ ...prev, [section]: { ...EMPTY_REF_FORM } }));
        } catch (err) {
            setRefForm(section, { saving: false, error: err.message });
        }
    };

    // ---- Sections ----
    const addSection = () =>
        set('sections', [...form.sections, { title: "", paragraphs: [] }]);

    const removeSection = (si) =>
        set('sections', form.sections.filter((_, i) => i !== si));

    const updateSection = (si, key, value) =>
        set('sections', form.sections.map((s, i) => i === si ? { ...s, [key]: value } : s));

    const addBlock = (si, type = 'paragraphe') => {
        const block = {
            type,
            content: "",
            images: [],
            pendingImages: [],
            display_mode: "conteneur",
            carousel_interval: 4000,
            video_url: "",
            link_url: "",
            link_label: "",
        };
        const sections = form.sections.map((s, i) =>
            i === si ? { ...s, paragraphs: [...s.paragraphs, block] } : s
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

    // ---- Images : miniature ----
    const handleThumbnailFiles = async (files) => {
        const file = files[0];
        if (isEdit) {
            try {
                const { filename } = await uploadTraceImage(id, file);
                set('img', filename);
            } catch (err) {
                setError(err.message);
            }
        } else {
            setPendingImg(file);
        }
    };

    const removeThumbnail = () => {
        if (isEdit) set('img', "");
        else setPendingImg(null);
    };

    const thumbnailPreviews = () => {
        if (pendingImg) {
            return [{ key: "pending-img", url: URL.createObjectURL(pendingImg) }];
        }
        if (form.img) {
            return [{ key: "current-img", url: `/assets/trace/${id}/${form.img}` }];
        }
        return [];
    };

    // ---- Images : présentation ----
    const handlePresentationFiles = async (files) => {
        if (isEdit) {
            try {
                const filenames = [];
                for (const file of files) {
                    const { filename } = await uploadTraceImage(id, file);
                    filenames.push(filename);
                }
                set('img_presentation', [...form.img_presentation, ...filenames]);
            } catch (err) {
                setError(err.message);
            }
        } else {
            setPendingPresentation(prev => [...prev, ...files]);
        }
    };

    const removePresentationImage = (key) => {
        if (key.startsWith('existing:')) {
            const filename = key.slice('existing:'.length);
            set('img_presentation', form.img_presentation.filter(f => f !== filename));
        } else if (key.startsWith('pending:')) {
            const index = Number(key.slice('pending:'.length));
            setPendingPresentation(prev => prev.filter((_, i) => i !== index));
        }
    };

    const presentationPreviews = () => [
        ...form.img_presentation.map(filename => ({
            key: `existing:${filename}`,
            url: `/assets/trace/${id}/${filename}`,
        })),
        ...pendingPresentation.map((file, i) => ({
            key: `pending:${i}`,
            url: URL.createObjectURL(file),
        })),
    ];

    // ---- Images : paragraphes ----
    const handleParagraphFiles = async (si, pi, files) => {
        if (isEdit) {
            try {
                const filenames = [];
                for (const file of files) {
                    const { filename } = await uploadTraceImage(id, file);
                    filenames.push(filename);
                }
                const para = form.sections[si].paragraphs[pi];
                updateParagraph(si, pi, 'images', [...(para.images ?? []), ...filenames]);
            } catch (err) {
                setError(err.message);
            }
        } else {
            const para = form.sections[si].paragraphs[pi];
            updateParagraph(si, pi, 'pendingImages', [...(para.pendingImages ?? []), ...files]);
        }
    };

    const removeParagraphImage = (si, pi, key) => {
        const para = form.sections[si].paragraphs[pi];
        if (key.startsWith('existing:')) {
            const filename = key.slice('existing:'.length);
            updateParagraph(si, pi, 'images', (para.images ?? []).filter(f => f !== filename));
        } else if (key.startsWith('pending:')) {
            const index = Number(key.slice('pending:'.length));
            updateParagraph(si, pi, 'pendingImages', (para.pendingImages ?? []).filter((_, i) => i !== index));
        }
    };

    const paragraphPreviews = (para) => [
        ...(para.images ?? []).map(filename => ({
            key: `existing:${filename}`,
            url: `/assets/trace/${id}/${filename}`,
        })),
        ...(para.pendingImages ?? []).map((file, i) => ({
            key: `pending:${i}`,
            url: URL.createObjectURL(file),
        })),
    ];

    // ---- Soumission ----
    const buildPayload = (sourceForm) => ({
        ...sourceForm,
        sections: sourceForm.sections.map(s => ({
            title: s.title,
            paragraphs: s.paragraphs.map(p => ({
                type: p.type ?? 'paragraphe',
                content: p.content,
                images: p.images ?? [],
                display_mode: p.display_mode ?? "conteneur",
                carousel_interval: p.carousel_interval ?? 4000,
                video_url: p.video_url ?? null,
                link_url: p.link_url ?? null,
                link_label: p.link_label ?? null,
            })),
        })),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (isEdit) {
                await updateTrace(id, buildPayload(form));
                navigate("/admin");
                return;
            }

            const created = await createTrace(buildPayload(form));
            const newId = created.id;

            const hasPending = pendingImg
                || pendingPresentation.length > 0
                || form.sections.some(s => (s.paragraphs ?? []).some(p => (p.pendingImages ?? []).length > 0));

            if (hasPending) {
                let resolvedImg = form.img;
                if (pendingImg) {
                    const { filename } = await uploadTraceImage(newId, pendingImg);
                    resolvedImg = filename;
                }

                const resolvedPresentation = [...form.img_presentation];
                for (const file of pendingPresentation) {
                    const { filename } = await uploadTraceImage(newId, file);
                    resolvedPresentation.push(filename);
                }

                const resolvedSections = [];
                for (const section of form.sections) {
                    const paragraphs = [];
                    for (const para of section.paragraphs) {
                        const images = [...(para.images ?? [])];
                        for (const file of para.pendingImages ?? []) {
                            const { filename } = await uploadTraceImage(newId, file);
                            images.push(filename);
                        }
                        paragraphs.push({
                            type: para.type ?? 'paragraphe',
                            content: para.content,
                            images,
                            display_mode: para.display_mode ?? "conteneur",
                            carousel_interval: para.carousel_interval ?? 4000,
                            video_url: para.video_url ?? null,
                            link_url: para.link_url ?? null,
                            link_label: para.link_label ?? null,
                        });
                    }
                    resolvedSections.push({ title: section.title, paragraphs });
                }

                await updateTrace(newId, buildPayload({
                    ...form,
                    img: resolvedImg,
                    img_presentation: resolvedPresentation,
                    sections: resolvedSections,
                }));
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

                    <label>
                        Image principale (miniature)
                        <ImageDropZone
                            multiple={false}
                            images={thumbnailPreviews()}
                            onFiles={handleThumbnailFiles}
                            onRemove={removeThumbnail}
                        />
                    </label>

                    <label>
                        Images de présentation
                        <ImageDropZone
                            multiple={true}
                            images={presentationPreviews()}
                            onFiles={handlePresentationFiles}
                            onRemove={removePresentationImage}
                        />
                    </label>

                    <div className="admin-row">
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

                {/* Affichage des images */}
                <fieldset className="admin-fieldset">
                    <legend>Affichage des images</legend>

                    <label>
                        Mode d'affichage
                        <select value={form.display_mode} onChange={e => set('display_mode', e.target.value)}>
                            <option value="conteneur">Conteneur (grille)</option>
                            <option value="carousel">Carrousel</option>
                        </select>
                    </label>

                    {form.display_mode === 'carousel' && (
                        <label>
                            Intervalle de défilement (secondes)
                            <input
                                type="number"
                                min="0.5"
                                max="30"
                                step="0.5"
                                value={form.carousel_interval / 1000}
                                onChange={e => set('carousel_interval', Math.round(parseFloat(e.target.value) * 1000))}
                            />
                        </label>
                    )}
                </fieldset>

                {/* Langages */}
                <fieldset className="admin-fieldset">
                    <legend>Langages / Technologies</legend>
                    <div className="admin-chip-group">
                        {refs.languages.map(l => (
                            <span key={l.id} className="admin-chip-wrapper">
                                <button
                                    type="button"
                                    className={`admin-chip${form.language_ids.includes(l.id) ? " admin-chip--active" : ""}`}
                                    onClick={() => toggleMulti('language_ids', l.id)}
                                    style={l.color && form.language_ids.includes(l.id) ? { borderColor: l.color } : {}}
                                >
                                    {l.label}
                                </button>
                                <button
                                    type="button"
                                    className="admin-chip-edit"
                                    onClick={e => { e.stopPropagation(); openEdit('languages', l); }}
                                    title="Modifier"
                                >✏</button>
                            </span>
                        ))}
                        <button type="button" className="admin-btn admin-btn--sm" onClick={() => openAdd('languages')}>+</button>
                    </div>
                    {refForms.languages.mode && (
                        <RefInlineForm
                            section="languages"
                            refForm={refForms.languages}
                            onChange={(f, v) => setRefForm('languages', { fields: { ...refForms.languages.fields, [f]: v } })}
                            onSave={() => handleRefSave('languages')}
                            onCancel={() => cancelRefForm('languages')}
                            onDelete={() => handleRefDelete('languages')}
                        />
                    )}
                </fieldset>

                {/* Types de projet */}
                <fieldset className="admin-fieldset">
                    <legend>Types de projet</legend>
                    <div className="admin-chip-group">
                        {refs.projectTypes.map(pt => (
                            <span key={pt.id} className="admin-chip-wrapper">
                                <button
                                    type="button"
                                    className={`admin-chip${form.project_type_ids.includes(pt.id) ? " admin-chip--active" : ""}`}
                                    onClick={() => toggleMulti('project_type_ids', pt.id)}
                                >
                                    {pt.icon && <>{pt.icon} </>}{pt.label}
                                </button>
                                <button
                                    type="button"
                                    className="admin-chip-edit"
                                    onClick={e => { e.stopPropagation(); openEdit('projectTypes', pt); }}
                                    title="Modifier"
                                >✏</button>
                            </span>
                        ))}
                        <button type="button" className="admin-btn admin-btn--sm" onClick={() => openAdd('projectTypes')}>+</button>
                    </div>
                    {refForms.projectTypes.mode && (
                        <RefInlineForm
                            section="projectTypes"
                            refForm={refForms.projectTypes}
                            onChange={(f, v) => setRefForm('projectTypes', { fields: { ...refForms.projectTypes.fields, [f]: v } })}
                            onSave={() => handleRefSave('projectTypes')}
                            onCancel={() => cancelRefForm('projectTypes')}
                            onDelete={() => handleRefDelete('projectTypes')}
                        />
                    )}
                </fieldset>

                {/* Compétences */}
                <fieldset className="admin-fieldset">
                    <legend>Compétences</legend>
                    <div className="admin-chip-group">
                        {refs.skills.map(s => (
                            <span key={s.id} className="admin-chip-wrapper">
                                <button
                                    type="button"
                                    className={`admin-chip${form.skill_ids.includes(s.id) ? " admin-chip--active" : ""}`}
                                    onClick={() => toggleMulti('skill_ids', s.id)}
                                >
                                    {s.label}
                                </button>
                                <button
                                    type="button"
                                    className="admin-chip-edit"
                                    onClick={e => { e.stopPropagation(); openEdit('skills', s); }}
                                    title="Modifier"
                                >✏</button>
                            </span>
                        ))}
                        {refs.skills.length === 0 && (
                            <p className="admin-muted">Aucune compétence définie en base.</p>
                        )}
                        <button type="button" className="admin-btn admin-btn--sm" onClick={() => openAdd('skills')}>+</button>
                    </div>
                    {refForms.skills.mode && (
                        <RefInlineForm
                            section="skills"
                            refForm={refForms.skills}
                            onChange={(f, v) => setRefForm('skills', { fields: { ...refForms.skills.fields, [f]: v } })}
                            onSave={() => handleRefSave('skills')}
                            onCancel={() => cancelRefForm('skills')}
                            onDelete={() => handleRefDelete('skills')}
                        />
                    )}
                </fieldset>

                {/* AC — Apprentissages Critiques */}
                <fieldset className="admin-fieldset">
                    <legend>AC — Apprentissages Critiques</legend>
                    <div className="admin-chip-group">
                        {refs.acs.map(ac => {
                            const selected = form.acs.find(a => a.ac_id === ac.id);
                            return (
                                <span key={ac.id} className="admin-chip-wrapper">
                                    <button
                                        type="button"
                                        className={`admin-chip${selected ? " admin-chip--active" : ""}`}
                                        onClick={() => toggleAc(ac.id)}
                                    >
                                        {ac.title}
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-chip-edit"
                                        onClick={e => { e.stopPropagation(); openEdit('acs', ac); }}
                                        title="Modifier"
                                    >✏</button>
                                </span>
                            );
                        })}
                        {refs.acs.length === 0 && (
                            <p className="admin-muted">Aucun AC défini.</p>
                        )}
                        <button type="button" className="admin-btn admin-btn--sm" onClick={() => openAdd('acs')}>+</button>
                    </div>
                    {refForms.acs.mode && (
                        <RefInlineForm
                            section="acs"
                            refForm={refForms.acs}
                            onChange={(f, v) => setRefForm('acs', { fields: { ...refForms.acs.fields, [f]: v } })}
                            onSave={() => handleRefSave('acs')}
                            onCancel={() => cancelRefForm('acs')}
                            onDelete={() => handleRefDelete('acs')}
                        />
                    )}
                    {form.acs.length > 0 && (
                        <div className="admin-ac-descriptions">
                            {form.acs.map(entry => {
                                const ac = refs.acs.find(a => a.id === entry.ac_id);
                                return (
                                    <div key={entry.ac_id} className="admin-ac-block">
                                        <label>{ac?.title ?? `AC #${entry.ac_id}`}</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Description de cet AC pour cette trace…"
                                            value={entry.description}
                                            onChange={e => updateAcDescription(entry.ac_id, e.target.value)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
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

                            {section.paragraphs.map((para, pi) => {
                                const blockType = para.type ?? 'paragraphe';
                                return (
                                    <div key={pi} className="admin-paragraph-block">
                                        <div className="admin-block-header">
                                            <span className="admin-block-type-badge">
                                                {blockType === 'video' ? '🎬 Vidéo' : blockType === 'lien' ? '🔗 Lien' : '¶ Paragraphe'}
                                            </span>
                                            <button type="button" className="admin-btn admin-btn--sm admin-btn--danger"
                                                onClick={() => removeParagraph(si, pi)}>
                                                ✕
                                            </button>
                                        </div>

                                        {blockType === 'paragraphe' && (
                                            <>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Paragraphe…"
                                                    value={para.content}
                                                    onChange={e => updateParagraph(si, pi, 'content', e.target.value)}
                                                />
                                                <ImageDropZone
                                                    multiple={true}
                                                    images={paragraphPreviews(para)}
                                                    onFiles={files => handleParagraphFiles(si, pi, files)}
                                                    onRemove={key => removeParagraphImage(si, pi, key)}
                                                />
                                                <div className="admin-row admin-para-display">
                                                    <label>
                                                        Affichage images
                                                        <select
                                                            value={para.display_mode ?? 'conteneur'}
                                                            onChange={e => updateParagraph(si, pi, 'display_mode', e.target.value)}
                                                        >
                                                            <option value="conteneur">Conteneur</option>
                                                            <option value="carousel">Carrousel</option>
                                                        </select>
                                                    </label>
                                                    {(para.display_mode ?? 'conteneur') === 'carousel' && (
                                                        <label>
                                                            Intervalle (s)
                                                            <input
                                                                type="number"
                                                                min="0.5"
                                                                max="30"
                                                                step="0.5"
                                                                value={(para.carousel_interval ?? 4000) / 1000}
                                                                onChange={e => updateParagraph(si, pi, 'carousel_interval', Math.round(parseFloat(e.target.value) * 1000))}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {blockType === 'video' && (
                                            <label>
                                                URL de la vidéo
                                                <input
                                                    type="url"
                                                    placeholder="https://youtube.com/watch?v=…"
                                                    value={para.video_url ?? ""}
                                                    onChange={e => updateParagraph(si, pi, 'video_url', e.target.value)}
                                                />
                                            </label>
                                        )}

                                        {blockType === 'lien' && (
                                            <>
                                                <label>
                                                    Libellé
                                                    <input
                                                        placeholder="Voir le projet…"
                                                        value={para.link_label ?? ""}
                                                        onChange={e => updateParagraph(si, pi, 'link_label', e.target.value)}
                                                    />
                                                </label>
                                                <label>
                                                    URL
                                                    <input
                                                        type="url"
                                                        placeholder="https://…"
                                                        value={para.link_url ?? ""}
                                                        onChange={e => updateParagraph(si, pi, 'link_url', e.target.value)}
                                                    />
                                                </label>
                                            </>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="admin-add-block-row">
                                <button type="button" className="admin-btn admin-btn--sm"
                                    onClick={() => addBlock(si, 'paragraphe')}>
                                    + Paragraphe
                                </button>
                                <button type="button" className="admin-btn admin-btn--sm"
                                    onClick={() => addBlock(si, 'video')}>
                                    + Vidéo
                                </button>
                                <button type="button" className="admin-btn admin-btn--sm"
                                    onClick={() => addBlock(si, 'lien')}>
                                    + Lien
                                </button>
                            </div>
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

function RefInlineForm({ section, refForm, onChange, onSave, onCancel, onDelete }) {
    const { fields, saving, error, mode } = refForm;
    return (
        <div className="admin-ref-inline-form">
            {error && <p className="admin-error">{error}</p>}
            <div className="admin-row">
                {section === 'acs' ? (
                    <label>
                        Titre *
                        <input
                            value={fields.title ?? ""}
                            onChange={e => onChange('title', e.target.value)}
                            placeholder="Ex : AC1 — Réaliser un développement"
                            autoFocus
                        />
                    </label>
                ) : (
                    <label>
                        Libellé *
                        <input
                            value={fields.label ?? ""}
                            onChange={e => onChange('label', e.target.value)}
                            autoFocus
                        />
                    </label>
                )}

                {section === 'languages' && (
                    <label>
                        Couleur
                        <div className="admin-ref-color-row">
                            <input
                                type="color"
                                value={fields.color ?? "#6366f1"}
                                onChange={e => onChange('color', e.target.value)}
                                style={{ width: 40, height: 32, padding: 2, cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#888' }}>{fields.color}</span>
                        </div>
                    </label>
                )}

                {section === 'skills' && (
                    <label>
                        Catégorie *
                        <select value={fields.category ?? "technique"} onChange={e => onChange('category', e.target.value)}>
                            <option value="technique">Technique</option>
                            <option value="framework">Framework</option>
                            <option value="transversale">Transversale</option>
                            <option value="methodo">Méthodologie</option>
                        </select>
                    </label>
                )}

                {section === 'projectTypes' && (
                    <label>
                        Icône (emoji)
                        <input
                            value={fields.icon ?? ""}
                            onChange={e => onChange('icon', e.target.value)}
                            maxLength={4}
                            placeholder="🌐"
                        />
                    </label>
                )}
            </div>
            <div className="admin-ref-inline-actions">
                {mode === "edit" && onDelete && (
                    <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={onDelete} disabled={saving}>
                        Supprimer
                    </button>
                )}
                <button type="button" className="admin-btn admin-btn--sm" onClick={onCancel} disabled={saving}>
                    Annuler
                </button>
                <button type="button" className="admin-btn admin-btn--sm admin-btn--primary" onClick={onSave} disabled={saving}>
                    {saving ? "…" : mode === "add" ? "Créer" : "Enregistrer"}
                </button>
            </div>
        </div>
    );
}

function mapSections(sections) {
    return sections.map(s => ({
        title: s.title ?? "",
        paragraphs: (s.paragraphs ?? []).map(p => ({
            type:              p.type              ?? "paragraphe",
            content:           p.content          ?? "",
            images:            Array.isArray(p.images) ? p.images : [],
            pendingImages:     [],
            display_mode:      p.display_mode      ?? "conteneur",
            carousel_interval: p.carousel_interval ?? 4000,
            video_url:         p.video_url         ?? "",
            link_url:          p.link_url          ?? "",
            link_label:        p.link_label        ?? "",
        })),
    }));
}
