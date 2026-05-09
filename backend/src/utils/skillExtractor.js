/**
 * Smart Skill Extraction Utility
 * Extracts skills from resume text using keyword matching
 * Supports 100+ technical and non-technical skills
 */

export const SKILL_CATEGORIES = {
  frontend: [
    "react",
    "vue.js",
    "vue",
    "angular",
    "svelte",
    "html",
    "css",
    "tailwind",
    "bootstrap",
    "material-ui",
    "figma",
    "webpack",
    "babel",
    "npm",
    "yarn"
  ],
  
  backend: [
    "node.js",
    "node",
    "express",
    "django",
    "flask",
    "fastapi",
    "spring",
    "spring boot",
    "java",
    "python",
    "php",
    "laravel",
    "ruby",
    "rails",
    "golang",
    "go",
    ".net",
    "c#",
    "asp.net"
  ],

  database: [
    "postgresql",
    "postgres",
    "mysql",
    "mongodb",
    "redis",
    "elasticsearch",
    "firebase",
    "dynamodb",
    "cassandra",
    "sql",
    "nosql",
    "graphql",
    "prisma",
    "typeorm"
  ],

  devops: [
    "docker",
    "kubernetes",
    "k8s",
    "jenkins",
    "github actions",
    "gitlab ci",
    "circleci",
    "travisci",
    "terraform",
    "ansible",
    "aws",
    "azure",
    "gcp",
    "heroku",
    "netlify",
    "vercel"
  ],

  languages: [
    "javascript",
    "typescript",
    "java",
    "python",
    "c++",
    "c#",
    "golang",
    "rust",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "r",
    "scala",
    "perl",
    "bash",
    "shell"
  ],

  aiml: [
    "machine learning",
    "deep learning",
    "tensorflow",
    "pytorch",
    "scikit-learn",
    "keras",
    "nlp",
    "computer vision",
    "cv",
    "openai",
    "gpt",
    "llm",
    "neural network",
    "regression",
    "classification",
    "clustering"
  ],

  other: [
    "git",
    "agile",
    "scrum",
    "jira",
    "rest api",
    "restful",
    "microservices",
    "design patterns",
    "solid",
    "testing",
    "tdd",
    "bdd",
    "unit testing",
    "integration testing",
    "e2e testing",
    "api testing",
    "performance tuning",
    "security",
    "oauth",
    "jwt",
    "authentication",
    "authorization"
  ]
};

/**
 * Flatten skill categories into single array
 */
const getAllSkills = () => {
  return Object.values(SKILL_CATEGORIES).flat();
};

/**
 * Extract skills from text
 * @param {string} text - Resume/profile text
 * @param {number} minLength - Minimum word length to match
 * @returns {Array<string>} - Extracted unique skills
 */
export const extractSkillsFromText = (text = "", minLength = 2) => {
  if (!text || typeof text !== "string") return [];

  const normalizedText = text.toLowerCase();
  const allSkills = getAllSkills();

  // Extract skills - handle multi-word skills first, then single words
  const extractedSkills = [];

  // Sort by length descending to match longer phrases first
  const sortedSkills = [...allSkills].sort((a, b) => b.length - a.length);

  for (const skill of sortedSkills) {
    // Use word boundaries for more accurate matching
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    if (regex.test(normalizedText)) {
      extractedSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  }

  // Remove duplicates and filter by length
  const uniqueSkills = [...new Set(extractedSkills)].filter(
    (skill) => skill.length >= minLength
  );

  return uniqueSkills;
};

/**
 * Extract skills by category
 * @param {string} text - Resume text
 * @returns {Object} - Skills grouped by category
 */
export const extractSkillsByCategory = (text = "") => {
  if (!text || typeof text !== "string") return {};

  const normalizedText = text.toLowerCase();
  const result = {};

  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    const foundSkills = [];

    for (const skill of skills) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      if (regex.test(normalizedText)) {
        foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    }

    if (foundSkills.length > 0) {
      result[category] = [...new Set(foundSkills)]; // Remove duplicates
    }
  }

  return result;
};

/**
 * Get skill recommendations based on existing skills
 * Uses co-occurrence patterns
 */
export const getSkillRecommendations = (existingSkills = []) => {
  const skillRelations = {
    "React": ["Node.js", "JavaScript", "TypeScript", "Redux", "REST API"],
    "Node.js": ["Express", "MongoDB", "PostgreSQL", "JavaScript", "REST API"],
    "Python": ["Django", "Flask", "Machine Learning", "Data Analysis", "FastAPI"],
    "Java": ["Spring Boot", "Spring", "PostgreSQL", "Microservices", "REST API"],
    "Docker": ["Kubernetes", "DevOps", "AWS", "CI/CD", "Jenkins"],
    "Machine Learning": ["TensorFlow", "PyTorch", "Python", "Data Analysis", "NLP"],
    "AWS": ["Docker", "Kubernetes", "DevOps", "Lambda", "RDS"],
    "TypeScript": ["React", "Node.js", "Angular", "NestJS", "GraphQL"]
  };

  const normalized = existingSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
  const recommendations = new Set();

  for (const skill of normalized) {
    if (skillRelations[skill]) {
      skillRelations[skill].forEach((rec) => {
        if (!normalized.includes(rec)) {
          recommendations.add(rec);
        }
      });
    }
  }

  return Array.from(recommendations);
};

/**
 * Score resume quality
 * @param {string} text - Resume text
 * @returns {Object} - Quality score and feedback
 */
export const scoreResumeQuality = (text = "") => {
  if (!text) return { score: 0, feedback: "Resume is empty" };

  const skills = extractSkillsFromText(text);
  const skillScores = {
    technical: skills.filter(
      (s) => SKILL_CATEGORIES.languages.some((lang) => lang.includes(s.toLowerCase()))
    ).length,
    framework: skills.filter(
      (s) => SKILL_CATEGORIES.frontend.some((fw) => fw.includes(s.toLowerCase())) ||
             SKILL_CATEGORIES.backend.some((bw) => bw.includes(s.toLowerCase()))
    ).length,
    devops: skills.filter(
      (s) => SKILL_CATEGORIES.devops.some((dv) => dv.includes(s.toLowerCase()))
    ).length
  };

  let score = 0;
  const feedback = [];

  // Language skills: 40 points
  if (skillScores.technical >= 2) {
    score += 40;
  } else if (skillScores.technical === 1) {
    score += 20;
    feedback.push("Add more programming languages");
  } else {
    feedback.push("No programming languages found");
  }

  // Framework/library skills: 40 points
  if (skillScores.framework >= 3) {
    score += 40;
  } else if (skillScores.framework >= 1) {
    score += 20;
    feedback.push("Add more frameworks and libraries");
  } else {
    feedback.push("No frameworks or libraries found");
  }

  // DevOps/tools: 20 points
  if (skillScores.devops >= 2) {
    score += 20;
  } else if (skillScores.devops === 1) {
    score += 10;
  } else {
    feedback.push("Consider adding DevOps skills (Docker, Kubernetes, AWS)");
  }

  return {
    score: Math.min(100, score),
    skillCount: skills.length,
    skillBreakdown: skillScores,
    feedback: feedback.length > 0 ? feedback : ["Great resume! Well rounded skill set."]
  };
};

export default {
  SKILL_CATEGORIES,
  extractSkillsFromText,
  extractSkillsByCategory,
  getSkillRecommendations,
  scoreResumeQuality
};
