import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? '',
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? '',
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? '',
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() ?? '',
	databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim() ?? '',
}

export const missingFirebaseConfigKeys = [
	['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
	['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
	['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
	['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
	['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
	['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
].flatMap(([key, value]) => (value.length > 0 ? [] : [key]))

export const isFirebaseConfigured = missingFirebaseConfigKeys.length === 0

const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null

export const auth = app ? getAuth(app) : null
export const db = app && firebaseConfig.databaseURL ? getDatabase(app) : null
