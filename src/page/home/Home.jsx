
// import du css
import './home.css' 
import '../../root.css'

// import des elements de react
import React, { useState, useEffect } from 'react';

// import des images
import photo_moi from '../../assets/loic_photo.png'

// import des composants
import SectionTrace from '../../component/sectionTrace/SectionTrace.jsx'

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
            <SectionConnaissances />
            <Softskills />
            <SectionTrace nombre_trace={3} />
        </>
    )
}   

function SectionConnaissances() {
    const connaissances =["HTML", "CSS", "JavaScript", "PHP", "React"];
    const logiciel =["PremierePro", "Illustrator", "Figma", "Blender", "VisualStudioCode"];
    return (
        <section id="connaissances">
            {/* language */}
            <div id="conteneur_langage">
                <h2>Langage</h2>
                <div id="conteneur_langage_img">
                    {connaissances.map((langage) => (
                        <img 
                            key={langage}
                            src={`./src/assets/langage/${langage}.svg`} 
                            alt={langage}
                        />
                    ))}
                </div>
            </div>
            {/* logiciel */}
            <div id="conteneur_logiciel">
                <h2>Logiciel</h2>
                <div id="conteneur_logiciel_img">
                    {logiciel.map((logiciel) => (
                        <img 
                            key={logiciel}
                            src={`./src/assets/logiciel/${logiciel}.svg`} 
                            alt={logiciel} 
                        />
                    ))}
                </div>
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
