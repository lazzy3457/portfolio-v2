
// importation des fichiers CSS
import './sectionTrace.css';

// import des elements de react
import React, { useState, useEffect } from 'react';

// import des composants
import Card_trace from '../card_trace/card_trace.jsx'

export default function SectionTrace({nombre_trace}) {

    if (nombre_trace === undefined) {
        nombre_trace = 3; // Valeur par défaut si aucune valeur n'est fournie
    }

    // 1. Initialiser l'état pour stocker les traces. Un tableau vide par défaut.
    const [traces, setTraces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const requeteURL = 'http://localhost/portfolio_v/v3/public/api/getSQL.php?table=trace&limit=' + nombre_trace;

    

    // 2. Utiliser useEffect pour effectuer le fetch une seule fois au montage
    useEffect(() => {
        fetch(requeteURL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.json();
            })
            // 3. Stocker les données dans l'état
            .then(data => {
                // Assurez-vous que data est un tableau si vous voulez l'utiliser directement avec map
                setTraces(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Erreur de chargement des traces:', err);
                setLoading(false);
                setError(err.message);
            });
    }, []); // Le tableau vide [] assure que l'effet ne s'exécute qu'une fois au montage.

    // 4. Afficher les états de chargement/erreur
    if (loading) {
        return <p>Chargement des traces...</p>;
    }
    if (error) {
        return <p>Erreur lors du chargement : {error}</p>;
    }
    return (
        <section id="projet">
            <h2>Mes Projets</h2>
            <div id="conteneur_trace">
                {traces.map((trace, index) => (
                    <Card_trace 
                        key={trace.id}
                        img={trace.img}
                        title={trace.title}
                        description={trace.description}
                        tags={trace.tags}
                        id={trace.id}
                    />
                ))}
            </div>
        </section>
    )
}