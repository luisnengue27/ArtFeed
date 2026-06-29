import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../Layout/MainLayout";  

import Home from "../Pages/Home";

import Explorar from "../Pages/Explorar";

import Conexao from "../Pages/Conexao";

import Perfis from "../Pages/Perfis";

import FaleConosco from "../Pages/FaleConosco";

import Login from "../Pages/Login";


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
<Route path="/explorar" element={<Explorar />} />
<Route path="/perfis" element={<Perfis />} />
<Route path="/Conexao" element={<Conexao />} />
<Route path="/FaleConosco" element={<FaleConosco />} />
<Route path="/login" element={<Login />} />    
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;