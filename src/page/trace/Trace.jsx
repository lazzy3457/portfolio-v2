import './trace.css';
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Url_api_getSQL from "../../conf.jsx";

export default function Trace() {
  const { id } = useParams();
  const [trace, setTrace] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${Url_api_getSQL}?table=trace&id_trace=${id}`)
      .then(response => {
        if (!response.ok) throw new Error("Erreur réseau");
        return response.json();
      })
      .then(data => {
        setTrace(Array.isArray(data) ? data : [data]);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        setError(err.message);
      });
  }, [id]);

  if (loading) return <p className="status">Chargement...</p>;
  if (error) return <p className="status error">Erreur : {error}</p>;
  if (trace.length === 0) return <p className="status">Aucun projet trouvé.</p>;

  return (
    <>
      {trace.map((item, mainIndex) => (
        <section key={mainIndex} id="trace_page">
          <section id="hero_trace">
            <div id="img_presentation">
              <div className="defilement-img">
                {Array.isArray(item.img_presentation) && item.img_presentation.map((imgSrc, index) => (
                  <img
                    key={index}
                    src={`/assets/trace/${id}/${imgSrc}`}
                    alt={`Illustration ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section id="presentation_trace">
            <h1>{item.title}</h1>
            {Array.isArray(item.content) && item.content.map((content_info, index) => (
              <ContentTrace
                key={index}
                index={index}
                content_info={content_info}
                id={id}
              />
            ))}
          </section>
        </section>
      ))}
    </>
  );
}

function ContentTrace({ index, content_info, id }) {
  if (index === 0) return <Amorse content_info={content_info} />;

  const hasImages = content_info.content_paragraphe?.[0]?.images?.length > 0;
  if (hasImages) return <ParagrapheImage content_info={content_info} id={id} />;
  return <Paragraphe content_info={content_info} />;
}

function Amorse({ content_info }) {
  const texte = content_info.content_paragraphe?.[0]?.paragraphe;
  return (
    <div className="conteneur_paragraphe">
      <p className="amorse">{texte}</p>
    </div>
  );
}

function ParagrapheImage({ content_info, id }) {
  return (
    <div className="content_info">
      <h2>{content_info.title}</h2>
      {content_info.content_paragraphe?.map((section, idx) => (
        <div key={idx} className="conteneur_paragraphe">
          <p className="paragraphe">{section.paragraphe}</p>
          <div className="conteneur_img">
            {section.images?.map((imgSrc, imgIdx) => (
              <img
                key={imgIdx}
                src={`/assets/trace/${id}/${imgSrc}`}
                alt="Illustration paragraphe"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Paragraphe({ content_info }) {
  return (
    <div className="content_info">
      <h2>{content_info.title}</h2>
      {content_info.content_paragraphe?.map((section, idx) => (
        <div key={idx} className="conteneur_paragraphe">
          <p className="paragraphe">{section.paragraphe}</p>
        </div>
      ))}
    </div>
  );
}
