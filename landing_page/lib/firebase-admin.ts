import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | undefined;
let db: Firestore | undefined;
let adminAuth: Auth | undefined;

function getFirebaseAdmin() {
  if (!app) {
    const existingApps = getApps();

    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      // Use service account if provided, otherwise use Application Default Credentials
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccount) {
        try {
          const parsedServiceAccount = JSON.parse(serviceAccount);
          app = initializeApp({
            credential: cert(parsedServiceAccount),
            projectId: 'kalee-prod',
          });
        } catch {
          // If parsing fails, try using it as a path
          app = initializeApp({
            credential: cert(serviceAccount),
            projectId: 'kalee-prod',
          });
        }
      } else {
        // Use Application Default Credentials (works in Firebase/GCP environments)
        app = initializeApp({
          projectId: 'kalee-prod',
        });
      }
    }

    db = getFirestore(app);
    adminAuth = getAuth(app);
  }

  return { app, db: db!, adminAuth: adminAuth! };
}

export { getFirebaseAdmin };
