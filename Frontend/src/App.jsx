import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import Home from "./Components/Home";
import Auth from './Components/Auth';
import Dashboard from "./Components/Dashboard";
import Analytics from "./Components/Analytics";
import Profile from "./Components/Profile";
import InfantProfile from "./Components/InfantProfile";
import AddInfant from './Components/AddInfant';
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import './App.css'

function App() {

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
    </>
  )
}

export default App
