import { useEffect, useState } from 'react';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { createFirebaseApp } from '../firebaseApp';

const { app } = createFirebaseApp();
const db = getFirestore(app);

export function useGenerationDocument({ userId, jobId }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !jobId) {
      setData(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const rootCollection = import.meta.env.VITE_FIRESTORE_ROOT_COLLECTION || 'users';
    const ref = doc(db, `${rootCollection}/${userId}/generations/${jobId}`);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.exists() ? snapshot.data() : null);
        setIsLoading(false);
      },
      (subscribeError) => {
        console.error('Failed to listen to Firestore document', subscribeError);
        setError(subscribeError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, jobId]);

  return { data, isLoading, error };
}
