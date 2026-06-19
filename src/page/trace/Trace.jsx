import './trace.css';
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
  const heroDisplayMode = trace.display_mode ?? 'conteneur';
  const heroCarouselInterval = trace.carousel_interval ?? 4000;

  return (
    <section id="trace_page">
      {presentationImages.length > 0 && (
        <HeroImageGallery
          images={presentationImages}
          id={id}
          displayMode={heroDisplayMode}
          carouselInterval={heroCarouselInterval}
        />
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

        <AcSection acs={trace.acs} />
      </section>
    </section>
  );
}

function HeroImageGallery({ images, id, displayMode, carouselInterval }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (displayMode !== 'carousel' || images.length <= 1) return;
    const t = setInterval(
      () => setCurrentIndex(prev => (prev + 1) % images.length),
      carouselInterval
    );
    return () => clearInterval(t);
  }, [displayMode, carouselInterval, images.length]);

  useEffect(() => {
    const target = scrollRef.current?.children[currentIndex];
    const container = scrollRef.current;
    if (target && container) {
      container.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handlePrev = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  const handleNext = () => setCurrentIndex(prev => (prev + 1) % images.length);

  return (
    <section id="hero_trace">
      <div id="img_presentation">
        <div className="img-carousel-wrap">
          {displayMode === 'carousel' && images.length > 1 && (
            <button className="img-arrow img-arrow--prev" onClick={handlePrev} aria-label="Image précédente">
              ‹
            </button>
          )}
          <div
            className={`defilement-img${displayMode !== 'carousel' ? ' defilement-img--grid' : ''}`}
            ref={scrollRef}
          >
            {images.map((imgSrc, index) => (
              <img
                key={`${imgSrc}-${index}`}
                src={`/assets/trace/${id}/${imgSrc}`}
                alt={`Illustration ${index + 1}`}
              />
            ))}
          </div>
          {displayMode === 'carousel' && images.length > 1 && (
            <button className="img-arrow img-arrow--next" onClick={handleNext} aria-label="Image suivante">
              ›
            </button>
          )}
        </div>
        {displayMode === 'carousel' && images.length > 1 && (
          <div className="img-carousel-indicator">
            {images.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot${i === currentIndex ? ' carousel-dot--active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Image ${i + 1}`}
              />
            ))}
            <span className="carousel-counter">{currentIndex + 1} / {images.length}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function ContentTrace({ section, id, isIntro }) {
  return (
    <div className={`content_info${isIntro ? " content_info_intro" : ""}`}>
      {section.title && <h2>{section.title}</h2>}
      {section.paragraphs.map((paragraph, idx) => (
        <TraceParagraph
          key={idx}
          paragraph={paragraph}
          id={id}
        />
      ))}
    </div>
  );
}

function TraceParagraph({ paragraph, id }) {
  const type = paragraph.type ?? 'paragraphe';
  if (type === 'video') return <VideoBlock paragraph={paragraph} />;
  if (type === 'lien') return <LinkBlock paragraph={paragraph} />;
  return <ParagraphBlock paragraph={paragraph} id={id} />;
}

function VideoBlock({ paragraph }) {
  const url = paragraph.video_url;
  if (!url) return null;

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]+)/);
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

  if (ytMatch || vimeoMatch) {
    const embedUrl = ytMatch
      ? `https://www.youtube.com/embed/${ytMatch[1]}`
      : `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return (
      <div className="trace-video-block">
        <div className="trace-video-wrap">
          <iframe
            src={embedUrl}
            title="Vidéo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="trace-video-block">
      <video controls src={url} className="trace-video-direct" />
    </div>
  );
}

function LinkBlock({ paragraph }) {
  const { link_url, link_label } = paragraph;
  if (!link_url) return null;

  return (
    <div className="trace-link-block">
      <a href={link_url} target="_blank" rel="noopener noreferrer" className="trace-link-btn">
        <span className="trace-link-label">{link_label || link_url}</span>
        <span className="trace-link-icon">→</span>
      </a>
    </div>
  );
}

function ParagraphBlock({ paragraph, id }) {
  const images = getImages(paragraph.images);
  const displayMode = paragraph.display_mode ?? 'conteneur';
  const carouselInterval = paragraph.carousel_interval ?? 4000;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (displayMode !== 'carousel' || images.length <= 1) return;
    const t = setInterval(
      () => setCurrentIndex(prev => (prev + 1) % images.length),
      carouselInterval
    );
    return () => clearInterval(t);
  }, [displayMode, carouselInterval, images.length]);

  useEffect(() => {
    const target = scrollRef.current?.children[currentIndex];
    const container = scrollRef.current;
    if (target && container) {
      container.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handlePrev = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  const handleNext = () => setCurrentIndex(prev => (prev + 1) % images.length);

  return (
    <div className={`conteneur_paragraphe${images.length === 0 ? " sans-image" : ""}`}>
      <p className="paragraphe">{paragraph.text}</p>
      {images.length > 0 && (
        <div className="conteneur_img_wrap">
          <div className="img-carousel-wrap">
            {displayMode === 'carousel' && images.length > 1 && (
              <button className="img-arrow img-arrow--prev" onClick={handlePrev} aria-label="Image précédente">
                ‹
              </button>
            )}
            <div
              className={`conteneur_img${displayMode === 'carousel' ? ' conteneur_img--carousel' : ''}`}
              ref={scrollRef}
            >
              {images.map((imgSrc, imgIdx) => (
                <img
                  key={`${imgSrc}-${imgIdx}`}
                  src={`/assets/trace/${id}/${imgSrc}`}
                  alt="Illustration paragraphe"
                />
              ))}
            </div>
            {displayMode === 'carousel' && images.length > 1 && (
              <button className="img-arrow img-arrow--next" onClick={handleNext} aria-label="Image suivante">
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AcSection({ acs }) {
  const [openIndex, setOpenIndex] = useState(null);
  if (!acs || acs.length === 0) return null;

  return (
    <section id="ac_trace">
      <h2>Apprentissages Critiques</h2>
      <div className="ac-accordion">
        {acs.map((ac, i) => (
          <div key={ac.id ?? i} className={`ac-item${openIndex === i ? " ac-item--open" : ""}`}>
            <button
              className="ac-trigger"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
            >
              <span>{ac.title}</span>
              <span className="ac-icon">{openIndex === i ? "−" : "+"}</span>
            </button>
            {openIndex === i && ac.description && (
              <div className="ac-content">
                <p>{ac.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function getSections(trace) {
  if (Array.isArray(trace.sections) && trace.sections.length > 0) {
    return trace.sections.map(section => ({
      title: section.title ?? "",
      paragraphs: (section.paragraphs ?? []).map(paragraph => ({
        type: paragraph.type ?? "paragraphe",
        text: paragraph.content ?? "",
        images: getImages(paragraph.images),
        display_mode: paragraph.display_mode ?? "conteneur",
        carousel_interval: paragraph.carousel_interval ?? 4000,
        video_url: paragraph.video_url ?? null,
        link_url: paragraph.link_url ?? null,
        link_label: paragraph.link_label ?? null,
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
