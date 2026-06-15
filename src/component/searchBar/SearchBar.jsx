import { useState } from 'react';
import './SearchBar.css';

export default function SearchBar({ onSearch }) {
    const [query, setQuery] = useState("");

    const updateSearch = (value) => {
        setQuery(value);
        onSearch(value);
    };

    return (
        <div className="searchbar-wrapper">
            <div className="searchbar-inner">
                <input
                    type="text"
                    placeholder="Rechercher (ex: fraise, design...)"
                    value={query}
                    onChange={(e) => updateSearch(e.target.value)}
                />
                {query && (
                    <button className="searchbar-clear" onClick={() => updateSearch("")}>
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
