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
    }
  }, [initialPlayers]);

  function setActivePlayerId(id: string | null) {
    setActivePlayerIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
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
