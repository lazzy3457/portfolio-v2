import './trace.css';
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

export default function Trace() {
  const { id } = useParams();
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const Url_api_getSQL = "https://loic-merlhe.wstr.fr/api/getSQL.php";
  // Vérifiez bien que le paramètre dans getSQL.php est id_trace
  const requeteURL = `${Url_api_getSQL}?table=trace&id_trace=${id}`;

  useEffect(() => {
    setLoading(true);
    console.log("Tentative de récupération pour l'ID:", id);

    fetch(requeteURL)
      .then(response => {
        if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log("Données reçues de l'API:", data);

        // L'API peut renvoyer un tableau d'un objet ou l'objet directement
        if (Array.isArray(data) && data.length > 0) {
          setTrace(data[0]);
        } else if (data && !Array.isArray(data) && !data.error) {
          setTrace(data);
        } else {
          setError("Trace introuvable dans la base de données.");
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Erreur Fetch:", error);
        setError("Impossible de contacter l'API.");
        setLoading(false);
      });
  }, [id, requeteURL]);

  if (loading) return <div className="loading">Chargement de la trace...</div>;
  if (error) return <div className="error" style={{color: 'red', textAlign: 'center', marginTop: '50px'}}>{error}</div>;
  if (!trace) return null;

  return (
    <main className="page_trace">
      <header className="header_trace">
        <h1>{trace.title}</h1>
        <p className="description_header">{trace.description}</p>
        <div className="tags_container" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            {Array.isArray(trace.tags) && trace.tags.map((tag, index) => (
                <span key={index} className="tag_item" style={{background: '#eee', padding: '5px 10px', borderRadius: '15px'}}>
                    {tag}
                </span>
            ))}
        </div>
      </header>

      <section className="contenu_trace">
        {/* Vérification du champ 'content' qui contient vos sections */}
        {Array.isArray(trace.content) ? trace.content.map((section, index) => (
          <div key={index} className="section_block" style={{marginBottom: '40px'}}>
            <h2>{section.title}</h2>
            {section.content_paragraphe?.map((block, idx) => (
              <div key={idx} className="paragraphe_group">
                <p>{block.paragraphe}</p>
                <div className="images_grid" style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                  {block.images?.map((imgName, i) => (
                    <img 
                      key={i} 
                      src={`https://loic-merlhe.wstr.fr/assets/trace/${id}/${imgName}`} 
                      alt="Illustration"
                      style={{maxWidth: '100%', height: 'auto'}}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )) : <p>Aucun contenu détaillé disponible.</p>}
      </section>
    </main>
  );
}