export const LEGAL_POLICIES = {
  privacy: {
    path: "/privacy-policy",
    title: "Privacy Policy",
    navLabel: "Privacy Policy",
    description: "How TradeTrack Pro handles account and trading data.",
    updated: "April 21, 2026",
    sections: [
      {
        heading: "Privacy Policy",
        paragraphs: [
          "We collect account and trading data to provide the service. Data is stored securely and not sold.",
        ],
      },
    ],
  },
  terms: {
    path: "/terms",
    title: "Terms & Conditions",
    navLabel: "Terms",
    description: "The basic terms for using TradeTrack Pro.",
    updated: "April 21, 2026",
    sections: [
      {
        heading: "Terms & Conditions",
        paragraphs: [
          "Users must use the app lawfully. We do not guarantee uptime or profits.",
        ],
      },
    ],
  },
  cookies: {
    path: "/cookies",
    title: "Cookie Policy",
    navLabel: "Cookies",
    description: "How cookies support sessions and product experience.",
    updated: "April 21, 2026",
    sections: [
      {
        heading: "Cookie Policy",
        paragraphs: [
          "We use cookies for login sessions and improving user experience.",
        ],
      },
    ],
  },
  riskDisclaimer: {
    path: "/risk-disclaimer",
    title: "Risk Disclaimer",
    navLabel: "Risk Disclaimer",
    description: "Important trading risk information.",
    updated: "April 21, 2026",
    sections: [
      {
        heading: "Risk Disclaimer",
        paragraphs: [
          "Trading involves risk. This app does not provide financial advice.",
        ],
      },
    ],
  },
  contact: {
    path: "/contact",
    title: "Contact / Support",
    navLabel: "Contact",
    description: "How to contact TradeTrack Pro support.",
    updated: "April 21, 2026",
    contactEmail: "your@email.com",
    sections: [
      {
        heading: "Contact / Support",
        paragraphs: ["Contact: your@email.com"],
      },
    ],
  },
};

export const LEGAL_POLICY_ROUTES = Object.entries(LEGAL_POLICIES).map(
  ([policyKey, policy]) => ({
    policyKey,
    path: policy.path,
  })
);

export const LEGAL_POLICY_LINKS = Object.values(LEGAL_POLICIES).map((policy) => ({
  label: policy.navLabel,
  title: policy.title,
  path: policy.path,
  description: policy.description,
}));
