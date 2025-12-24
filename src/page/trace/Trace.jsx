import './trace.css';
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

export default function Trace() {
  const { id } = useParams(); // Plus simple que params.id
  const [trace, setTrace] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Correction de l'URL (vérifie bien si c'est /api/ ou /api/api/ sur ton serveur)
  const Url_api_getSQL = "https://loic-merlhe.wstr.fr/api/getSQL.php";
  const requeteURL = `${Url_api_getSQL}?table=trace&id_trace=${id}`;

  useEffect(() => {
    setLoading(true); // Relance le chargement si l'ID change
    
    fetch(requeteURL)
      .then(response => {
        if (!response.ok) throw new Error("Erreur réseau");
        return response.json();
      })
      .then(data => {
        // Le décodage JSON est maintenant géré par ton API PHP
        // On vérifie juste que data est bien un tableau
        setTrace(Array.isArray(data) ? data : [data]);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        setError(error.message);
        console.error("Error fetching trace data:", error);
      });
  }, [id]); // ✅ Ajout du tableau de dépendances pour éviter la boucle infinie

  if (loading) return <p className="status">Chargement des traces...</p>;
  if (error) return <p className="status error">Erreur : {error}</p>;
  if (trace.length === 0) return <p className="status">Aucun projet trouvé.</p>;

  return (
    <>
      {trace.map((item, mainIndex) => (
        <React.Fragment key={mainIndex}>
          <section id="hero_trace">
            <div id="img_presentation">
              <div className="defilement-img">
                {/* Vérifie que img_presentation est bien un tableau */}
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
        </React.Fragment>
      ))}
    </>
  );
}

// --- SOUS-COMPOSANTS ---

function ContentTrace({ index, content_info, id }) {
  // L'amorce est le premier élément du tableau content
  if (index === 0) {
    return <Amorse content_info={content_info} />;
  }

  // Accès sécurisé au premier élément du tableau de paragraphes
  const hasImages = content_info.content_paragraphe?.[0]?.images?.length > 0;

  if (hasImages) {
    return <ParagrapheImage content_info={content_info} id={id} />;
  }
  
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