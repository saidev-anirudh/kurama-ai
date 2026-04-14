export const profile = {
  name: "Sai Dev Anirudh Thatode",
  email: "sai44dev44@gmail.com",
  phone: "+91 9611245205",
  location: "Pune, India",
  summary:
    "Voice AI Lead building production-grade voicebots, RAG systems, and multi-agent platforms across airports, BFSI, and marketing use cases.",
  highlights: [
    "Led a 6-member Voice AI team with 95% on-time delivery",
    "Reduced average response time by 3.8s and improved call containment by 30%",
    "Engineered high-concurrency ARI flows sustaining 8 calls/sec under peak traffic",
    "Built multi-RAG orchestration (GraphRAG and Agentic RAG) improving first-query resolution by 25%",
  ],
  skills: [
    "Python",
    "Go",
    "FastAPI",
    "LangGraph",
    "LangChain",
    "Asterisk/ARI",
    "Docker",
    "Kubernetes",
    "Redis",
    "PostgreSQL",
    "Qdrant",
    "RabbitMQ",
  ],
};

export const experiences = [
  {
    company: "Chat360",
    role: "Voice AI Lead",
    period: "Jun 2025 - Present",
    impact:
      "Owned end-to-end voice AI delivery and improved latency, containment, and release reliability for enterprise voice workloads.",
  },
  {
    company: "NYX AI",
    role: "AI/ML Engineer",
    period: "Sep 2024 - May 2025",
    impact:
      "Built agentic RAG and analytics systems with async services supporting high-throughput campaign intelligence.",
  },
  {
    company: "Genpact",
    role: "Graduate Data Scientist",
    period: "Feb 2024 - Aug 2024",
    impact:
      "Enhanced loan detection and document-query pipelines with enterprise NLP and retrieval architectures.",
  },
];

export const projects = [
  {
    name: "Agentic Cold Email Generator",
    stack: "Python, Selenium, CrewAI, LangChain",
    details:
      "Multi-agent workflow for matching job descriptions to resume context and generating personalized recruiter outreach.",
  },
  {
    name: "Agentic Model Visualization System",
    stack: "LangGraph, MCP, Plotly, FastAPI, MLflow, Docker",
    details:
      "Parallel agent orchestration for code and model introspection with interactive visualization and traceability.",
  },
];

export const blogs = [
  {
    title: "From IVR to Agentic Voice Systems",
    description: "Design patterns for resilient telephony-to-LLM pipelines with barge-in and multilingual support.",
  },
  {
    title: "GraphRAG vs Agentic RAG in Production",
    description: "How to choose retrieval strategy by intent and workload profile.",
  },
  {
    title: "Latency Budgets for Conversational AI",
    description: "Practical levers to reduce perceived and actual response latency in voice products.",
  },
];
