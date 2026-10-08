import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../Layout/MainLayout";

import Home from "../Pages/Home";

import Explorar from "../Pages/Explorar";

import Conexao from "../Pages/Conexao";

import Perfis from "../Pages/Perfis";

import FaleConosco from "../Pages/FaleConosco";

import Login from "../Pages/Login";

import CadastroArtista from "../Pages/CadastroArtista";

import PerfilArtista from "../Pages/PerfilArtista";

import CadastroCliente from "../Pages/CadastroCliente";

import LoginCliente from "../Pages/LoginCliente";

import PerfilCliente from "../Pages/PerfilCliente";

import Cadastro from "../Pages/Cadastro";

import EscolherLogin from "../Pages/EscolherLogin";

import GerenciarPortfolio from "../Pages/GerenciarPortfolio";

import PortfolioArtista from "../Pages/PortfolioArtista/PortfolioArtista";

import Conversas from "../Pages/Conversas/Conversas";

import Chat from "../Pages/Chat";

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

                    <Route path="/login" element={<EscolherLogin />} />

                    <Route
                        path="/cadastro/artista"
                        element={<CadastroArtista />}
                    />

                    <Route
                        path="/perfil-artista"
                        element={<PerfilArtista />}
                    />

                    <Route
                        path="/cadastro/cliente"
                        element={<CadastroCliente />}
                    />

                    <Route
                        path="/login/cliente"
                        element={<LoginCliente />}
                    />

                    <Route
                        path="/perfil-cliente"
                        element={<PerfilCliente />}
                    />

                    <Route
                        path="/cadastro"
                        element={<Cadastro />}
                    />

                    <Route
                        path="/login/artista"
                        element={<Login />}
                    />

                    <Route
                        path="/perfil-artista/:id"
                        element={<PortfolioArtista />}
                    />

<Route
    path="/gerenciar-portfolio"
    element={<GerenciarPortfolio />}
/>

<Route
    path="/conversas"
    element={<Conversas />}
/>

<Route
    path="/chat/conversa/:conversaId"
    element={<Chat />}
/>

                </Route>

            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;