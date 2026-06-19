import "./footer.css";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function Footer() {
    const reseaux = [
        { name: "Linkedin", link: "" },
        { name: "Github", link: "" },
        { name: "Instagram", link: "" },
    ];

    return (
        <footer id="footer">
            <div id="footer-content">
                <div className="footer-col" id="footer-brand">
                    <Link to="/" id="footer-logo">
                        <img src={logo} alt="Logo LM" />
                    </Link>
                    <p id="footer-name">Loïc Merlhe</p>
                    <p id="footer-tagline">Développeur Web & Multimédia</p>
                </div>

                <div className="footer-col" id="footer-nav">
                    <p className="footer-col-title">Navigation</p>
                    <ul>
                        <li><Link to="/projet">Projets</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </div>

                <div className="footer-col" id="footer-socials">
                    <p className="footer-col-title">Me retrouver</p>
                    <div id="footer-reseaux">
                        {reseaux.map((r) => (
                            <a
                                key={r.name}
                                href={r.link || "#"}
                                className="footer-reseau-link"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={r.name}
                            >
                                <img src={`/assets/reseau/${r.name}.png`} alt={r.name} />
                            </a>
                        ))}
                    </div>
                    <a href="mailto:loicmerte@gmail.com" id="footer-email">
                        loicmerte@gmail.com
                    </a>
                </div>
            </div>

            <div id="footer-bottom">
                <p>© 2025 Loïc Merlhe · Tous droits réservés</p>
            </div>
        </footer>
    );
}
