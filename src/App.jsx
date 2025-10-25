import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import About from './pages/About'
import Karaoke from './pages/Karaoke'
import Friends from './pages/Friends'
import Generation from './pages/Generation'
//import Navbar from './components/Navbar' // ✅ make sure this path is correct

function App() {
    return (
        <Router>
            {/* ✅ Navbar stays visible on all pages */}
            <Navbar />

            {/* ✅ Route system for each page */}
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<About />} />
                <Route path="/karaoke" element={<Karaoke />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/generation" element={<Generation />} />
            </Routes>
        </Router>
    )
}

export default App
