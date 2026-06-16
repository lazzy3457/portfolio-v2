import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTraces } from "../../api/traces.js";
import { deleteTrace } from "../../api/admin.js";
import "./admin.css";

export default function TraceList() {
    const [traces,  setTraces]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        let ignore = false;

        fetchTraces()
            .then(data => {
                if (ignore) return;
                setTraces(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message);
                setLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, []);

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Supprimer « ${title} » ?`)) return;
        try {
            await deleteTrace(id);
            setTraces(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            alert(`Erreur : ${err.message}`);
        }
    };

    if (loading) return <p className="admin-status">Chargement…</p>;
    if (error)   return <p className="admin-status admin-error">{error}</p>;

    return (
        <div className="admin-section">
            <div className="admin-section-header">
                <h2>Traces ({traces.length})</h2>
                <Link to="/admin/traces/new" className="admin-btn admin-btn--primary">
                    + Nouvelle trace
                </Link>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Titre</th>
                        <th>Contexte</th>
                        <th>Langages</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {traces.map(trace => (
                        <tr key={trace.id}>
                            <td>{trace.id}</td>
                            <td>
                                <Link to={`/trace/${trace.id}`} target="_blank" className="admin-link">
                                    {trace.title}
                                </Link>
                            </td>
                            <td>
                                {trace.context_label
                                    ? <span className="admin-badge">{trace.context_label}</span>
                                    : <span className="admin-muted">—</span>
                                }
                            </td>
                            <td>
                                <div className="admin-tags">
                                    {(trace.languages ?? []).map(l => (
                                        <span key={l.id} className="admin-tag">{l.label}</span>
                                    ))}
                                </div>
                            </td>
                            <td className="admin-actions">
                                <Link
                                    to={`/admin/traces/${trace.id}`}
                                    className="admin-btn admin-btn--sm"
                                >
                                    Éditer
                                </Link>
                                <button
                                    className="admin-btn admin-btn--sm admin-btn--danger"
                                    onClick={() => handleDelete(trace.id, trace.title)}
                                >
                                    Supprimer
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
