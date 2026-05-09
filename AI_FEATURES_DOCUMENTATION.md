# Campus Placement Portal - AI Features Documentation

## Overview

This document describes the production-level AI features added to the Campus Placement Portal:

1. **AI Job Matching System** - Intelligent job-candidate matching
2. **Resume Parser** - Automatic skill extraction from PDFs
3. **Smart Skill Extraction** - Keyword-based skill identification
4. **Dashboard Analytics** - Comprehensive placement insights
5. **Recommendation Tags** - Smart job recommendations with tags

---

## 🚀 Feature 1: AI Job Matching System

### Architecture

**Weights:** 50-20-20-10 formula
- Skills Match: 50% (0-50 points)
- CGPA Score: 20% (0-20 points)
- Experience: 20% (0-20 points)
- Preferences: 10% (0-10 points)
- **Total: 0-100 points**

### Key Files

- `backend/src/utils/matchingEngine.js` - Core matching algorithm
- `backend/src/controllers/matchingController.js` - API logic
- `backend/src/routes/matchingRoutes.js` - Endpoints
- `backend/src/services/matchingService.js` - Service layer

### API Endpoints

#### For Students

```bash
# Get personalized job recommendations (top 10 with best matches)
GET /api/matching/recommendations
Authorization: Bearer <student_token>

Response:
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": 1,
        "title": "Senior React Developer",
        "company": "TechCorp",
        "matchScore": 92,
        "recommendationTags": [
          { "tag": "Best Match", "color": "green" },
          { "tag": "Trending Skills", "color": "purple" }
        ],
        "scoreDetails": {
          "skillScore": 48,
          "cgpaScore": 20,
          "experienceScore": 18,
          "preferenceScore": 8
        },
        "whyRecommended": "Your skills match 96% of requirements. Your CGPA exceeds minimum..."
      }
    ]
  }
}
```

#### For Recruiters

```bash
# Get matched candidates for a job (ranked by score)
GET /api/matching/candidates/:jobId
Authorization: Bearer <recruiter_token>

Response contains ranked candidates with match scores and breakdown.
```

### Recommendation Tags

The system generates contextual tags:

- **Best Match** - Score >= 75%
- **High Salary** - If salary > 10 LPA
- **Trending Skills** - React, Node.js, Python, ML, Cloud, Kubernetes
- **Growth Opportunity** - Low CGPA requirement, 0-1 years experience

### Score Calculation Examples

**Example 1: Perfect Candidate**
```
Skills Match: All required skills present = 50/50
CGPA Score: 8.5 vs 7.0 min = 20/20
Experience: 2 years vs 2 required = 20/20
Preferences: Location + role match = 10/10
TOTAL: 100% (Best Match)
```

**Example 2: Growth Candidate**
```
Skills Match: 70% of requirements = 35/50
CGPA Score: 6.8 vs 7.0 min = 16/20
Experience: 0.5 years vs 0 required = 15/20
Preferences: No match = 0/10
TOTAL: 66% (Fair Match, Growth Opportunity)
```

---

## 📄 Feature 2: Resume Parser

### Features

- **PDF Parsing** - Extract text from PDF resumes
- **Skill Extraction** - 100+ technical skills recognized
- **Quality Scoring** - Resume evaluation (0-100)
- **Recommendations** - Suggest skills to learn
- **Category Analysis** - Skills grouped by type

### Supported Skill Categories

- Frontend: React, Vue, Angular, HTML, CSS, Tailwind
- Backend: Node.js, Express, Django, Flask, Spring, Java, Python
- Database: PostgreSQL, MongoDB, Redis, Elasticsearch
- DevOps: Docker, Kubernetes, AWS, Azure, GCP, Jenkins
- Languages: JavaScript, Python, Java, C++, Go, Rust
- AI/ML: Machine Learning, TensorFlow, PyTorch, NLP, CV
- Other: Git, Agile, Scrum, REST API, Microservices

### API Endpoints

