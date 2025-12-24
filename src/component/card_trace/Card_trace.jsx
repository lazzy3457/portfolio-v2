
import "./card_trace.css"

// import des elements de react
import { Link } from "react-router-dom"
console.log("Importing Card_trace component");

export default function Card_trace({img, title, description, tags, id}) {
  return (
    <article className="card_trace">
        <Link to={`/trace/${id}`}>
            {img ? (
                <img src={`/assets/trace/${id}/${img}`}  alt={title ?? "image illustration de la trace"} />
            ) : null}
            <div className="info">
                <Tags liste_tags={ tags } />
                <h3>{ title }</h3>
                <p>{ description }</p>
            </div>
        </Link>
    </article>
  )
}

function Tags({ liste_tags }) {
    
    // On suppose maintenant que liste_tags est déjà le tableau JS natif 
    // grâce à la correction de l'API PHP (ou MySQL).
    const tagArray = liste_tags; // ⬅️ On retire le JSON.parse() et le try/catch

    // Vérification pour s'assurer que c'est bien un tableau avant de mapper
    if (!Array.isArray(tagArray) || tagArray.length === 0) {
        return <p>Aucun tag disponible</p>; 
    }
 
    // Itération sur le tableau CORRECT (tagArray)
    return (
        <div className="tags">
            {tagArray.map((tagName, index) => (
                <Tag 
                    key={index}
                    name={tagName} 
                />  
            ))}  
        </div>
    )
}
// ... (le reste du code)

function Tag({ name }) { // Remarque: 'index' n'est pas utilisé ici, je l'ai retiré pour la propreté
    return (
        <span className="tag">{ name }</span>
    )
}