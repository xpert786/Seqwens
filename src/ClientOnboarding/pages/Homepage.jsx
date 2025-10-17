import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Highlights from "../components/Highlights";
import About from "../components/About";
import Features from "../components/Features";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <Highlights />
      <About />
      <Features />
      <Footer />
    </>
  );
}

export default Home;
