import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import IndustryInsights from './pages/IndustryInsights';
import YCExplorer from './pages/YCExplorer';
import TrendsDashboard from './pages/TrendsDashboard';
import ResearchPapers from './pages/ResearchPapers';
import IndustryTrends from './pages/IndustryTrends';
import MyTracker from './pages/MyTracker';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-200">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/industry-insights" element={<IndustryInsights />} />
          <Route path="/yc-explorer" element={<YCExplorer />} />
          <Route path="/trends" element={<TrendsDashboard />} />
          <Route path="/research" element={<ResearchPapers />} />
          <Route path="/industries/:industry?" element={<IndustryTrends />} />
          <Route path="/my-tracker" element={<MyTracker />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