```bash
# Upload and parse resume
POST /api/resume/upload
Content-Type: multipart/form-data
Authorization: Bearer <student_token>

Parameters:
- resume: PDF file (max 5MB)

Response:
{
  "success": true,
  "data": {
    "profile": { ...updated student profile... },
    "extractedSkills": ["React", "Node.js", "PostgreSQL"],
    "skillsByCategory": {
      "frontend": ["React", "Tailwind"],
      "backend": ["Node.js", "Express"],
      "database": ["PostgreSQL"]
    },
    "resumeQuality": {
      "score": 78,
      "skillCount": 12,
      "skillBreakdown": {
        "technical": 3,
        "framework": 4,
        "devops": 2
      },
      "feedback": ["Add more DevOps skills"]
    },
    "skillRecommendations": ["Docker", "AWS"]
  }
}
```

```bash
# Get resume analysis
GET /api/resume/analysis
Authorization: Bearer <student_token>

# Get skill recommendations
GET /api/resume/recommendations
Authorization: Bearer <student_token>

# Delete resume
DELETE /api/resume
Authorization: Bearer <student_token>
```

### Resume Quality Scoring

- **40 pts** - Programming languages (min 2)
- **40 pts** - Frameworks/libraries (min 3)
- **20 pts** - DevOps/tools (min 2)

---

## 🧠 Feature 3: Smart Skill Extraction

### Implementation

File: `backend/src/utils/skillExtractor.js`

### Functions

```javascript
// Extract skills from text
extractSkillsFromText(text, minLength=2) 
// Returns: ["React", "Node.js", ...]

// Extract skills by category
extractSkillsByCategory(text) 
// Returns: { frontend: [...], backend: [...], ... }

// Get skill recommendations
getSkillRecommendations(existingSkills)
// Returns recommended skills based on co-occurrence patterns

// Score resume quality
scoreResumeQuality(text)
// Returns: { score, feedback, skillBreakdown }
```

### Skill Relations (for recommendations)

```
React → Node.js, JavaScript, TypeScript, Redux
Python → Django, Flask, Machine Learning, Data Analysis
Docker → Kubernetes, AWS, CI/CD
Machine Learning → TensorFlow, PyTorch, Python
```

---

## 📊 Feature 4: Dashboard Analytics

### API Endpoints

```bash
# Main overview
GET /api/analytics/overview
Role: TPO

Response: {
  "total_applications": 150,
  "selected_students": 45,
  "active_jobs": 20,
  "placement_percentage": 30,
  "pipeline": [...],
  "matchScoreDistribution": {...},
  "cgpaAnalysis": [...],
  "trendingJobs": [...]
}
```

```bash
# Match score analysis
GET /api/analytics/match-score
Role: TPO, Faculty

# CGPA vs Placement correlation
GET /api/analytics/cgpa-placement
Role: TPO, Faculty

# Skill demand vs student skills
GET /api/analytics/skills
Role: TPO, Faculty
```

### Chart Data

**Match Score Distribution**
```
Distribution: 0-50, 50-60, 60-70, 70-80, 80-90, 90-100
Shows candidate strength across score ranges
```

**CGPA Analysis**
```
Ranges: 0-5.5, 5.5-6.5, 6.5-7.5, 7.5-8.5, 8.5-10
Shows placement rate per CGPA bracket
```

**Skills Demand**
```
Top 10 in-demand skills from job postings
vs. Top 10 skills students have
Identify skill gaps
```

---

## 🎯 Feature 5: Recommendation Tags

### Tag Types

| Tag | Condition | Visual |
|-----|-----------|--------|
| Best Match | Score >= 75% | Green |
| High Salary | Salary > 10 LPA | Blue |
| Trending Skills | React, Python, ML, Cloud | Purple |
| Growth Opportunity | Low CGPA requirement | Orange |

### Example Response

```json
{
  "job": {
    "title": "Senior React Developer",
    "matchScore": 85,
    "recommendationTags": [
      { "tag": "Best Match", "color": "green", "priority": 1 },
      { "tag": "Trending Skills", "color": "purple", "priority": 3 }
    ]
  }
}
```

