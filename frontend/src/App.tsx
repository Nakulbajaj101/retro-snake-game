import { ThemeProvider } from "@/components/theme-provider"
import { ProfileSettings } from "@/components/profile-settings"
import { SnakeGame } from "@/components/SnakeGame"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { AuthDialog } from "@/components/AuthDialog"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"
import { Leaderboard } from "@/components/Leaderboard"
import { UserAvatar } from "@/components/user-avatar"

function HeaderControls() {
  const { user, logout } = useAuth()

  return (
    <div className="absolute top-4 right-4 flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-3 bg-card/50 p-2 rounded-lg border border-border backdrop-blur-sm">
          <UserAvatar avatarString={user.avatar} size="md" />
          <div className="text-sm text-right hidden sm:block">
            <p className="text-muted-foreground text-xs">Welcome back,</p>
            <p className="font-bold text-primary">{user.display_name || user.username}</p>
          </div>
          <div className="h-8 w-[1px] bg-border hidden sm:block" />
          <ProfileSettings />
          <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="hover:text-destructive">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <AuthDialog>
          <Button variant="default" size="sm" className="gap-2 shadow-lg hover:shadow-primary/25 transition-all">
            <LogIn className="h-4 w-4" />
            Login / Register
          </Button>
        </AuthDialog>
      )}
    </div>
  )
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="neon-green" storageKey="snake-game-theme">
          <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 transition-colors duration-300 gap-8">
            <HeaderControls />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              Retro Snake
            </h1>
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
              <SnakeGame />
              <div className="w-full max-w-md">
                <Leaderboard />
              </div>
            </div>
            <Toaster />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App;
