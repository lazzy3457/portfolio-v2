import { useEffect, useRef, useState } from "react";
import { fetchTraces } from "../../api/traces.js";
import CardTrace from "../card_trace/Card_trace";
import SearchBar from "../searchBar/SearchBar";
import "./SectionTrace.css";

const LANGUAGES = ["JavaScript", "React", "CSS", "PHP", "HTML", "Python", "Java", "SQL"];
const CONTEXTS = [
    { value: "pro", label: "Professionnel" },
    { value: "univ", label: "Universitaire" },
];

export default function SectionTrace({ nombre_trace = Infinity, type = "" }) {
    const [tracesState, setTracesState] = useState({
        items: [],
        loading: true,
        error: null,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilters, setActiveFilters] = useState([]);
    const [filterInput, setFilterInput] = useState("");
    const [showFilterInput, setShowFilterInput] = useState(false);
    const [language, setLanguage] = useState("");
    const [projectType, setProjectType] = useState(type);
    const [viewMode, setViewMode] = useState("grid");
    const [carouselIndex, setCarouselIndex] = useState(0);
    const carouselRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();

        Promise.resolve()
            .then(() => {
                setTracesState(prev => ({ ...prev, loading: true, error: null }));
                return fetchTraces(
                    { search: searchTerm, context: projectType },
                    { signal: controller.signal }
                );
            })
            .then(data => {
                setTracesState({
                    items: Array.isArray(data) ? data : [],
                    loading: false,
                    error: null,
                });
            })
            .catch(err => {
                if (err.name === "AbortError") return;
                console.error("Erreur:", err);
                setTracesState(prev => ({
                    ...prev,
                    loading: false,
                    error: "Impossible de charger les projets.",
                }));
            });

        return () => controller.abort();
    }, [searchTerm, projectType]);

    const filteredTraces = tracesState.items.filter(trace => {
        const searchableValues = getSearchableValues(trace);
        const normalizedLanguage = normalizeText(language);
        const matchesLanguage = !language || searchableValues.some(value => value.includes(normalizedLanguage));
        const matchesActiveFilters = activeFilters.every(filter =>
            searchableValues.some(value => value.includes(normalizeText(filter)))
        );

        return matchesLanguage && matchesActiveFilters;
    });
    const displayed = filteredTraces.slice(0, nombre_trace === Infinity ? filteredTraces.length : nombre_trace);

    useEffect(() => {
        const container = carouselRef.current;
        if (!container || viewMode !== "carousel") return;
        const handleScroll = () => {
            const cardWidth = (container.firstElementChild?.offsetWidth ?? 320) + 20;
            setCarouselIndex(Math.min(
                Math.round(container.scrollLeft / cardWidth),
                displayed.length - 1
            ));
        };
        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [viewMode, displayed.length]);

    useEffect(() => {
        setCarouselIndex(0);
        if (carouselRef.current) carouselRef.current.scrollLeft = 0;
    }, [viewMode, displayed.length]);

    const scrollToIndex = (index) => {
        const card = carouselRef.current?.children[index];
        if (!card) return;
        card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        setCarouselIndex(index);
    };
    const handlePrev = () => scrollToIndex(Math.max(0, carouselIndex - 1));
    const handleNext = () => scrollToIndex(Math.min(displayed.length - 1, carouselIndex + 1));

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
                                            placeholder="ex: JS, React..."
                                            value={filterInput}
                                            onChange={e => setFilterInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") addFilter(filterInput);
                                                if (e.key === "Escape") setShowFilterInput(false);
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
                                            >x</button>
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
                                    {CONTEXTS.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <span className="select-arrow">›</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div id="vue-toggle-bar">
                <button
                    className={`vue-btn${viewMode === "grid" ? " vue-btn--active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    aria-pressed={viewMode === "grid"}
                >
                    Conteneur
                </button>
                <button
                    className={`vue-btn${viewMode === "carousel" ? " vue-btn--active" : ""}`}
                    onClick={() => setViewMode("carousel")}
                    aria-pressed={viewMode === "carousel"}
                >
                    Carrousel
                </button>
            </div>

            <div id="conteneur_trace_wrapper">
                {viewMode === "carousel" && displayed.length > 1 && (
                    <button
                        className="carousel-arrow carousel-arrow--prev"
                        onClick={handlePrev}
                        disabled={carouselIndex === 0}
                        aria-label="Projet précédent"
                    >
                        ‹
                    </button>
                )}

                <div
                    id="conteneur_trace"
                    className={viewMode === "carousel" ? "carousel-mode" : ""}
                    ref={carouselRef}
                >
                    {tracesState.loading ? (
                        <p className="trace-status">Chargement...</p>
                    ) : tracesState.error ? (
                        <p className="trace-status trace-status-error">{tracesState.error}</p>
                    ) : displayed.length > 0 ? (
                        displayed.map(trace => (
                            <CardTrace
                                key={trace.id}
                                id={trace.id}
                                title={trace.title}
                                img={trace.img}
                                tags={getCardTags(trace)}
                                activeFilters={activeFilters}
                            />
                        ))
                    ) : (
                        <p className="trace-status">Aucun projet trouvé.</p>
                    )}
                </div>

                {viewMode === "carousel" && displayed.length > 1 && (
                    <button
                        className="carousel-arrow carousel-arrow--next"
                        onClick={handleNext}
                        disabled={carouselIndex === displayed.length - 1}
                        aria-label="Projet suivant"
                    >
                        ›
                    </button>
                )}
            </div>

            {viewMode === "carousel" && displayed.length > 1 && (
                <div id="carousel-indicator">
                    {displayed.length <= 12 && displayed.map((_, i) => (
                        <button
                            key={i}
                            className={`carousel-dot${i === carouselIndex ? " carousel-dot--active" : ""}`}
                            onClick={() => scrollToIndex(i)}
                            aria-label={`Aller au projet ${i + 1}`}
                        />
                    ))}
                    <span className="carousel-counter">{carouselIndex + 1} / {displayed.length}</span>
                </div>
            )}
        </section>
    );
}

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
}

function getCardTags(trace) {
    if (Array.isArray(trace.tags)) return trace.tags;

    return [
        ...(trace.languages ?? []).map(language => language.label),
        ...(trace.project_types ?? []).map(type => type.label),
        trace.context_label,
    ].filter(Boolean);
}

function getSearchableValues(trace) {
    return [
        trace.title,
        trace.description,
        trace.context_slug,
        trace.context_label,
        ...(trace.tags ?? []),
        ...(trace.languages ?? []).flatMap(language => [language.slug, language.label]),
        ...(trace.skills ?? []).flatMap(skill => [skill.slug, skill.label, skill.category]),
        ...(trace.project_types ?? []).flatMap(type => [type.slug, type.label]),
    ].map(normalizeText);
}
