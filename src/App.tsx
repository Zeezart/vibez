
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './context/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';
import SupabaseInitCheck from './components/SupabaseInitCheck';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SpacesPage from './pages/SpacesPage';
import SpaceDetailPage from './pages/SpaceDetailPage';
import CreateSpacePage from './pages/CreateSpacePage';
import ProfilePage from './pages/ProfilePage';
import ScheduledPage from './pages/ScheduledPage';
import FavoritesPage from './pages/FavoritesPage';
import SettingsPage from './pages/SettingsPage';
import JoinPage from './pages/JoinPage';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <SupabaseInitCheck />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/spaces" element={<SpacesPage />} />
            <Route path="/space/:id" element={<SpaceDetailPage />} />
            <Route path="/create-space" element={<CreateSpacePage />} />
            <Route path="/scheduled" element={<ScheduledPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/join/:shareLink" element={<JoinPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  </QueryClientProvider>
);

export default App;
