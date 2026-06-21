import { useEffect } from 'react'
import Home from "./Components/Home";
import Auth from './Components/Auth';
import Dashboard from "./Components/Dashboard";
import Analytics from "./Components/Analytics";
import Profile from "./Components/Profile";
import InfantProfile from "./Components/InfantProfile";
import AddInfant from './Components/AddInfant';
import AlertToast from './Components/AlertToast';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { startPredictionMonitor } from "./Services/predictionMonitor";
import { AlertProvider, useAlert } from './context/AlertContext';
import { supabase } from './supabaseClient';

import './App.css'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function AppInner() {
  const { pushAlert } = useAlert();

  useEffect(() => {
    startPredictionMonitor();

    // Bridge window events from predictionMonitor into React context
    const handler = (e) => {
      const { infantName, label, confidence } = e.detail;
      pushAlert(infantName, label, confidence);
    };
    window.addEventListener("neocare-alert", handler);

    // Register service worker and subscribe to push notifications
    if ("serviceWorker" in navigator && VAPID_PUBLIC_KEY) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (reg) => {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;

          const existing = await reg.pushManager.getSubscription();
          const sub = existing ?? await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          await fetch("http://localhost:8000/push-subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              subscription_json: JSON.stringify(sub.toJSON()),
            }),
          });
        })
        .catch((err) => console.error("Service worker registration failed:", err));
    }

    return () => window.removeEventListener("neocare-alert", handler);
  }, [pushAlert]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/infant/:id" element={<InfantProfile />} />
          <Route path="/add-infant" element={<AddInfant />} />
        </Routes>
      </BrowserRouter>
      <AlertToast />
    </>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function App() {
  return (
    <AlertProvider>
      <AppInner />
    </AlertProvider>
  );
}

export default App