---

## 🔧 Integration Guide

### 1. Add Routes to app.js

```javascript
import resumeRoutes from "./routes/resumeRoutes.js";
import matchingRoutes from "./routes/matchingRoutes.js";

app.use("/api/resume", resumeRoutes);
app.use("/api/matching", matchingRoutes);
```

### 2. Create Frontend Components

```javascript
// For students - Recommended jobs
import RecommendedJobs from './components/dashboard/RecommendedJobs.jsx';

// For students - Resume upload
import ResumeUpload from './components/profile/ResumeUpload.jsx';

// For TPO/Faculty - Analytics
import AnalyticsDashboard from './components/dashboard/AnalyticsDashboard.jsx';
```

### 3. Update Student Dashboard

```javascript
<div className="space-y-6">
  <ResumeUpload />
  <RecommendedJobs />
  <StudentJobMatches />
</div>
```

### 4. Update TPO Dashboard

```javascript
<div className="space-y-6">
  <AnalyticsDashboard />
  <PlacementStats />
</div>
```

---

## 🧪 Testing

### Manual Testing with Postman

#### 1. Test Student Matching

```bash
GET /api/matching/recommendations
Authorization: Bearer <student_token>

Expected: Top 10 jobs with match scores >= 70
```

#### 2. Test Resume Upload

```bash
POST /api/resume/upload
Form Data: resume (PDF file)
Authorization: Bearer <student_token>

Expected: Extracted skills, quality score, recommendations
```

#### 3. Test Analytics

```bash
GET /api/analytics/overview
Authorization: Bearer <tpo_token>

Expected: Placement statistics, pipeline breakdown
```

### Edge Cases

**No Skills Matched**
- Resume with no recognized skills
- Should return quality score with feedback

**Low CGPA**
- Student with CGPA < minimum requirement
- Should show as "Fair Match" with "Growth Opportunity" tag

**Empty Student Profile**
- Student with no skills/projects
- Should return recommendations with message to complete profile

---

## 📈 Performance Optimization

### Database Queries

- Used indexed joins on (user_id, job_id)
- Aggregated queries for analytics
- Pagination for large result sets (LIMIT 20)

### Frontend Caching

```javascript
const cache = new Map();

const fetchRecommendations = async () => {
  if (cache.has('recommendations')) {
    return cache.get('recommendations');
  }
  const data = await fetch(...);
  cache.set('recommendations', data);
  return data;
};
```

---

## 🔒 Security

### Role-Based Access Control

- **Students**: Can only view own matches
- **Recruiters**: Can only view candidates for own jobs
- **TPO/Faculty**: Full analytics access

### File Upload Validation

- Only PDF files accepted
- Max file size: 5MB
- Sanitized file names

### Sensitive Data Masking

```javascript
// Student names/emails masked for recruiters
// Unless application status is "shortlisted" or higher
maskValue(email); // "sa***@gmail.com"
```

---

## 🚀 Future Enhancements

1. **OpenAI Integration**
   - Use GPT for better skill extraction
   - Generate personalized feedback

2. **Machine Learning Model**
   - Train model on historical data
   - Predict placement likelihood

3. **Real-time Notifications**
   - Alert students of new matching jobs
   - Alert recruiters of new qualified candidates

4. **Video Resume**
   - Support video resume upload
   - AI analysis of video content

5. **Peer Benchmarking**
   - Compare student with similar profiles
   - Show percentile ranking

---

## 📝 Troubleshooting

### Issue: Resume Upload Fails

**Solution**: Check file size (< 5MB) and format (PDF only)

### Issue: No Recommendations

**Solution**: Complete student profile, upload resume with skills

### Issue: Empty Analytics

**Solution**: Ensure applications exist in database

---

## 📚 References

- Matching Algorithm: weighted scoring system
- Skill Database: 100+ recognized technical skills
- Analytics: PostgreSQL aggregation queries
- Frontend: React components with Tailwind CSS

---

**Last Updated**: April 2026
**Version**: 1.0
