import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RuleList } from './pages/RuleList';
import { RuleDetail } from './pages/RuleDetail';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RuleList />} />
        <Route path="/rule/:id" element={<RuleDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;