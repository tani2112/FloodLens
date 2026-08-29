import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import {
  DashboardPage,
  SimulationsPage,
  NewStudyAreaPage,
  NewScenarioPage,
  NewModelPage,
  SimulationProgressPage,
  MapPage,
  ResultsPage,
  ImpactPage,
  WarningsPage,
  ComparisonPickerPage,
  ComparisonPage,
  ValidationPage,
  StudyAreasPage,
  NepalCaseStudyPage,
  AboutPage
} from './pages';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="simulations" element={<SimulationsPage />} />
          <Route path="simulations/new/study-area" element={<NewStudyAreaPage />} />
          <Route path="simulations/new/scenario" element={<NewScenarioPage />} />
          <Route path="simulations/new/model" element={<NewModelPage />} />
          <Route path="simulations/:id" element={<SimulationProgressPage />} />
          <Route path="simulations/:id/map" element={<MapPage />} />
          <Route path="simulations/:id/results" element={<ResultsPage />} />
          <Route path="simulations/:id/impact" element={<ImpactPage />} />
          <Route path="simulations/:id/warnings" element={<WarningsPage />} />
          <Route path="comparison" element={<ComparisonPickerPage />} />
          <Route path="comparison/:idA/:idB" element={<ComparisonPage />} />
          <Route path="validation/:id" element={<ValidationPage />} />
          <Route path="study-areas" element={<StudyAreasPage />} />
          <Route path="case-studies/bhotekoshi-trishuli" element={<NepalCaseStudyPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
