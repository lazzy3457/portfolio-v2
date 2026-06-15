import "./card_trace.css"
import { Link } from "react-router-dom"

export default function Card_trace({ img, title, description, tags, id }) {
    return (
        <article className="card_trace">
            <Link to={`/trace/${id}`}>
                <div className="card-img">
                    {img && (
                        <img
                            src={`/assets/trace/${id}/${img}`}
                            alt={title ?? "Illustration du projet"}
                        />
                    )}
                </div>
                <div className="card-info">
                    <h3>{title}</h3>
                    <Tags liste_tags={tags} />
                </div>
            </Link>
        </article>
    )
}

function Tags({ liste_tags }) {
    if (!Array.isArray(liste_tags) || liste_tags.length === 0) return null;

    return (
        <div className="tags">
            {liste_tags.map((tagName, index) => (
                <span key={index} className="tag">{tagName}</span>
            ))}
        </div>
    )
}
