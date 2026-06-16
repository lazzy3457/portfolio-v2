import { Routes, Route, useLocation } from 'react-router-dom'

import Home from './page/home/Home.jsx'
import Contact from './page/contact/Contact.jsx'
import Projet from './page/projet/Projet.jsx'
import Trace from './page/trace/Trace.jsx'
import Admin from './page/admin/Admin.jsx'
import Navbar from './component/navbar/Navbar.jsx'
import Footer from './component/footer/Footer.jsx'

import './App.css'
import './root.css'

function App() {
  const location = useLocation();
  const isAdmin  = location.pathname.startsWith('/admin');
  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/projet" element={<Projet />} />
      <Route path="/trace/:id" element={<Trace />} />
      <Route path="/admin/*" element={<Admin />} />
    </Routes>
  );

  return (
    <>
      {!isAdmin && <Navbar />}
      {isAdmin ? routes : <main>{routes}</main>}
      {!isAdmin && <Footer />}
    </>
  )
}

export default App
