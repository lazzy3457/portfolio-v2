// import les éléments de react
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'

// import les pages
import Home from './page/home/Home.jsx'
import Contact from './page/contact/Contact.jsx'
import Projet from './page/projet/Projet.jsx'
import Trace from './page/trace/Trace.jsx'

// import les composants
import Navbar from './component/navbar/Navbar.jsx'
import Footer from './component/footer/Footer.jsx'

// import les styles
import './App.css'
import './root.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/projet" element={<Projet />} />
          <Route path="/trace/:id" element={<Trace />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
