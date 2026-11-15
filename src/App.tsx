import { Layout } from './components/Layout';
import { Admin } from './pages/Admin';
import { CertificatePage, CertificateVerify } from './pages/Certificate';
import { Challenges } from './pages/Challenges';
import { Cohort } from './pages/Cohort';
import { Notifications } from './pages/Notifications';
import { JoinOrg, OrgDashboard, OrgHome } from './pages/Org';
import { Safeguarding } from './pages/Safeguarding';
import { AppProvider } from './lib/app';
import { ROUTER_MODE } from './lib/config';
import { Router, Routes, type RouteDef } from './lib/router';
import { SignIn, SignUp, Welcome } from './pages/Auth';
import { BootcampDetail, Bootcamps } from './pages/Bootcamps';
import { Conferences } from './pages/Conferences';
import { Dashboard } from './pages/Dashboard';
import { Guide } from './pages/Guide';
import { Home } from './pages/Home';
import { Impact } from './pages/Impact';
import { Institutions } from './pages/Institutions';
import { Labs } from './pages/Labs';
import { Learn } from './pages/Learn';
import { TrackPage } from './pages/LearnTrack';
import { LessonPage } from './pages/LessonPage';
import { Privacy, Terms } from './pages/Legal';
import { NotFound } from './pages/NotFound';
import { Opportunities } from './pages/Opportunities';
import { People, Profile } from './pages/People';
import { Pricing } from './pages/Pricing';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProjectNew } from './pages/ProjectNew';
import { Projects } from './pages/Projects';
import { Search } from './pages/Search';
import { Citation } from './pages/tools/Citation';
import { ConsentForm } from './pages/tools/ConsentForm';
import { LegitCheck } from './pages/tools/LegitCheck';
import { Outreach } from './pages/tools/Outreach';
import { QuestionBuilder } from './pages/tools/QuestionBuilder';
import { SampleSize } from './pages/tools/SampleSize';
import { ToolsIndex } from './pages/tools/ToolsIndex';

const routes: RouteDef[] = [
  { path: '/', element: <Home /> },
  { path: '/search', element: <Search /> },
  { path: '/projects', element: <Projects /> },
  { path: '/projects/new', element: <ProjectNew /> },
  { path: '/projects/:id', element: <ProjectDetail /> },
  { path: '/opportunities', element: <Opportunities /> },
  { path: '/people', element: <People /> },
  { path: '/people/:handle', element: <Profile /> },
  { path: '/conferences', element: <Conferences /> },
  { path: '/labs', element: <Labs /> },
  { path: '/learn', element: <Learn /> },
  { path: '/learn/:track', element: <TrackPage /> },
  { path: '/learn/:track/:lesson', element: <LessonPage /> },
  { path: '/bootcamps', element: <Bootcamps /> },
  { path: '/bootcamps/:id', element: <BootcampDetail /> },
  { path: '/bootcamps/:id/cohort', element: <Cohort /> },
  { path: '/certificate/verify', element: <CertificateVerify /> },
  { path: '/certificate/:id', element: <CertificatePage /> },
  { path: '/challenges', element: <Challenges /> },
  { path: '/safeguarding', element: <Safeguarding /> },
  { path: '/notifications', element: <Notifications /> },
  { path: '/org', element: <OrgHome /> },
  { path: '/org/:id', element: <OrgDashboard /> },
  { path: '/join/:code', element: <JoinOrg /> },
  { path: '/admin', element: <Admin /> },
  { path: '/tools', element: <ToolsIndex /> },
  { path: '/tools/question-builder', element: <QuestionBuilder /> },
  { path: '/tools/legit-check', element: <LegitCheck /> },
  { path: '/tools/outreach', element: <Outreach /> },
  { path: '/tools/sample-size', element: <SampleSize /> },
  { path: '/tools/citation', element: <Citation /> },
  { path: '/tools/consent-form', element: <ConsentForm /> },
  { path: '/guide', element: <Guide /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/institutions', element: <Institutions /> },
  { path: '/impact', element: <Impact /> },
  { path: '/signin', element: <SignIn /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/welcome', element: <Welcome /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/privacy', element: <Privacy /> },
  { path: '/terms', element: <Terms /> },
];

export function App() {
  return (
    <Router mode={ROUTER_MODE}>
      <AppProvider>
        <Layout>
          <Routes routes={routes} fallback={<NotFound />} />
        </Layout>
      </AppProvider>
    </Router>
  );
}
