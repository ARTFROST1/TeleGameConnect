import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "@/contexts/GameContext";
import Welcome from "@/pages/welcome";
import CreateProfile from "@/pages/create-profile";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import FindPartner from "@/pages/find-partner";
import TruthOrDare from "@/pages/truth-or-dare";
import SyncGame from "@/pages/sync-game";
import Statistics from "@/pages/statistics";
import GameHistory from "@/pages/game-history";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/create-profile" component={CreateProfile} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/find-partner" component={FindPartner} />
      <Route path="/truth-or-dare" component={TruthOrDare} />
      <Route path="/sync-game" component={SyncGame} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/game-history" component={GameHistory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </GameProvider>
    </QueryClientProvider>
  );
}

export default App;
