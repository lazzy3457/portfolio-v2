import { useState } from 'react';

export default function SearchBar({ onSearch }) {
    const [query, setQuery] = useState("");

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value); // Notifie le parent du changement
    };

    return (
        <div className="search_bar_container" style={{ margin: '20px auto', maxWidth: '500px' }}>
            <input 
                type="text" 
                placeholder="Rechercher par titre ou tag (ex: fraise)..." 
                value={query}
                onChange={handleChange}
                style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '25px',
                    border: '2px solid #ddd',
                    fontSize: '16px'
                }}
            />
        </div>
    );
}