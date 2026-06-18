import "./card_trace.css"
import { Link } from "react-router-dom"
import { useRef, useLayoutEffect, useState, useMemo } from "react"

function normalizeText(value) {
    return String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function CardTrace({ img, title, tags, id, activeFilters = [] }) {
    const tagsRef = useRef(null);

    const sortedTags = useMemo(() => {
        if (!Array.isArray(tags) || !tags.length) return [];
        if (!activeFilters.length) return tags;
        const normalizedFilters = activeFilters.map(normalizeText);
        return [...tags].sort((a, b) => {
            const aMatch = normalizedFilters.some(f => normalizeText(a).includes(f));
            const bMatch = normalizedFilters.some(f => normalizeText(b).includes(f));
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });
    }, [tags, activeFilters]);

    const [visibleCount, setVisibleCount] = useState(null);

    useLayoutEffect(() => {
        setVisibleCount(null);
    }, [sortedTags]);

    useLayoutEffect(() => {
        if (visibleCount !== null) return;
        if (!tagsRef.current || !sortedTags.length) {
            setVisibleCount(sortedTags.length);
            return;
        }

        const children = Array.from(tagsRef.current.children);
        if (!children.length) { setVisibleCount(0); return; }

        const rowTops = [];
        for (const child of children) {
            const top = child.offsetTop;
            if (!rowTops.includes(top)) rowTops.push(top);
            if (rowTops.length > 2) break;
        }

        if (rowTops.length <= 2) {
            setVisibleCount(sortedTags.length);
            return;
        }

        const thirdRowTop = rowTops[2];
        const overflowStart = children.findIndex(c => c.offsetTop >= thirdRowTop);
        setVisibleCount(overflowStart > 0 ? overflowStart : sortedTags.length);
    }, [sortedTags, visibleCount]);

    const displayTags = visibleCount === null ? sortedTags : sortedTags.slice(0, visibleCount);
    const overflowCount = visibleCount !== null && visibleCount < sortedTags.length
        ? sortedTags.length - visibleCount
        : 0;

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
                    {sortedTags.length > 0 && (
                        <div className="tags" ref={tagsRef}>
                            {displayTags.map((tagName, index) => (
                                <span key={`${tagName}-${index}`} className="tag">{tagName}</span>
                            ))}
                            {overflowCount > 0 && (
                                <span className="tag tag-overflow">+{overflowCount}</span>
                            )}
                        </div>
                    )}
                </div>
            </Link>
        </article>
    );
}
