
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { theme } from "./theme";

import { AuthProvider } from "./context/AuthContext";

import Index from "./pages/Index";
import SpacesPage from "./pages/SpacesPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import SpaceDetailPage from "./pages/SpaceDetailPage";
import CreateSpacePage from "./pages/CreateSpacePage";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import FavoritesPage from "./pages/FavoritesPage";
import ScheduledPage from "./pages/ScheduledPage";
import SettingsPage from "./pages/SettingsPage";
import JoinPage from "./pages/JoinPage";

import SupabaseInitCheck from "./components/SupabaseInitCheck";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Router>
          <AuthProvider>
            <SupabaseInitCheck>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/spaces" element={<SpacesPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/scheduled" element={<ScheduledPage />} />
                <Route path="/space/:id" element={<SpaceDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:id" element={<UserProfilePage />} />
                <Route path="/create" element={<CreateSpacePage />} />
                <Route path="/join/:shareCode" element={<JoinPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SupabaseInitCheck>
          </AuthProvider>
        </Router>
        <Toaster />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;
