import '../../root.css'
import './Contact.css'
import cv_video_francais from "../../assets/cv_video/cv_video_francais.mp4"

export default function Contact() {
    return (
        <>
            <section id="cv_video">
                <h1>Contact</h1>
                <div id="conteneur-video">
                    <video controls>
                        <source src={cv_video_francais} type="video/mp4" />
                    </video>
                </div>
            </section>
            <SectionResaux />
        </>
    )
}

function SectionResaux() {
    const reseaux = [
        { name: "Linkedin", link: "" },
        { name: "Github", link: "" },
        { name: "Instagram", link: "" },
    ];

    return (
        <section id="section_reseaux_sociaux">
            {reseaux.map((reseau) => (
                <Reseau
                    key={reseau.name}
                    name={reseau.name}
                    link={reseau.link}
                />
            ))}
        </section>
    )
}

function Reseau({ name, link }) {
    return (
        <a href={link || "#"} className='lien' target="_blank" rel="noopener noreferrer">
            <img src={`/assets/reseau/${name}.png`} alt={name} />
        </a>
    )
}
