import "./card_trace.css"
import { Link } from "react-router-dom"

export default function CardTrace({ img, title, tags, id }) {
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
                    {Array.isArray(tags) && tags.length > 0 && (
                        <div className="tags">
                            {tags.map((tagName, index) => (
                                <span key={`${tagName}-${index}`} className="tag">{tagName}</span>
                            ))}
                        </div>
                    )}
                </div>
            </Link>
        </article>
    )
}
