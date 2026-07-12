"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Player = { id: string; name: string; avatarColor: string };

type PlayerContextValue = {
  activePlayerId: string | null;
  setActivePlayerId: (id: string | null) => void;
  players: Player[];
};

const PlayerContext = createContext<PlayerContextValue>({
  activePlayerId: null,
  setActivePlayerId: () => {},
  players: [],
});

const STORAGE_KEY = "shuttletrack-active-player";

export function PlayerProvider({
  children,
  initialPlayers,
}: {
  children: React.ReactNode;
  initialPlayers: Player[];
}) {
  const [activePlayerId, setActivePlayerIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Only restore if the stored player still exists
    if (stored && initialPlayers.some((p) => p.id === stored)) {
      setActivePlayerIdState(stored);
      document.cookie = `shuttletrack-player=${stored}; path=/; max-age=31536000; SameSite=Lax; Secure`;
    }
  }, [initialPlayers]);

  function setActivePlayerId(id: string | null) {
    setActivePlayerIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
      document.cookie = `shuttletrack-player=${id}; path=/; max-age=31536000; SameSite=Lax; Secure`;
    } else {
      localStorage.removeItem(STORAGE_KEY);
      document.cookie = `shuttletrack-player=; path=/; max-age=0`;
    }
  }

  return (
    <PlayerContext.Provider value={{ activePlayerId, setActivePlayerId, players: initialPlayers }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
