import "./navbar.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../../assets/logo.png';

export default function Navbar() {
    const [active, setActive] = useState(null); // "pro" | "univ" | null
    const navigate = useNavigate();

    const handleToggle = (type) => {
        const next = active === type ? null : type;
        setActive(next);
        navigate(next ? `/projet?type=${next}` : "/projet");
    };

    return (
        <header id="navbar">
            <nav>
                <div id="nav-left">
                    <Link to="/" id="nav-logo">
                        <img src={logo} alt="Logo LM" />
                    </Link>
                    <div id="nav-type-toggle">
                        <button
                            className={`nav-type-btn nav-type-pro ${active === "pro" ? "toggled" : ""}`}
                            onClick={() => handleToggle("pro")}
                        >
                            Pro
                        </button>
                        <button
                            className={`nav-type-btn nav-type-univ ${active === "univ" ? "toggled" : ""}`}
                            onClick={() => handleToggle("univ")}
                        >
                            Univ
                        </button>
                    </div>
                </div>

                <ul>
                    <li><Link to="/projet">Projets</Link></li>
                    <li><Link to="/contact" id="navbar-contact">Contact</Link></li>
                </ul>

                <div id="nav-spacer" />
            </nav>
        </header>
    );
}
