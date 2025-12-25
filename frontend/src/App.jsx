import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ContactPage from './pages/ContactPage.jsx'

function App() {
const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      <ThemeProvider>
        <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
        {renderPage()}
      </ThemeProvider>
    </>
  )
}

export default App
