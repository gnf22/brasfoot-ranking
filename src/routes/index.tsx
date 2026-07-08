import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { Coaches } from '../pages/Coaches';
import { CoachDetails } from '../pages/CoachDetails';
import { Teams } from '../pages/Teams';
import { TeamDetails } from '../pages/TeamDetails';
import { Competitions } from '../pages/Competitions';
import { CompetitionDetails } from '../pages/CompetitionDetails';
import { Seasons } from '../pages/Seasons';
import { SeasonDetails } from '../pages/SeasonDetails';
import { Settings } from '../pages/Settings';
import { Ranking } from '../pages/Ranking';
import { NationalTeams } from '../pages/NationalTeams';
import { NationalTeamDetails } from '../pages/NationalTeamDetails';
import { Login } from '../pages/Login';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'coaches', element: <Coaches /> },
      { path: 'coaches/:id', element: <CoachDetails /> },
      { path: 'teams', element: <Teams /> },
      { path: 'teams/:id', element: <TeamDetails /> },
      { path: 'competitions', element: <Competitions /> },
      { path: 'competitions/:id', element: <CompetitionDetails /> },
      { path: 'seasons', element: <Seasons /> },
      { path: 'seasons/:id', element: <SeasonDetails /> },
      { path: 'national-teams', element: <NationalTeams /> },
      { path: 'national-teams/:id', element: <NationalTeamDetails /> },
      { path: 'settings', element: <AdminRoute><Settings /></AdminRoute> },
      { path: 'ranking', element: <Ranking /> },
    ],
  },
], {
  basename: import.meta.env.BASE_URL
});
