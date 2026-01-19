// App.jsx
import React, { useEffect, useState } from 'react';
import { ChevronRight, Menu, Star, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const App = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const testimonials = [
        {
            name: "Sarah M.",
            role: "Real Estate Agent",
            company: "Coldwell Banker",
            quote: "ArchitectGPT has completely transformed how we present properties to clients. What used to take hours of staging coordination now happens in minutes. Our listings look incredible, and we're closing deals 30% faster because buyers can instantly visualize the potential of every space.",
            tag: "30% faster deal closings"
        },
        {
            name: "Marcus T.",
            role: "Principal Architect",
            company: "Gensler",
            quote: "As an architect, my biggest challenge was always bridging the gap between technical drawings and client understanding. ArchitectGPT has revolutionized our presentations. Clients immediately grasp our vision, leading to faster approvals and fewer revision cycles.",
            tag: "50% fewer design revisions"
        },
        {
            name: "Elena R.",
            role: "Interior Designer",
            company: "Kelly Wearstler Studio",
            quote: "My design process has been completely streamlined. I can explore countless concepts rapidly and present polished visuals that wow clients from the first meeting. ArchitectGPT helps me win more projects because my presentations are consistently stunning.",
            tag: "40% increase in project wins"
        }
    ];

    const features = [
        { category: "Home exteriors", title: "Exterior Redesign", description: "Upload a photo of any home and visualize exterior renovations instantly. Apply new architectural styles, materials, and finishes while preserving the structure." },
        { category: "Room makeovers", title: "Interior Redesign", description: "Transform any room with AI-powered interior design. Apply new styles, furniture, and decor while preserving the room's layout." },
        { category: "Outdoor spaces", title: "Landscape Design", description: "Visualize landscape renovations instantly. Apply new garden styles, plantings, and hardscaping while preserving terrain layout." },
        { category: "Commercial buildings", title: "Commercial Redesign", description: "Transform commercial building exteriors with new architectural styles and materials. Perfect for retail, office, or mixed-use properties." },
        { category: "CAD conversion", title: "CAD to Photorealistic", description: "Transform CAD drawings and 3D renders into photorealistic visualizations. Apply realistic materials, lighting, and finishes instantly." },
        { category: "Building facades", title: "Front Elevation", description: "Transform elevation drawings and facade sketches into photorealistic building renders with accurate materials and lighting." },
        { category: "Plan to render", title: "Floorplan Visualization", description: "Convert floorplan blueprints into furnished top-down visualizations. Transform room labels and door swings into realistic interiors." },
        { category: "Text to image", title: "DreamStyle", description: "Create photorealistic architectural visualizations from text alone. Describe any space you can imagine and bring it to life." },
        { category: "AI editing", title: "Text Edit", description: "Modify designs with natural language. Update materials, swap finishes, adjust lighting, or change architectural elements." }
    ];

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-black/20 backdrop-blur-sm py-6'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <a href="/" className="shrink-0">
                            <span className="text-2xl font-bold tracking-tight text-white">ArchitectGPT</span>
                        </a>
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="/pricing" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 relative group">
                                Pricing
                                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                            </a>
                            <a href="/blog" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 relative group">
                                Blog
                                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                            </a>
                            <a href="/faq" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 relative group">
                                FAQ
                                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                            </a>
                            <a href="/floor-plan-creator" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 relative group">
                                3D Floor Plan
                                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                            </a>
                        </nav>
                        <div className="hidden md:block">
                            <a href="/sign-in">
                                <button className="bg-white text-black px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-zinc-100 transition-colors duration-200 shadow-lg">
                                    Get Started
                                </button>
                            </a>
                        </div>
                        <div className="flex md:hidden">
                            <button type="button" className="text-white hover:text-zinc-300 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200">
                                <span className="sr-only">Toggle menu</span>
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-screen overflow-hidden bg-black">
                <div className="absolute inset-0 lg:hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 w-full min-h-screen relative z-10">
                    <div className="px-8 lg:px-16 xl:px-20 flex flex-col justify-center py-20 lg:py-0">
                        <div className="animate-fade-in">
                            <div className="backdrop-blur-sm py-4 rounded-xl border border-zinc-800/30 inline-block mb-6 animate-slide-up">
                                <div className="flex items-center">
                                    <svg className="h-8 fill-current text-stone-400 text-opacity-75 transition duration-300 group-hover:-translate-x-1 group-hover:scale-105 group-hover:text-[#fd9b61]" viewBox="0 0 28 28">
                                        <path d="M16.247 24.571c-.68-.058-1.523.13-2.098.48-.246.142-.28.364-.07.552.527.48 1.336.843 2.027.89.715.094 1.57-.129 2.145-.562.188-.13.2-.328.023-.492-.515-.48-1.324-.82-2.027-.868Zm2.461-3.96c-.375.574-.586 1.417-.562 2.097.046.715.375 1.535.832 2.04.152.175.34.175.492-.013.457-.539.703-1.394.633-2.12-.047-.68-.387-1.489-.856-2.028-.176-.21-.387-.2-.539.023Zm-5.765.785c-.645-.235-1.524-.258-2.18-.059-.258.082-.328.281-.188.516.387.597 1.078 1.148 1.723 1.382.656.27 1.547.27 2.215-.011.223-.082.281-.258.152-.469-.375-.598-1.066-1.137-1.722-1.36Zm3.374-3.188c-.503.457-.937 1.207-1.066 1.875-.152.703-.047 1.582.27 2.18.093.222.28.258.48.117.563-.41 1.02-1.172 1.137-1.898.14-.668.023-1.547-.293-2.18-.106-.258-.328-.293-.527-.094ZM8.01 16.86c.094.68.504 1.477 1.008 1.97.492.515 1.3.866 2.027.89.234.012.363-.14.328-.375-.117-.715-.527-1.477-1.031-1.934-.504-.48-1.277-.855-1.957-.937-.281-.035-.422.117-.375.386Zm6.715-1.007a3.872 3.872 0 0 0-1.735 1.289c-.421.55-.668 1.383-.644 2.11.023.222.176.339.41.304.703-.164 1.441-.668 1.816-1.278.387-.597.645-1.43.598-2.12 0-.282-.176-.4-.445-.305Zm-1.957-2.742c-.551.445-1.008 1.195-1.149 1.886-.035.211.082.375.305.387.726.023 1.559-.293 2.086-.762.527-.457.996-1.219 1.148-1.898.036-.258-.105-.434-.363-.422-.703.059-1.512.363-2.027.809ZM8.02 11.575a3.69 3.69 0 0 0 .492 2.157c.351.632 1.043 1.183 1.723 1.37.21.071.398-.046.421-.28.07-.669-.129-1.524-.504-2.133-.375-.586-1.043-1.149-1.664-1.395-.246-.105-.445 0-.468.281Zm5.39-2.402c-.668.234-1.36.762-1.734 1.371-.129.188-.059.387.152.48.668.27 1.547.27 2.215 0 .68-.257 1.383-.82 1.723-1.417.14-.211.07-.41-.188-.493-.668-.187-1.535-.175-2.168.059Zm-3.937-3.07c-.305.644-.422 1.511-.293 2.191.129.715.586 1.465 1.172 1.887.175.14.363.082.48-.13.305-.608.41-1.476.258-2.167-.14-.68-.586-1.43-1.078-1.899-.188-.164-.41-.117-.54.118Zm6.058-.305c-.691.129-1.453.574-1.886 1.113-.141.164-.106.364.082.492.62.364 1.5.48 2.191.293.691-.152 1.453-.609 1.898-1.125.176-.21.13-.421-.117-.527a3.795 3.795 0 0 0-2.168-.246Zm-3.457-3.61c-.398.598-.632 1.454-.586 2.133.012.715.364 1.524.88 2.04.175.164.374.14.503-.047.387-.598.621-1.454.563-2.133-.047-.668-.364-1.465-.809-2.016-.187-.21-.398-.187-.55.024Zm6.047-1.183c-.68.105-1.453.516-1.945.996s-.88 1.29-.961 1.969c-.023.234.105.375.34.363.715-.035 1.511-.41 2.004-.96.468-.493.855-1.278.96-1.981.024-.27-.117-.422-.398-.387Z"></path>
                                    </svg>
                                    <div className="flex flex-col mx-3 gap-1">
                                        <h3 className="text-base font-medium text-white">#1 AI Architecture App</h3>
                                        <div className="flex gap-1 justify-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-[#fd9b61] fill-[#fd9b61]" />
                                            ))}
                                        </div>
                                    </div>
                                    <svg className="h-8 fill-current text-stone-400 text-opacity-75 transition duration-300 group-hover:translate-x-1 group-hover:scale-105 group-hover:text-orange-300" viewBox="0 0 28 28">
                                        <path d="M11.867 24.571c-.703.047-1.511.387-2.027.868-.176.164-.164.363.023.492.575.433 1.43.656 2.145.562.68-.047 1.488-.41 2.027-.89.211-.188.176-.41-.07-.551-.574-.352-1.418-.54-2.098-.48Zm-2.46-3.96c-.153-.223-.364-.235-.54-.024-.468.54-.808 1.348-.855 2.027-.07.727.176 1.582.633 2.121.152.188.34.188.492.012.457-.504.785-1.324.82-2.039.035-.68-.187-1.523-.55-2.098Zm5.765.785c-.656.222-1.348.761-1.723 1.359-.129.21-.07.387.153.469.668.281 1.558.281 2.215.011.644-.234 1.335-.785 1.722-1.382.14-.235.07-.434-.187-.516-.657-.2-1.535-.176-2.18.059Zm-3.375-3.188c-.21-.2-.422-.164-.527.094-.317.633-.434 1.512-.305 2.18.129.726.586 1.488 1.148 1.898.188.14.387.105.48-.117.317-.598.411-1.477.27-2.18-.14-.668-.562-1.418-1.066-1.875Zm8.309-1.348c.046-.27-.094-.421-.375-.386-.68.082-1.454.457-1.957.937-.504.457-.915 1.219-1.032 1.934-.035.234.094.387.328.375.727-.024 1.536-.375 2.028-.89.504-.493.914-1.29 1.008-1.97Zm-6.727-1.007c-.258-.094-.434.023-.434.304-.046.692.2 1.524.598 2.121.375.61 1.113 1.114 1.817 1.278.222.035.386-.082.398-.305.035-.727-.223-1.559-.633-2.11a3.843 3.843 0 0 0-1.746-1.288Zm1.957-2.742c-.504-.446-1.312-.75-2.016-.81-.27-.01-.398.165-.363.423.152.68.61 1.441 1.149 1.898.515.469 1.359.785 2.086.762.21-.012.34-.176.304-.387a3.44 3.44 0 0 0-1.16-1.886Zm4.758-1.536c-.035-.28-.223-.386-.469-.28-.633.245-1.3.808-1.664 1.394-.375.609-.586 1.464-.504 2.132.024.235.2.352.422.282.68-.188 1.371-.739 1.723-1.371a3.69 3.69 0 0 0 .492-2.157Zm-5.39-2.402c-.634-.234-1.5-.246-2.169-.059-.258.082-.328.282-.199.493.352.597 1.043 1.16 1.734 1.418.657.27 1.547.27 2.215 0 .211-.094.27-.293.153-.48-.375-.61-1.067-1.138-1.735-1.372Zm3.925-3.07c-.117-.235-.34-.282-.539-.118-.48.47-.926 1.22-1.066 1.899-.153.691-.059 1.559.257 2.168.106.21.305.27.48.129.575-.422 1.032-1.172 1.161-1.887.14-.68.023-1.547-.293-2.191Zm-6.059-.305c-.68-.14-1.535-.035-2.156.246-.246.106-.304.316-.129.527.457.516 1.22.973 1.899 1.125.703.188 1.582.07 2.191-.293.2-.128.235-.328.094-.492a3.425 3.425 0 0 0-1.899-1.113Zm3.47-3.61c-.153-.21-.376-.234-.552-.023-.445.55-.773 1.348-.808 2.016-.07.68.164 1.535.562 2.133.13.187.328.21.504.046.516-.515.867-1.324.88-2.039.046-.68-.188-1.535-.587-2.132ZM9.991 1.006c-.28-.035-.422.117-.398.387.105.703.492 1.488.96 1.98.493.551 1.29.926 2.005.961.234.012.363-.129.34-.363-.082-.68-.47-1.488-.973-1.969-.48-.48-1.254-.89-1.934-.996Z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 leading-[1.1] bg-gradient-to-r from-zinc-100 via-white to-zinc-200 bg-clip-text text-transparent animate-fade-in">
                            Transform Your Space With AI-Powered Design
                        </h1>
                        <p className="mb-12 text-lg lg:text-xl text-zinc-300 max-w-xl leading-relaxed animate-fade-in">
                            Experience the future of architectural brilliance. Let ArchitectGPT turn your vision into stunning reality with AI-powered design solutions. ✨
                        </p>
                        <div className="mb-16 animate-fade-in">
                            <a href="/sign-in">
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap h-11 rounded-md bg-white text-black hover:bg-zinc-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                    Get Started
                                    <ChevronRight className="ml-2 w-5 h-5" />
                                </button>
                            </a>
                        </div>
                        <div className="grid grid-cols-3 gap-8 max-w-xl animate-fade-in">
                            {[
                                { value: "50M+", label: "Designs Created" },
                                { value: "7M+", label: "Users" },
                                { value: "4.9/5", label: "User Rating" }
                            ].map((stat, index) => (
                                <div key={index} className="group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                    <div className="text-2xl lg:text-3xl font-bold text-white group-hover:text-zinc-200 transition-colors duration-300">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-zinc-400 mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative hidden lg:block h-full w-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-24 overflow-hidden bg-black">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-zinc-900 rounded-full opacity-30 blur-[100px] animate-pulse"></div>
                <div className="absolute top-1/2 -right-40 w-80 h-80 bg-zinc-900 rounded-full opacity-20 blur-[100px]"></div>
                <div className="absolute -bottom-40 left-1/4 w-80 h-80 bg-zinc-900 rounded-full opacity-20 blur-[100px]"></div>

                <div className="container mx-auto px-6 relative">
                    <div className="max-w-3xl mx-auto text-center mb-20 animate-fade-in">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-zinc-400">
                                Unlock Endless Design Possibilities
                            </span>
                        </h2>
                        <div className="w-20 h-1 bg-zinc-700 mx-auto mb-6 rounded-full"></div>
                        <p className="text-lg text-zinc-400 font-light max-w-2xl mx-auto">
                            Our AI-powered features give you complete control over your architectural design journey
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="h-full animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="rounded-lg border shadow-sm group h-full relative overflow-hidden bg-zinc-900/40 backdrop-blur-sm border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br from-white via-zinc-500 to-zinc-900"></div>
                                    <div className="flex flex-col space-y-1.5 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="px-3 py-1.5 text-xs rounded-full border border-zinc-800 text-zinc-500 group-hover:border-zinc-700 transition-all">
                                                {feature.category}
                                            </div>
                                        </div>
                                        <h3 className="tracking-tight text-xl font-semibold text-white group-hover:text-white transition-colors">
                                            {feature.title}
                                        </h3>
                                    </div>
                                    <div className="p-6 pt-0">
                                        <p className="text-zinc-400 group-hover:text-zinc-300 text-sm leading-relaxed transition-colors">
                                            {feature.description}
                                        </p>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-zinc-700 group-hover:w-full transition-all duration-700"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-black">
                <div className="container mx-auto px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16 animate-fade-in">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Trusted by Design
                                <span className="block bg-gradient-to-r from-white via-zinc-300 to-white bg-clip-text text-transparent">
                                    Professionals Worldwide
                                </span>
                            </h2>
                            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
                                See how architects, designers, and real estate professionals are transforming their businesses and delivering exceptional results with AI-powered design.
                            </p>
                        </div>

                        <div className="relative animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {testimonials.map((testimonial, index) => (
                                    <div key={index} className="h-full animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 h-full flex flex-col hover:border-zinc-700 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-950/20">
                                            <div className="flex mb-6">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                ))}
                                            </div>
                                            <blockquote className="text-zinc-300 leading-relaxed mb-8 grow">
                                                "{testimonial.quote}"
                                            </blockquote>
                                            <div className="mb-6">
                                                <span className="inline-flex items-center px-3 py-1 bg-zinc-800 text-zinc-400 text-sm font-medium rounded-full">
                                                    {testimonial.tag}
                                                </span>
                                            </div>
                                            <div className="border-t border-zinc-800 pt-6">
                                                <div>
                                                    <h4 className="font-semibold text-white text-lg">{testimonial.name}</h4>
                                                    <p className="text-zinc-400 text-sm">{testimonial.role}</p>
                                                    <p className="text-zinc-500 text-sm">{testimonial.company}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-24 bg-black overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(40,40,40,0.15),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(40,40,40,0.15),transparent_50%)]"></div>

                <div className="container mx-auto px-6 relative">
                    <div className="relative rounded-2xl overflow-hidden bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 animate-fade-in">
                        <div className="grid lg:grid-cols-2 gap-0">
                            <div className="relative p-10 lg:p-16">
                                <div className="max-w-xl">
                                    <div className="space-y-6 animate-fade-in">
                                        <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                                            Transform Your Design Process
                                        </h2>
                                        <p className="text-lg text-zinc-400 leading-relaxed">
                                            Join 7M+ architects, designers, and real estate professionals who've already revolutionized how they work. Create presentation-ready visuals in minutes, win more projects, and deliver results that wow clients every time.
                                        </p>
                                    </div>

                                    <div className="space-y-5 mt-10">
                                        {[
                                            "Win More Projects",
                                            "Save Hours Daily",
                                            "No Technical Skills Required",
                                            "Used by Industry Leaders"
                                        ].map((item, index) => (
                                            <div key={index} className="group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 mt-1">
                                                        <Check className="w-3 h-3 text-black" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-semibold text-base">{item}</h3>
                                                        <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                                                            {item === "Win More Projects" && "Present stunning visuals that impress clients and close deals 30% faster"}
                                                            {item === "Save Hours Daily" && "What took days now takes minutes - focus on design, not rendering"}
                                                            {item === "No Technical Skills Required" && "Upload, describe, and transform - anyone can create professional results"}
                                                            {item === "Used by Industry Leaders" && "Trusted by architects at top global firms and award-winning studios"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-10 space-y-4 animate-fade-in">
                                        <a href="/sign-in">
                                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap h-10 bg-white hover:bg-zinc-100 text-black shadow-lg shadow-white/20 px-8 py-6 rounded-lg text-base font-semibold w-full sm:w-auto transition-all duration-300 hover:scale-105">
                                                Start Creating Now
                                                <ArrowRight className="ml-2 w-5 h-5" />
                                            </button>
                                        </a>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-zinc-800 animate-fade-in">
                                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className="text-yellow-400">★</span>
                                                ))}
                                            </div>
                                            <span className="font-medium text-white">4.9/5</span>
                                            <span>•</span>
                                            <span>7M+ professionals</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative h-full min-h-[400px] lg:min-h-full">
                                <div className="absolute inset-0 animate-float">
                                    <div className="relative w-full h-full overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-transparent"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default App;