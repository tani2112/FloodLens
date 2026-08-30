import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LoadingState } from './components/common/StateComponents';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SimulationsPage = lazy(() => import('./pages/SimulationsPage').then(m => ({ default: m.SimulationsPage })));
const NewStudyAreaPage = lazy(() => import('./pages/NewStudyAreaPage').then(m => ({ default: m.NewStudyAreaPage })));
const NewScenarioPage = lazy(() => import('./pages/NewScenarioPage').then(m => ({ default: m.NewScenarioPage })));
const NewModelPage = lazy(() => import('./pages/NewModelPage').then(m => ({ default: m.NewModelPage })));
const NewReviewPage = lazy(() => import('./pages/NewReviewPage').then(m => ({ default: m.NewReviewPage })));
const SimulationProgressPage = lazy(() => import('./pages/SimulationProgressPage').then(m => ({ default: m.SimulationProgressPage })));
const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const MapPage = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })));
const ResultsPage = lazy(() => import('./pages/ResultsPage').then(m => ({ default: m.ResultsPage })));
const ImpactPage = lazy(() => import('./pages/ImpactPage').then(m => ({ default: m.ImpactPage })));
const WarningsPage = lazy(() => import('./pages/WarningsPage').then(m => ({ default: m.WarningsPage })));
const ComparisonPickerPage = lazy(() => import('./pages/ComparisonPage').then(m => ({ default: m.ComparisonPickerPage })));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage').then(m => ({ default: m.ComparisonPage })));
const ValidationPage = lazy(() => import('./pages/ValidationPage').then(m => ({ default: m.ValidationPage })));
const StudyAreasPage = lazy(() => import('./pages/StudyAreasPage').then(m => ({ default: m.StudyAreasPage })));
const NepalCaseStudyPage = lazy(() => import('./pages/NepalCaseStudyPage').then(m => ({ default: m.NepalCaseStudyPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState message="Loading FloodLens workspace..." />}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="simulations" element={<SimulationsPage />} />
            <Route path="simulations/new/study-area" element={<NewStudyAreaPage />} />
            <Route path="simulations/new/scenario" element={<NewScenarioPage />} />
            <Route path="simulations/new/model" element={<NewModelPage />} />
            <Route path="simulations/new/review" element={<NewReviewPage />} />
            <Route path="simulations/:id" element={<OverviewPage />} />
            <Route path="simulations/:id/overview" element={<OverviewPage />} />
            <Route path="simulations/:id/progress" element={<SimulationProgressPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
