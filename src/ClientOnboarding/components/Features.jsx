function Features() {
  const cards = [
    { title: "User Management", desc: "Onboarding, access control, user settings", icon: "bi-person-gear" },
    { title: "Client Portal", desc: "Self-serve document uploads, messaging, forms", icon: "bi-people-fill" },
    { title: "CRM Integration", desc: "Integrated with top CRMs and communication tools", icon: "bi-link" },
    { title: "Document Management", desc: "OCR, folder sharing, e-signatures", icon: "bi-folder2-open" },
  ];

  return (
    <section className="py-5" style={{ backgroundColor: "#2B3953", color: "#fff" }}>
      <div className="container">
        <h3 className="text-center mb-4">EVERYTHING YOU NEED IN <span className="text-warning">ONE PLATFORM</span></h3>
        <div className="row g-4">
          {cards.map((card, i) => (
            <div className="col-md-3" key={i}>
              <div className="bg-light text-dark rounded shadow-sm p-4 h-100">
                <i className={`bi ${card.icon} text-primary fs-3`}></i>
                <h5 className="mt-3">{card.title}</h5>
                <p className="small">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
