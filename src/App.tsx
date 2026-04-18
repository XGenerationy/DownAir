import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from '@/components/Layout';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import Home from '@/pages/Home';
import DownloadPage from '@/pages/Download';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import DMCA from '@/pages/DMCA';
import Guides from '@/pages/Guides';
import GuidePage from '@/pages/GuidePage';
import AdminLogin from '@/pages/admin/Login';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminContent from '@/pages/admin/ContentPages';
import ContentEditor from '@/pages/admin/ContentEditor';
import AdminContacts from '@/pages/admin/Contacts';
import AdminDmca from '@/pages/admin/DmcaRequests';
import AdminSettings from '@/pages/admin/Settings';
import SetupWizard from '@/pages/SetupWizard';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<SetupWizard />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dmca" element={<DMCA />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:slug" element={<GuidePage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="content/new" element={<ContentEditor />} />
            <Route path="content/:id/edit" element={<ContentEditor />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="dmca-requests" element={<AdminDmca />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
