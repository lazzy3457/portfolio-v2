
// import du css
import './home.css'
import '../../root.css'

// import des elements de react
import React, { useState, useEffect } from 'react';

// import des images
import photo_moi from '../../assets/loic_photo.png'

// import des composants
import Card_trace from '../../component/card_trace/card_trace.jsx'

export default function Home() {
    return (
        <>
            <section id="hero">
                <div id="presentation">
                    <h1>Bonjour, moi c’est Loïc Merlhe</h1>
                    <p>Je suis un jeune développeur passionné par le web et la programmation de jeux vidéo. Curieux et créatif, j’aime imaginer des solutions, concevoir des expériences et transformer des idées en projets concrets. Actuellement en BUT MMI, je maîtrise le Python, PHP, HTML, CSS, SQL et JavaScript, et j’explore aussi le Java ainsi que la création 3D. Mon objectif : évoluer dans le monde du jeu vidéo et contribuer à créer des univers immersifs — peut-être même le mien.</p>
                </div>
                <div id="photo_moi"> 
                    <img src={photo_moi} alt="Photo de Loïc Merlhe" title='ouioui'/>
                </div>
            </section>
            <Softskills />
            <SectionTrace />
        </>
    )
}   

function SectionConnaissances() {
    const connaissances =["HTML", "CSS", "JavaScript", "PHP", "React"];
    const logiciel =["Photoshop", "Illustrator", "Figma", "Blender", "VisualStudioCode"];
    return (
        <section id="connaissances">
            {/* language */}
            <div id="conteneur_language">
                <h2>Language</h2>
                <div id="conteneur_language_img">
                    {connaissances.map((langage) => (
                        <span className="language">
                            { langage }
                        </span>
                    ))}
                </div>
            </div>
            {/* logiciel */}
            <div id="conteneur_language">
                <h2>Logiciel</h2>
                <div id="conteneur_language_img">
                    {logiciel.map((logiciel) => (
                        <span className="language">
                            { logiciel }
                        </span>
                    ))}
                </div>
            </div>

        </section>
    )
}   

function SectionTrace() {

    // 1. Initialiser l'état pour stocker les traces. Un tableau vide par défaut.
    const [traces, setTraces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. Utiliser useEffect pour effectuer le fetch une seule fois au montage
    useEffect(() => {
        fetch('http://localhost/portfolio_v/v2/public/api/getSQL.php?table=trace')
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
                setError(err.message);
                setLoading(false);
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
                        key={index}
                        img={trace.img}
                        title={trace.title}
                        description={trace.description}
                        tags={trace.tags}
                    />
                ))}
            </div>
        </section>
    )
}

function Softskills() {
    const soft_skills =["Créatif", "Travail en équipe", "Soif de savoir", "Passionné", "Curieux", "Ponctuel", "Polyvalent"];

    return (
        <section id="soft_skills">
            <h2>Soft Skills</h2>    
            <div id="conteneur_soft_skills">
                {/* Contenu des soft skills ici */}
                {soft_skills.map((skill) => (
                    <SpanSoftSkill 
                        name={skill}
                    />
                ))}
            </div>
        </section>
    )   
}

function SpanSoftSkill({ name }) {
    return (
        <span className="soft_skill">
            { name }
        </span>
    )
}
