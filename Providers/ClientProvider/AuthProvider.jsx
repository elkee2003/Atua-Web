import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { DataStore } from "aws-amplify/datastore";
import { Hub } from "aws-amplify/utils";
import { useNavigate } from "react-router-dom";
import { User } from "../../src/models";

// This is converted already to be compatible to web app

const AuthContext = createContext({});

// ✅ Wait for DataStore sync
const waitForDataStoreReady = () => {
  return new Promise((resolve) => {
    const unsubscribe = Hub.listen("datastore", ({ payload }) => {
      if (payload.event === "ready") {
        unsubscribe();
        resolve();
      }
    });
  });
};

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [userMail, setUserMail] = useState(null);

  // ---------------- LOGOUT / CLEANUP ----------------
  const handleUserDeleted = async () => {
    console.log("User invalid/deleted — clearing session");

    try {
      await signOut({ global: true });
      await DataStore.clear();
      await DataStore.start();
    } catch (err) {
      console.log("Cleanup error:", err);
    }

    setAuthUser(null);
    setDbUser(null);
    setSub(null);

    navigate("/login");
  };

  // ---------------- GET AUTH USER ----------------
  const currentAuthenticatedUser = async () => {
    try {
      const user = await getCurrentUser();

      setAuthUser(user);
      setSub(user.userId);

      // ✅ FIXED: use user directly (not stale state)
      const email = user?.signInDetails?.loginId;
      setUserMail(email);

    } catch (err) {
      console.log("Auth check failed:", err.name);

      if (
        err.name === "UserNotFoundException" ||
        err.name === "NotAuthorizedException" ||
        err.name === "InvalidSignatureException"
      ) {
        await handleUserDeleted();
      }
    }
  };

  // ---------------- GET DB USER ----------------
  const dbCurrentUser = async () => {
    if (!sub) return;

    try {
      await waitForDataStoreReady();

      const users = await DataStore.query(User, (u) =>
        u.sub.eq(sub)
      );

      if (users.length > 0) {
        setDbUser(users[0]);
      } else {
        setDbUser(null);
      }
    } catch (error) {
      console.error("DB user error:", error);
    }
  };

  // ---------------- INIT ----------------
  useEffect(() => {
    currentAuthenticatedUser();
  }, []);

  // ---------------- AUTH EVENTS ----------------
  useEffect(() => {
    const listener = async ({ payload }) => {
      const { event } = payload;

      if (event === "signedIn") {
        await currentAuthenticatedUser();
      }

      if (event === "signedOut") {
        setAuthUser(null);
        setDbUser(null);
        setSub(null);

        navigate("/login");
      }
    };

    const hubListener = Hub.listen("auth", listener);

    return () => hubListener();
  }, []);

  // ---------------- FETCH DB USER ----------------
  useEffect(() => {
    if (sub) {
      dbCurrentUser();
    }
  }, [sub]);

  // ---------------- LIVE UPDATE USER ----------------
  useEffect(() => {
    if (!dbUser) return;

    const subscription = DataStore.observe(User, dbUser.id).subscribe(
      ({ element, opType }) => {
        if (opType === "UPDATE") {
          setDbUser(element);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dbUser]);

  // ---------------- HANDLE DELETE ----------------
  useEffect(() => {
    if (!dbUser) return;

    const subDelete = DataStore.observe(User).subscribe(
      async ({ element, opType }) => {
        if (opType === "DELETE" && element.id === dbUser.id) {
          await DataStore.clear();
          setDbUser(null);
          navigate("/login");
        }
      }
    );

    return () => subDelete.unsubscribe();
  }, [dbUser]);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        dbUser,
        setDbUser,
        sub,
        userMail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export const useAuthContext = () => useContext(AuthContext);