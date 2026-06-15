import { useEffect, useState } from "react";
import Card_trace from "../card_trace/Card_trace";
import SearchBar from "../searchBar/SearchBar";
import Url_api_getSQL from "../../conf.jsx";
import "./SectionTrace.css";

const LANGUAGES = ["JavaScript", "React", "CSS", "PHP", "HTML", "Python", "Java", "SQL"];
const TYPES = [
    { value: "pro", label: "Professionnel" },
    { value: "academique", label: "Académique" },
];

export default function SectionTrace({ nombre_trace = Infinity, type = "" }) {
    const [traces, setTraces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilters, setActiveFilters] = useState([]);
    const [filterInput, setFilterInput] = useState("");
    const [showFilterInput, setShowFilterInput] = useState(false);
    const [language, setLanguage] = useState("");
    const [projectType, setProjectType] = useState(type);

    useEffect(() => {
        setProjectType(type);
    }, [type]);

    useEffect(() => {
        setLoading(true);
        let url = `${Url_api_getSQL}?table=trace&search=${encodeURIComponent(searchTerm)}`;
        if (language) url += `&language=${encodeURIComponent(language)}`;
        if (projectType) url += `&type=${encodeURIComponent(projectType)}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTraces(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur:", err);
                setLoading(false);
            });
    }, [searchTerm, language, projectType]);

    const displayed = traces.slice(0, nombre_trace === Infinity ? traces.length : nombre_trace);

    const addFilter = (value) => {
        const trimmed = value.trim();
        if (trimmed && !activeFilters.includes(trimmed)) {
            setActiveFilters(prev => [...prev, trimmed]);
        }
        setFilterInput("");
        setShowFilterInput(false);
    };

    const removeFilter = (filter) => {
        setActiveFilters(prev => prev.filter(f => f !== filter));
    };

    const hasFilters = nombre_trace === Infinity;

    return (
        <section id="section-trace-container">
            {hasFilters && (
                <div id="recherche-section">
                    <SearchBar onSearch={setSearchTerm} />

                    <div id="filtres-section">
                        <div id="filtres-gauche">
                            <div id="ajouter-filtre-wrap">
                                <button
                                    id="ajouter-filtre-btn"
                                    onClick={() => setShowFilterInput(v => !v)}
                                    aria-expanded={showFilterInput}
                                >
                                    <span>Ajouter un filtre</span>
                                    <span className="filtre-plus">+</span>
                                </button>
                                {showFilterInput && (
                                    <div id="filter-input-popup">
                                        <input
                                            type="text"
                                            placeholder="ex: JS, React…"
                                            value={filterInput}
                                            onChange={e => setFilterInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') addFilter(filterInput);
                                                if (e.key === 'Escape') setShowFilterInput(false);
                                            }}
                                            autoFocus
                                        />
                                        <button onClick={() => addFilter(filterInput)}>OK</button>
                                    </div>
                                )}
                            </div>

                            {activeFilters.length > 0 && (
                                <div id="active-filters">
                                    {activeFilters.map(f => (
                                        <span key={f} className="filter-tag">
                                            {f}
                                            <button
                                                className="filter-tag-remove"
                                                onClick={() => removeFilter(f)}
                                                aria-label={`Supprimer le filtre ${f}`}
                                            >×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div id="filtres-droite">
                            <div className="select-wrapper">
                                <select
                                    id="language-filter"
                                    value={language}
                                    onChange={e => setLanguage(e.target.value)}
                                >
                                    <option value="">Language</option>
                                    {LANGUAGES.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                                <span className="select-arrow">›</span>
                            </div>

                            <div className="select-wrapper">
                                <select
                                    id="type-filter"
                                    value={projectType}
                                    onChange={e => setProjectType(e.target.value)}
                                >
                                    <option value="">Type</option>
                                    {TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <span className="select-arrow">›</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div id="conteneur_trace">
                {loading ? (
                    <p className="trace-status">Chargement…</p>
                ) : displayed.length > 0 ? (
                    displayed.map(trace => (
                        <Card_trace
                            key={trace.id}
                            id={trace.id}
                            title={trace.title}
                            description={trace.description}
                            img={trace.img}
                            tags={trace.tags}
                        />
                    ))
                ) : (
                    <p className="trace-status">Aucun projet trouvé.</p>
                )}
            </div>
        </section>
    );
}
