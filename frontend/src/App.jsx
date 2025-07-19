import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoleSelector from './components/RoleSelector';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import CreateCampaign from './pages/CreateCampaign';
import CampaignList from './pages/CampaignList';
import CampaignDetails from './pages/CampaignDetails';
import EditCampaign from './pages/ManageCampaign'; 
import Donation from './pages/Donation';
import AdminCampaignDetails from './pages/AdminCampaignDetails';
import AboutPage from './pages/AboutPage';   
import News from './pages/NewsList';
import NewsDetail from './pages/NewsDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/role" element={<RoleSelector />} />
        <Route path="/my-account" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/create-campaign" element={<CreateCampaign />} />
        <Route path="/campaigns" element={<CampaignList />} />
        <Route path="/campaigns/:address" element={<CampaignDetails />} />
        <Route path="/edit/:address" element={<EditCampaign />} />
        <Route path="/donate/:address" element={<Donation />} />
        <Route path="/admin/campaigns/:address" element={<AdminCampaignDetails />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
