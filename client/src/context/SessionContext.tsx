import React, { createContext, useContext, useState, useEffect } from "react";
import { nanoid } from "nanoid";

interface SessionContextType {
  sessionId: string;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>("");
  
  useEffect(() => {
    // Get existing sessionId from localStorage or create a new one
    const existingSessionId = localStorage.getItem("true-false-history-session");
    
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = nanoid();
      localStorage.setItem("true-false-history-session", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);
  
  // Don't render children until we have a sessionId
  if (!sessionId) {
    return null;
  }
  
  return (
    <SessionContext.Provider value={{ sessionId }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
