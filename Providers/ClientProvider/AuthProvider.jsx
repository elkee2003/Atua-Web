import { getCurrentUser, signOut } from "aws-amplify/auth";
import { DataStore } from "aws-amplify/datastore";
import { Hub } from "aws-amplify/utils";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../../src/models";

const AuthContext = createContext({});

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
  const navigate = useNavigate(); // ✅ added

  const [authUser, setAuthUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [userMail, setUserMail] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ✅ HANDLE USER DELETED
  const handleUserDeleted = async () => {
    console.log("User deleted — clearing session...");
    try {
      await signOut({ global: true });
      await DataStore.clear();
      await DataStore.start();
    } catch (err) {
      console.log("Error clearing session:", err);
    } finally {
      setAuthUser(null);
      setDbUser(null);
      setSub(null);
      navigate("/", { replace: true }); // ✅ updated
    }
  };

  // ✅ GET AUTH USER
  const currentAuthenticatedUser = async () => {
    try {
      const user = await getCurrentUser();
      setAuthUser(user);
      setSub(user.userId);
      setUserMail(user?.signInDetails?.loginId);
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

  // ✅ GET DB USER
  const dbCurrentUser = async () => {
    if (!sub) return;

    try {
      setLoadingUser(true);

      await waitForDataStoreReady();

      const users = await DataStore.query(User, (u) => u.sub.eq(sub));

      setDbUser(users.length > 0 ? users[0] : null);
    } catch (error) {
      console.error("Error getting dbuser: ", error);
    } finally {
      setLoadingUser(false);
    }
  };

  // ✅ REFRESH USER
  const refreshUser = async () => {
    if (!sub) return;

    try {
      setLoadingUser(true);
      await DataStore.clear();
      await DataStore.start();
      await dbCurrentUser();
    } catch (e) {
      console.log("Refresh error:", e);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    currentAuthenticatedUser();
  }, []);

  // ✅ HUB LISTENER
  useEffect(() => {
    const handleSignOutEvent = async () => {
      try {
        await DataStore.clear();
      } catch (e) {
        console.log("Error clearing DataStore:", e);
      }

      setAuthUser(null);
      setDbUser(null);
      setSub(null);

      navigate("/", { replace: true }); // ✅ updated
    };

    const listener = (data) => {
      const { event } = data.payload;

      if (event === "signedIn") {
        currentAuthenticatedUser();
      } else if (event === "signedOut") {
        handleSignOutEvent();
      }
    };

    const hubListener = Hub.listen("auth", listener);

    return () => hubListener();
  }, []);

  useEffect(() => {
    if (sub) {
      dbCurrentUser();
    }
  }, [sub]);

  // ✅ UPDATE SUBSCRIPTION
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

  // ✅ DELETE SUBSCRIPTION
  useEffect(() => {
    if (!dbUser) return;

    const deleteSubscription = DataStore.observe(User).subscribe(
      async ({ element, opType }) => {
        if (opType === "DELETE" && element.id === dbUser.id) {
          await DataStore.clear();
          setDbUser(null);
        }
      }
    );

    return () => deleteSubscription.unsubscribe();
  }, [dbUser]);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        dbUser,
        setDbUser,
        sub,
        userMail,
        loadingUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export const useAuthContext = () => useContext(AuthContext);