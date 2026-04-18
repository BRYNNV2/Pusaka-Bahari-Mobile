import React, { createContext, useState, useContext, useEffect } from 'react';

type UserData = {
  name: string;
  email: string;
  profilePic: string;
  progressText: string;
  progressPercent: string;
};

type AuthContextType = {
  isLoggedIn: boolean;
  userData: UserData | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userData: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const login = () => {
    setIsLoggedIn(true);
    setUserData({
      name: 'Raja Segara',
      email: 'pelaut@penyengat.go',
      profilePic: 'https://i.pravatar.cc/150?img=11',
      progressText: '100% profile complete',
      progressPercent: '100%',
    });
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
