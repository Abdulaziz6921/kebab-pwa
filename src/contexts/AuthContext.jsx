import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/config";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bugungi kunni "YYYY-MM-DD" format olish funksiyasi
  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Login funksiyasi
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Muvaffaqiyatli kirilgach, bugungi sanani xotiraga yozamiz
    localStorage.setItem("auth_login_date", getTodayString());
    return result;
  };

  // Chiqish funksiyasi
  const logout = async () => {
    localStorage.removeItem("auth_login_date");
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const savedDate = localStorage.getItem("auth_login_date");
          const todayDate = getTodayString();

          if (savedDate && savedDate !== todayDate) {
            console.log("Kun almashdi! Yangi login talab qilinadi.");

            localStorage.removeItem("auth_login_date");
            await signOut(auth);
            setUser(null);
          } else {
            setUser(currentUser);

            if (!savedDate) {
              localStorage.setItem("auth_login_date", todayDate);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
