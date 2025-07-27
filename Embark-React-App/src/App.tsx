// App.tsx
import './index.css'; // Assuming Tailwind CSS base styles are imported here or in main.tsx
import LandingPage from './landing-page/LandingPage';
import Footer from './shared/Footer';
import Navbar from './shared/Navbar';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PageNotFound from './shared/PageNotFound';
import Workflow from './workflow/Workflow';
import CustomWorkflow from './custom-workflow/CustomWorkflow';

function App() {
  return (
    <div className="App">
      <Navbar/>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/custom-workflow" element={<CustomWorkflow />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
      <Footer/>
    </div>
  )
}

export default App;