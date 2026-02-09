import { useState } from 'react';

export default function SearchBar({ onSearch }) {
    const [query, setQuery] = useState("");

    const updateSearch = (value) => {
        setQuery(value);
        onSearch(value); // Déclenche le fetch dans le parent
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                <input 
                    type="text" 
                    placeholder="Rechercher (ex: fraise, design...)" 
                    value={query}
                    onChange={(e) => updateSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 45px 12px 15px',
                        borderRadius: '25px',
                        border: '1px solid #ddd'
                    }}
                />
                {query && (
                    <button 
                        onClick={() => updateSearch("")}
                        style={{
                            position: 'absolute',
                            right: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#999'
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}   