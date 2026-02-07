import { useEffect, useState } from "react";
import Card_trace from "../card_trace/Card_trace";
import SearchBar from "../searchBar/SearchBar";
import "./SectionTrace.css";

export default function SectionTrace() {
    const [traces, setTraces] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // On encode le terme pour gérer les espaces et caractères spéciaux
        const query = encodeURIComponent(searchTerm);
        // On appelle l'API avec le paramètre 'search'
        const url = `http://localhost/ton_projet/getSQL.php?table=trace&search=${query}`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTraces(data);
                }
            })
            .catch(err => console.error("Erreur lors de la récupération :", err));
    }, [searchTerm]); // Re-filtre dès que l'utilisateur tape une lettre

    return (
        <section id="section_traces">
            <SearchBar onSearch={setSearchTerm} />
            
            <div id="conteneur_trace">
                {traces.length > 0 ? (
                    traces.map(trace => (
                        <Card_trace 
                            key={trace.id}
                            id={trace.id}
                            title={trace.title}
                            description={trace.description}
                            img={trace.img}
                            tags={trace.tags}
                        />
                    ))
                ) : (
                    <p>Aucun résultat trouvé pour "{searchTerm}"</p>
                )}
            </div>
        </section>
    );
}