import { Route, Routes } from "react-router-dom";

import Home from "./pages/home/Home";

import Login from "./pages/auth/Login/Login";
import SystemLogin from "./pages/auth/Login/SystemLogin";
import Signup from "./pages/auth/Signup/Signup";

import Community from "./pages/community/Community";

import MyPage from "./pages/mypage/MyPage";

import MapPage from "./pages/map/MapPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<SystemLogin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/community" element={<Community />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/map" element={<MapPage />} />
    </Routes>
  );
}

export default App;
