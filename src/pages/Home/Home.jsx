import Header from "../../components/Header";
import Footer from "../../components/Footer";

import HeroSection from "./HeroSection";
import FeatureCards from "./FeatureCards";
import WhyChooseUs from "./WhyChooseUs";
import AiAutomation from "./AiAutomation";
import PricingSection from "./PricingSection";
import Testimonials from "./Testimonials";
import FaqSection from "./FaqSection";

export default function Home() {
    return (
        <div
            className="w-full bg-black"
        >


            <Header />

            <HeroSection />
            <FeatureCards />
            <WhyChooseUs />
            <AiAutomation />
            <PricingSection />
            <Testimonials />
            <FaqSection />

            <Footer />
        </div>
    );
}
