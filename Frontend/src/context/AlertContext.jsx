import { createContext, useContext, useState, useCallback } from "react";

const AlertContext = createContext(null);

let idCounter = 0;

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const pushAlert = useCallback((infantName, label, confidence) => {
    const id = ++idCounter;
    setAlerts(prev => [...prev, { id, infantName, label, confidence }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 8000);
  }, []);

  const dismiss = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, pushAlert, dismiss }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
