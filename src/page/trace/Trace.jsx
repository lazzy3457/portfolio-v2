import './trace.css';
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchTrace } from "../../api/traces.js";

export default function Trace() {
  const { id } = useParams();
  const [traceState, setTraceState] = useState({
    trace: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    Promise.resolve()
      .then(() => {
        setTraceState(prev => ({ ...prev, loading: true, error: null }));
        return fetchTrace(id, { signal: controller.signal });
      })
      .then(data => {
        setTraceState({
          trace: Array.isArray(data) ? data[0] ?? null : data,
          loading: false,
          error: null,
        });
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        setTraceState({
          trace: null,
          loading: false,
          error: err.message,
        });
      });

    return () => controller.abort();
  }, [id]);

  if (traceState.loading) return <p className="status">Chargement...</p>;
  if (traceState.error) return <p className="status error">Erreur : {traceState.error}</p>;
  if (!traceState.trace) return <p className="status">Aucun projet trouvé.</p>;

  const trace = traceState.trace;
  const heroImages = getImages(trace.img_presentation);
  const presentationImages = heroImages.length > 0 ? heroImages : getImages(trace.img);
  const sections = getSections(trace);
  const tags = getTraceTags(trace);

  return (
    <section id="trace_page">
      {presentationImages.length > 0 && (
        <section id="hero_trace">
          <div id="img_presentation">
            <div className="defilement-img">
              {presentationImages.map((imgSrc, index) => (
                <img
                  key={`${imgSrc}-${index}`}
                  src={`/assets/trace/${id}/${imgSrc}`}
                  alt={`Illustration ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="presentation_trace">
        <h1>{trace.title}</h1>
        {trace.description && <p className="description_trace">{trace.description}</p>}
        {tags.length > 0 && (
          <div className="trace-tags">
            {tags.map((tag, index) => (
              <span key={`${tag}-${index}`} className="trace-tag">{tag}</span>
            ))}
          </div>
        )}

        {sections.length > 0 ? (
          sections.map((section, index) => (
            <ContentTrace
              key={index}
              section={section}
              id={id}
              isIntro={index === 0}
            />
          ))
        ) : (
          <p className="paragraphe">Aucun contenu détaillé disponible.</p>
        )}
      </section>
    </section>
  );
}

function ContentTrace({ section, id, isIntro }) {
  return (
    <div className={`content_info${isIntro ? " content_info_intro" : ""}`}>
      {section.title && <h2>{section.title}</h2>}
      {section.paragraphs.map((paragraph, idx) => (
        <TraceParagraph key={idx} paragraph={paragraph} id={id} />
      ))}
    </div>
  );
}

function TraceParagraph({ paragraph, id }) {
  const images = getImages(paragraph.images);

  return (
    <div className={`conteneur_paragraphe${images.length === 0 ? " sans-image" : ""}`}>
      <p className="paragraphe">{paragraph.text}</p>
      {images.length > 0 && (
        <div className="conteneur_img">
          {images.map((imgSrc, imgIdx) => (
            <img
              key={`${imgSrc}-${imgIdx}`}
              src={`/assets/trace/${id}/${imgSrc}`}
              alt="Illustration paragraphe"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getSections(trace) {
  if (Array.isArray(trace.sections) && trace.sections.length > 0) {
    return trace.sections.map(section => ({
      title: section.title ?? "",
      paragraphs: (section.paragraphs ?? []).map(paragraph => ({
        text: paragraph.content ?? "",
        images: getImages(paragraph.images),
      })),
    }));
  }

  if (Array.isArray(trace.content)) {
    return trace.content.map(section => ({
      title: section.title ?? "",
      paragraphs: (section.content_paragraphe ?? []).map(paragraph => ({
        text: paragraph.paragraphe ?? "",
        images: getImages(paragraph.images),
      })),
    }));
  }

  return [];
}

function getTraceTags(trace) {
  if (Array.isArray(trace.tags)) return trace.tags;

  return [
    ...(trace.languages ?? []).map(language => language.label),
    ...(trace.skills ?? []).map(skill => skill.label),
    ...(trace.project_types ?? []).map(type => type.label),
    trace.context_label,
  ].filter(Boolean);
}

function getImages(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}
