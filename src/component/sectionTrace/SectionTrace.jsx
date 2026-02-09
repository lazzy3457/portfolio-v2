import { useEffect, useState } from "react";
import Card_trace from "../card_trace/Card_trace";
import SearchBar from "../searchBar/SearchBar";

import "./SectionTrace.css";

export default function SectionTrace() {
    const [traces, setTraces] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // Si searchTerm est vide, l'URL sera "...search=", ce qui affiche tout via PHP
        fetch(`https://loic-merlhe.wstr.fr/api/getSQL.php?table=trace&search=${encodeURIComponent(searchTerm)}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTraces(data);
            })
            .catch(err => console.error("Erreur:", err));
    }, [searchTerm]);

    return (
        <section>
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
                    <p style={{ textAlign: 'center', width: '100%' }}>Aucun projet trouvé.</p>
                )}
            </div>
        </section>
    );
}