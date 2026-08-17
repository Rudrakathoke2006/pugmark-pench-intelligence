import React, { useState, useEffect } from 'react';
import GbifNavbar from './components/GbifNavbar';
import Navigation from './components/Navigation';
import Overview from './pages/Overview';
import Ingestion from './pages/Ingestion';
import Tigers from './pages/Tigers';
import TigerDetail from './pages/TigerDetail';
import MapPage from './pages/MapPage';
import ReviewQueue from './pages/ReviewQueue';
import Alerts from './pages/Alerts';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

import AiDetectionsView from './pages/AiDetectionsView';
import VerifiedOutputsView from './pages/VerifiedOutputsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTigerId, setSelectedTigerId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [overview, setOverview] = useState(null);
  const [tigers, setTigers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);

  const fetchData = () => {
    fetch('/api/overview')
      .then((res) => res.json())
      .then((data) => setOverview(data))
      .catch((err) => console.error(err));

    fetch('/api/tigers')
      .then((res) => res.json())
      .then((data) => setTigers(data))
      .catch((err) => console.error(err));

    fetch('/api/alerts')
      .then((res) => res.json())
      .then((data) => setAlerts(data))
      .catch((err) => console.error(err));

    fetch('/api/review/queue')
      .then((res) => res.json())
      .then((data) => setReviewQueue(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectTiger = (id) => {
    setSelectedTigerId(id);
    setActiveTab('tiger_detail');
  };

  const handleNavigateMapWithTiger = (id) => {
    setSelectedTigerId(id);
    setActiveTab('map');
  };

  const handleAcknowledgeAlert = (alertId) => {
    fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' })
      .then((res) => res.json())
      .then(() => fetchData())
      .catch((err) => console.error(err));
  };

  return (
    <div className="flex flex-col h-screen bg-[#f4f6f0] text-slate-800 font-sans overflow-hidden">
      {/* Top GBIF Header Navigation */}
      <GbifNavbar 
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'tiger_detail') setSelectedTigerId(null);
          setActiveTab(tab);
        }}
        pendingCount={reviewQueue?.length || 0}
        alertCount={alerts?.filter((a) => !a.is_acknowledged)?.length || 0}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Toggleable Left Sidebar */}
        {isSidebarOpen && (
          <Navigation 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              if (tab !== 'tiger_detail') setSelectedTigerId(null);
              setActiveTab(tab);
            }}
            pendingCount={reviewQueue?.length || 0}
            alertCount={alerts?.filter((a) => !a.is_acknowledged)?.length || 0}
          />
        )}

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto bg-[#f4f6f0]">
          {activeTab === 'overview' && (
            <Overview 
              overview={overview} 
              alerts={alerts}
              onNavigate={setActiveTab}
              onSelectTiger={handleSelectTiger}
            />
          )}

          {activeTab === 'ingestion' && (
            <Ingestion 
              onComplete={() => fetchData()}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'ai_detections' && (
            <AiDetectionsView 
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'review' && (
            <ReviewQueue 
              queue={reviewQueue}
              onRefresh={() => fetchData()}
            />
          )}

          {activeTab === 'verified_outputs' && (
            <VerifiedOutputsView 
              onNavigateMap={handleNavigateMapWithTiger}
            />
          )}

          {activeTab === 'tigers' && (
            <Tigers 
              tigers={tigers}
              onSelectTiger={handleSelectTiger}
              onDeleteTiger={() => fetchData()}
            />
          )}

          {activeTab === 'tiger_detail' && selectedTigerId && (
            <TigerDetail 
              tigerId={selectedTigerId}
              onBack={() => setActiveTab('tigers')}
              onNavigateMap={handleNavigateMapWithTiger}
            />
          )}

          {activeTab === 'map' && (
            <MapPage selectedTigerId={selectedTigerId} />
          )}

          {activeTab === 'alerts' && (
            <Alerts 
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onNavigateMap={handleNavigateMapWithTiger}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogs />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </main>
      </div>
    </div>
  );
}
