// Exemple de structure de l'agent (basé sur ton Prisma)
type AgentCheck = {
  agencyId: string | null;
  photo: string | null;
  phone: string | null;
  // Ajoute d'autres champs si besoin
};

export const getAgentHealthIssues = (agent: AgentCheck) => {
  const issues = [];

  // Règle 1 : L'agence est-elle assignée ?
  if (!agent.agencyId) {
    issues.push("Sélectionner une agence de rattachement");
  }

  // Règle 2 : La photo est-elle présente ? (Exemple)
  if (!agent.photo) {
    issues.push("Ajouter une photo de profil");
  }

  // Règle 3 : Le téléphone est-il renseigné ?
  if (!agent.phone) {
    issues.push("Renseigner le numéro de téléphone");
  }

  return issues;
};
