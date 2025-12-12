
import "./navbar.css";

// import les elements de react
import { Link } from "react-router-dom";

// import img
import logo from '../../assets/logo.png';

export default function Navbar() {
  return (
    <header id="navbar">
        <nav>
            {/* return a ala page d'accueil*/}
            <Link to="/">
                <img src={logo} alt="Logo" />
            </Link> 
            <ul>
                <li>
                    <Link to="/projet">Projets</Link>
                </li>
                <li>
                    <Link to="/contact" id="navbar-contact">Contact</Link>
                </li>
            </ul>
        </nav>
    </header>
  )
}