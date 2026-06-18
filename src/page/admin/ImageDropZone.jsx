import { useRef, useState } from "react";

export default function ImageDropZone({ label, multiple = false, images = [], onFiles, onRemove }) {
    const inputRef = useRef(null);
    const [active, setActive] = useState(false);

    const handleFiles = (fileList) => {
        const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) onFiles(files);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setActive(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div className="admin-dropzone-wrapper">
            {label && <span className="admin-dropzone-label">{label}</span>}

            <div
                className={`admin-dropzone${active ? " admin-dropzone--active" : ""}`}
                onDragOver={e => { e.preventDefault(); setActive(true); }}
                onDragLeave={() => setActive(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
            >
                <p>Glissez-déposez {multiple ? "des images" : "une image"} ici, ou cliquez pour parcourir</p>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    hidden
                    onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
                />
            </div>

            {images.length > 0 && (
                <div className="admin-dropzone-grid">
                    {images.map(img => (
                        <div key={img.key} className="admin-dropzone-thumb">
                            <img src={img.url} alt="" />
                            <button
                                type="button"
                                className="admin-dropzone-remove"
                                onClick={() => onRemove(img.key)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
