import GameScreen from "@/components/game-screen"
import { StoreProvider } from "@/components/store-provider"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
      <StoreProvider>
        <GameScreen />
      </StoreProvider>
    </main>
  )
}
