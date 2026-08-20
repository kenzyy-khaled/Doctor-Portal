import { useMemo, useState } from "react";
import { TOKEN_KEY, clearSession, getStoredUser, setSession } from "../api/axios";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => getStoredUser());

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      signIn(session) {
        setSession(session);
        setToken(session.token);
        setUser(session.user);
      },
      signOut() {
        clearSession();
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
