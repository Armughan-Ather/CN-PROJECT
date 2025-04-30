import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // added loading state

  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem("username");
      const storedToken = localStorage.getItem("access_token");

      if (storedUsername) setUsername(storedUsername);
      if (storedToken) setToken(storedToken);
    } catch (err) {
      console.error("Error accessing localStorage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (username, token) => {
    setUsername(username);
    setToken(token);
    localStorage.setItem("username", username);
    localStorage.setItem("access_token", token);
  };

  const logout = () => {
    setUsername(null);
    setToken(null);
    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
  };

  const user = username && token ? { username, accessToken: token } : null;

  if (loading) return null; // prevent children from rendering until localStorage is loaded

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
