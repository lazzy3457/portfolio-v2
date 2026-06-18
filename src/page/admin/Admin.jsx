import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "../../api/admin.js";
import Login from "./Login.jsx";
import TraceList from "./TraceList.jsx";
import TraceForm from "./TraceForm.jsx";
import RefManager from "./RefManager.jsx";
import "./admin.css";

export default function Admin() {
    return (
        <Routes>
            <Route path="login" element={<Login />} />
            <Route path="*" element={
                <ProtectedLayout>
                    <Routes>
                        <Route index element={<TraceList />} />
                        <Route path="traces/new"  element={<TraceForm />} />
                        <Route path="traces/:id"  element={<TraceForm />} />
                        <Route path="references"  element={<RefManager />} />
                    </Routes>
                </ProtectedLayout>
            } />
        </Routes>
    );
}

function ProtectedLayout({ children }) {
    if (!isAuthenticated()) return <Navigate to="/admin/login" replace />;

    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="admin-content">{children}</main>
        </div>
    );
}

function Sidebar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    return (
        <nav className="admin-sidebar">
            <h2>Admin</h2>
            <Link to="/admin">Traces</Link>
            <Link to="/admin/references">Référentiels</Link>
            <Link to="/">Voir le site</Link>
            <button onClick={handleLogout}>Déconnexion</button>
        </nav>
    );
}
