import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAdminEmail, isAdminEmail } from "../lib/admin";
import {
  clearDemoSession,
  createDemoIdentity,
  loadDemoSession,
  saveDemoSession,
} from "../lib/demo";
import { auth, db, firebaseConfigError } from "../lib/firebase";

const AuthContext = createContext(null);

async function fetchUserProfile(userId) {
  if (!db) {
    return null;
  }

  const snapshot = await getDocs(
    query(collection(db, "users"), where("userId", "==", userId), limit(1)),
  );

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];
  return { id: document.id, ...document.data() };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      const savedDemoSession = loadDemoSession();

      if (savedDemoSession) {
        setUser(savedDemoSession.user);
        setProfile(savedDemoSession.profile);
      }

      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const existingProfile = await fetchUserProfile(currentUser.uid);

        setProfile(
          existingProfile || {
            userId: currentUser.uid,
            name: currentUser.displayName || "Trader",
            email: currentUser.email || "",
          },
        );
      } catch (error) {
        console.error("Failed to load user profile", error);
        setProfile({
          userId: currentUser.uid,
          name: currentUser.displayName || "Trader",
          email: currentUser.email || "",
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const register = async ({ name, email, password }) => {
    if (!auth || !db) {
      throw new Error(firebaseConfigError);
    }

    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credentials.user, { displayName: name });

    await addDoc(collection(db, "users"), {
      userId: credentials.user.uid,
      name,
      email,
      createdAt: serverTimestamp(),
    });

    setProfile({
      userId: credentials.user.uid,
      name,
      email,
    });

    return credentials;
  };

  const login = async (email, password) => {
    if (!auth) {
      throw new Error(firebaseConfigError);
    }

    const credentials = await signInWithEmailAndPassword(auth, email, password);

    if (db) {
      try {
        await addDoc(collection(db, "userActivity"), {
          userId: credentials.user.uid,
          type: "login",
          summary: "User signed in",
          metadata: {
            email: credentials.user.email || "",
          },
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to store login activity", error);
      }
    }

    return credentials;
  };

  const enterDemo = async ({ name, email }) => {
    const identity = createDemoIdentity({ name, email });
    const session = saveDemoSession(identity);

    setUser(session.user);
    setProfile(session.profile);

    return session;
  };

  const enterDemoAdmin = async () => {
    const identity = createDemoIdentity({
      name: "Zenvex Admin",
      email: getAdminEmail(),
    });
    const session = saveDemoSession(identity);

    setUser(session.user);
    setProfile(session.profile);

    return session;
  };

  const logout = () => {
    if (!auth) {
      clearDemoSession();
      setUser(null);
      setProfile(null);
      return Promise.resolve();
    }

    return signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAdmin: isAdminEmail(user?.email || profile?.email),
      register,
      login,
      enterDemo,
      enterDemoAdmin,
      logout,
    }),
    [loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
