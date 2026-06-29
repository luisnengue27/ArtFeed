import { Outlet } from "react-router-dom";
import Navbar from "../Components/NavBar/NavBar";
import Footer from "../Components/Footer/Footer";
import "./MainLayout.css";

const MainLayout = () => {
  return (
    <div className="layout">
      <Navbar />

      <main className="content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;