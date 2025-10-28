import "./App.css";
import { LeadershipDashboard } from "./components/dashboard/LeadershipDashboard";
import LeadStar from "./pages/LeadStar";
import { YouView } from "./components/you-view/YouView";
import { CoachView } from "./components/coach-view/CoachView";
import LearnStar from "./pages/LearnStar";
import { KPIPage } from "./pages/KPIPage";
import { TeamPage } from "./pages/TeamPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SwipeableViews } from "./components/SwipeableViews";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { LayoutDashboard, User, LogOut, Loader2, Sparkles, GraduationCap, Home, BarChart3, Users } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { AIAgentGlobal } from "./components/ai-agent/AIAgentGlobal";

function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  if (!user) return null;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center gap-6 mr-8">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LeadStar
          </h1>
        </div>
        <div className="flex gap-2 flex-1">
          <Link to="/">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              LeadStar
            </Button>
          </Link>
          <Link to="/you">
            <Button
              variant={location.pathname === "/you" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <User className="h-4 w-4" />
              YOU
            </Button>
          </Link>
          <Link to="/coach">
            <Button
              variant={location.pathname === "/coach" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              COACH
            </Button>
          </Link>
          <Link to="/learnstar">
            <Button
              variant={location.pathname === "/learnstar" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              LEARNSTAR
            </Button>
          </Link>
          <Link to="/kpi">
            <Button
              variant={location.pathname === "/kpi" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              KPI
            </Button>
          </Link>
          <Link to="/team">
            <Button
              variant={location.pathname === "/team" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              TEAM
            </Button>
          </Link>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen dark">
            <Navigation />
            <SwipeableViews>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <LeadStar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/you"
                  element={
                    <ProtectedRoute>
                      <YouView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach"
                  element={
                    <ProtectedRoute>
                      <CoachView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learnstar"
                  element={
                    <ProtectedRoute>
                      <LearnStar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kpi"
                  element={
                    <ProtectedRoute>
                      <KPIPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/team"
                  element={
                    <ProtectedRoute>
                      <TeamPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </SwipeableViews>
            <AIAgentGlobal />
            <Toaster />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
