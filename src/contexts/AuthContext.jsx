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

  // Bugungi kunni "YYYY-MM-DD" formatida olish funksiyasi
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
      if (currentUser) {
        const savedDate = localStorage.getItem("auth_login_date");
        const todayDate = getTodayString();

        // Agar saqlangan sana bugungi kunga teng bo'lmasa (Kun almashgan bo'lsa)
        if (savedDate !== todayDate) {
          console.log("Kun almashdi! Yangi login talab qilinadi.");
          localStorage.removeItem("auth_login_date");
          await signOut(auth); // Avtomatik tizimdan chiqarib yuborish
          setUser(null);
        } else {
          // Kun hali o'zgarmagan bo'lsa, tizimda qoladi
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
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
