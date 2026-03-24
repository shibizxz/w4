import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { loadDemoChallengeCatalog } from "../lib/demo";
import { db } from "../lib/firebase";
import {
  defaultChallengeCatalog,
  getActiveChallenges,
  normalizeChallenge,
} from "../lib/challenges";

function useChallengeCatalog() {
  const [state, setState] = useState({
    challenges: getActiveChallenges(defaultChallengeCatalog),
    loading: true,
    error: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadChallenges() {
      if (!db) {
        if (isMounted) {
          setState({
            challenges: getActiveChallenges(loadDemoChallengeCatalog()),
            loading: false,
            error: "",
          });
        }
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, "challenges"), orderBy("sortOrder", "asc")),
        );

        const challenges = snapshot.empty
          ? getActiveChallenges(defaultChallengeCatalog)
          : getActiveChallenges(
              snapshot.docs.map((document) =>
                normalizeChallenge({ id: document.id, ...document.data() }),
              ),
            );

        if (isMounted) {
          setState({
            challenges,
            loading: false,
            error: "",
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            challenges: getActiveChallenges(defaultChallengeCatalog),
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load the Zenvex Capital catalog right now.",
          });
        }
      }
    }

    loadChallenges();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

export default useChallengeCatalog;
