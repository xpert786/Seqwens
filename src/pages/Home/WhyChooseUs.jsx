import { useRef, useState } from "react";

export default function WhyChooseUs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryItems = [
    {
      id: 1,
      title: "Client & Workflow Automation",
      description: "Manage clients, returns, and staff tasks with intelligent, rule-based workflows designed specifically for tax offices.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Client Intake",
      description: "Clients upload documents, e-sign forms, and track return status in real time, reducing back-and-forth communication.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2011&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Smart Intake & Forms",
      description: "Replace static forms with guided, tax-specific data collection that adapts to each client’s situation.",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 4,
      title: "Document Management",
      description: "Organize source documents, signed forms, and IRS notices in one secure, searchable system.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 5,
      title: "Task & Deadline Tracking",
      description: "Never miss a deadline. Automatically assign tasks to admins, preparers, and reviewers based on return status.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 6,
      title: "Practice Analytics",
      description: "Track productivity, return volume, turnaround time, and staff performance with real-time reporting.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-24 bg-black" id="gallery">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              AI-Powered Tax Operations
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              Our AI-powered features give you complete control over your firm’s operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {galleryItems.map((item, index) => (
              <div
                key={item.id}
                onMouseEnter={() => setActiveIndex(index)}
                className={`group relative overflow-hidden rounded-xl md:rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-2xl min-h-[320px] ${activeIndex === index
                  ? "border-zinc-700"
                  : "border-zinc-800"
                  }`}
              >
                {/* Image Background - Always visible */}
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${activeIndex === index ? "scale-110" : "group-hover:scale-110"
                    }`}
                  style={{ backgroundImage: `url(${item.image})` }}
                >
                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                </div>

                {/* Content overlay - Controlled by activeIndex */}
                <div
                  className={`absolute inset-0 p-6 md:p-8 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-500 ${activeIndex === index ? "opacity-100" : "opacity-0"
                    }`}
                >
                  <div
                    className={`transform transition-transform duration-500 ${activeIndex === index ? "translate-y-0" : "translate-y-4"
                      }`}
                  >
                    {/* Number with accent line */}

                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-zinc-200 text-sm md:text-base leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Gradient overlay on hover - KEPT SIMPLE/REMOVED COLOR */}
                <div className={`absolute inset-0 bg-black/10 transition-all duration-500 ${activeIndex === index
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
                  }`}></div>
              </div>
            ))}
          </div>

          {/* <div className="text-center mt-16">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-[10px] font-semibold text-base md:text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-blue-500/25">
              Schedule a Demo
            </button>
            <p className="text-zinc-500 text-sm mt-4">
              See how our automation can transform your tax practice
            </p>
          </div> */}
        </div>
      </div>
    </section>
  );
}