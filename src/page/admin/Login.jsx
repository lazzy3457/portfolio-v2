import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/admin.js";
import "./admin.css";

export default function Login() {
    const navigate = useNavigate();
    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [error,    setError]    = useState(null);
    const [loading,  setLoading]  = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate("/admin");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <form className="admin-login-form" onSubmit={handleSubmit}>
                <h1>Administration</h1>

                {error && <p className="admin-error">{error}</p>}

                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoFocus
                    />
                </label>

                <label>
                    Mot de passe
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? "Connexion…" : "Se connecter"}
                </button>
            </form>
        </div>
    );
}
