import "./card_trace.css"
import { Link } from "react-router-dom"
import { useRef, useLayoutEffect, useState, useMemo } from "react"

function normalizeText(value) {
    return String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function CardTrace({ img, title, tags, id, activeFilters = [] }) {
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
                    {sortedTags.length > 0 && <TagList tags={sortedTags} />}
                </div>
            </Link>
        </article>
    );
}

function TagList({ tags }) {
    const measureRef = useRef(null);
    const [visibleCount, setVisibleCount] = useState(tags.length);

    useLayoutEffect(() => {
        const container = measureRef.current;
        if (!container) return;

        let frameId;
        const measure = () => {
            const children = Array.from(container.children);
            const rowTops = [];

            for (const child of children) {
                const top = child.offsetTop;
                if (!rowTops.includes(top)) rowTops.push(top);
                if (rowTops.length > 2) break;
            }

            const thirdRowTop = rowTops[2];
            const nextCount = thirdRowTop === undefined
                ? tags.length
                : children.findIndex(child => child.offsetTop >= thirdRowTop);

            setVisibleCount(current => current === nextCount ? current : nextCount);
        };
        const scheduleMeasure = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(measure);
        };

        scheduleMeasure();
        const observer = new ResizeObserver(scheduleMeasure);
        observer.observe(container);

        return () => {
            cancelAnimationFrame(frameId);
            observer.disconnect();
        };
    }, [tags]);

    const displayTags = tags.slice(0, visibleCount);
    const overflowCount = tags.length - visibleCount;

    return (
        <div className="tags-shell">
            <div className="tags tags--measure" ref={measureRef} aria-hidden="true">
                {tags.map((tagName, index) => (
                    <span key={`${tagName}-${index}`} className="tag">{tagName}</span>
                ))}
            </div>
            <div className="tags">
                {displayTags.map((tagName, index) => (
                    <span key={`${tagName}-${index}`} className="tag">{tagName}</span>
                ))}
                {overflowCount > 0 && (
                    <span className="tag tag-overflow">+{overflowCount}</span>
                )}
            </div>
        </div>
    );
}
