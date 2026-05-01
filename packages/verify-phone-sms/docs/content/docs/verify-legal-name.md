---
title: Identity Verification API Demo
---

A comprehensive identity verification system that uses TrestleIQ APIs to validate phone numbers, addresses, and generate knowledge-based authentication questions.

## 🚀 Quick Start

### Prerequisites
- Node.js or Bun runtime
- TrestleIQ API key

### Installation
```bash
# Install dependencies
npm install hono @hono/zod-openapi zod
# or
bun add hono @hono/zod-openapi zod

# Set your TrestleIQ API key
export TRESTLE_API_KEY=your_api_key_here

# Run the server
bun run server.js
# or
node server.js
```

### Server Endpoints
- 🏠 `http://localhost:3000` - Server root
- 📊 `http://localhost:3000/health` - Health check
- 📚 `http://localhost:3000/swagger` - Interactive API documentation
- 🔍 `http://localhost:3000/doc` - OpenAPI specification
- 🎮 `http://localhost:3000/demo` - Live demo with sample data
- ✅ `POST http://localhost:3000/verify-identity` - Main verification endpoint

## 🎯 How It Works

### The Verification Process

1. **Input Collection**: Accept phone number, legal name, and current address
2. **Multi-API Lookup**: Query TrestleIQ APIs in parallel for comprehensive data
3. **Historical Analysis**: Extract previous addresses, phone numbers, and associated names
4. **Scoring Algorithm**: Calculate confidence score (0-100) based on data matches
5. **Question Generation**: Create knowledge-based questions from historical data
6. **Recommendations**: Provide actionable next steps based on verification results

### Scoring System (100 Points Total)

| Category | Max Points | Criteria |
|----------|------------|----------|
| **Phone Validation** | 30 | Valid number (15 pts) + Line type (10 pts) + Non-commercial (5 pts) |
| **Name Matching** | 40 | Exact match (40 pts) or Partial match (20 pts) |
| **Address Validation** | 30 | Valid address (15 pts) + Active delivery (10 pts) + Residential (5 pts) |

### Score Interpretation
- **🔴 0-29**: High risk - Request additional ID documents
- **🟡 30-59**: Medium risk - Manual review recommended  
- **🟢 60-79**: Low risk - Standard verification process
- **✅ 80-100**: Very low risk - High confidence verification

## 📝 API Usage Examples

### Sample Request
```bash
curl -X POST http://localhost:3000/verify-identity \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "2069735100",
    "legal_name": "John Smith", 
    "current_address": {
      "street_line_1": "123 Main St",
      "city": "Seattle",
      "state_code": "WA", 
      "postal_code": "98101",
      "country_code": "US"
    }
  }'
```

### Sample Response
```json
{
  "verification_score": 75,
  "name_match_found": true,
  "phone_validated": true,
  "address_validated": true,
  "questions": [
    {
      "id": "addr_1703123456789",
      "question": "Which of the following addresses have you lived at in the past?",
      "type": "address_history",
      "options": [
        "456 Oak Ave, Seattle, WA",
        "789 Pine St, Tacoma, WA", 
        "123 Fake St, Nowhere, CA",
        "101 False Blvd, Bogus, NY",
        "202 Phony Way, Unreal, WA"
      ]
    },
    {
      "id": "phone_1703123456790",
      "question": "Which of the following phone numbers have you previously used?", 
      "type": "phone_history",
      "options": [
        "2065551234",
        "4255559876",
        "5551234567",
        "8889876543",
        "None of the above"
      ]
    },
    {
      "id": "name_1703123456791",
      "question": "Are any of the following names associated with you (maiden name, nickname, etc.)?",
      "type": "name_verification", 
      "options": [
        "J. Smith",
        "Johnny Smith",
        "John S. Smith",
        "Jon Smith",
        "None of the above"
      ]
    }
  ],
  "historical_data": {
    "previous_addresses": [
      "456 Oak Ave, Seattle, WA",
      "789 Pine St, Tacoma, WA",
      "321 Cedar Ln, Bellevue, WA"
    ],
    "previous_phones": [
      "2065551234", 
      "4255559876"
    ],
    "associated_names": [
      "J. Smith",
      "Johnny Smith", 
      "John S. Smith"
    ]
  },
  "recommendations": [
    "Proceed with standard verification process",
    "Consider asking verification questions to increase confidence"
  ]
}
```

## 🧠 Smart Features

### Dynamic Question Generation
The system intelligently creates multiple-choice questions by:
- **Mixing real historical data** with plausible decoy options
- **Randomizing question order** to prevent pattern recognition
- **Balancing difficulty** - not too easy, not impossible
- **Including safety options** like "None of the above"

### Historical Data Analysis
Extracts comprehensive historical information:
- **Previous addresses** from phone and person records
- **Associated phone numbers** across different time periods  
- **Name variations** including nicknames, initials, and maiden names
- **Cross-references data** across multiple API sources for accuracy

### Risk-Based Recommendations
Provides actionable recommendations based on verification results:
- **Document requests** for low-scoring verifications
- **VOIP warnings** for non-fixed internet phone numbers
- **Manual review triggers** for medium-confidence scores
- **Approval suggestions** for high-confidence verifications

## 🔧 Advanced Configuration

### Environment Variables
```bash
TRESTLE_API_KEY=your_trestle_api_key    # Required: TrestleIQ API key
PORT=3000                               # Optional: Server port (default: 3000)
```

### Custom Scoring Weights
You can modify the scoring algorithm by adjusting the point values in the `calculateVerificationScore` function:

```javascript
// Phone validation scoring
if (phoneResult?.is_valid) {
  score += 15  // Base validation points
  if (phoneResult.line_type === 'Mobile' || phoneResult.line_type === 'Landline') {
    score += 10  // Reliable line type bonus  
  }
  if (!phoneResult.is_commercial) {
    score += 5   // Residential number bonus
  }
}
```

### Question Customization
Modify question generation in `generateVerificationQuestions`:
- Adjust number of real vs. fake options
- Change question phrasing
- Add new question types
- Customize difficulty levels

## 🎮 Try the Demo

Visit `http://localhost:3000/demo` to see a live example with sample data, or use the interactive Swagger UI at `http://localhost:3000/swagger` to test with your own data.

### Demo Scenarios

#### High Confidence Scenario (Score: 85+)
```json
{
  "phone_number": "2069735100",
  "legal_name": "Waidong L Syrws", 
  "current_address": {
    "street_line_1": "100 Syrws St",
    "city": "Lynden", 
    "state_code": "WA",
    "postal_code": "98264"
  }
}
```

#### Medium Confidence Scenario (Score: 50-70)  
```json
{
  "phone_number": "5551234567",
  "legal_name": "Jane Doe",
  "current_address": {
    "street_line_1": "789 Unknown Ave", 
    "city": "Somewhere",
    "state_code": "CA",
    "postal_code": "90210" 
  }
}
```

#### Low Confidence Scenario (Score: 20-40)
```json
{
  "phone_number": "1234567890", 
  "legal_name": "Fake Person",
  "current_address": {
    "street_line_1": "123 Nonexistent St",
    "city": "Nowhere", 
    "state_code": "XX",
    "postal_code": "00000"
  }
}
```

## 🛡️ Security & Privacy

- **No data storage**: All verification data is processed in-memory only
- **API key protection**: TrestleIQ API key stored securely in environment variables  
- **CORS enabled**: Configurable cross-origin request handling
- **Error handling**: Comprehensive error handling without data leakage
- **Rate limiting**: Inherits TrestleIQ API rate limits for responsible usage

## 🔗 Integration Examples

### React Frontend Integration
```javascript
const verifyIdentity = async (personData) => {
  const response = await fetch('/verify-identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(personData)
  })
  return response.json()
}

// Usage
const result = await verifyIdentity({
  phone_number: "2069735100",
  legal_name: "John Smith",
  current_address: { /* address data */ }
})

if (result.verification_score >= 80) {
  // High confidence - proceed with onboarding
} else if (result.questions.length > 0) {
  // Show verification questions
} else {
  // Request additional documentation
}
```

### Node.js Backend Integration
```javascript
import { verifyIdentity } from './verification-functions.js'

app.post('/onboard-user', async (req, res) => {
  try {
    const verification = await verifyIdentity(req.body, process.env.TRESTLE_API_KEY)
    
    // Store verification result
    await db.users.update(req.body.userId, {
      verification_score: verification.verification_score,
      verification_status: verification.verification_score >= 70 ? 'approved' : 'pending',
      questions: verification.questions
    })
    
    res.json(verification)
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' })
  }
})
```

## 📊 API Response Details

### Verification Questions Types
- **`address_history`**: Multiple choice questions about previous addresses
- **`phone_history`**: Questions about previously used phone numbers  
- **`name_verification`**: Questions about name variations and associations

### Recommendation Categories
- **Identity Documents**: When additional ID verification is needed
- **Manual Review**: When human verification should be considered
- **Technical Warnings**: VOIP numbers, invalid addresses, etc.
- **Process Guidance**: Next steps based on confidence level

## 🤝 Contributing

This demo showcases the core functionality. For production use, consider:
- Adding database persistence for verification results
- Implementing user authentication and session management
- Adding webhook support for async verification workflows  
- Enhancing question complexity and variety
- Adding support for international phone numbers and addresses

## 📞 Support

For TrestleIQ API questions, visit [TrestleIQ Documentation](https://api.trestleiq.com)
For implementation questions, check the inline code comments and Swagger documentation.

---

**Ready to verify identities?** Start the server and visit the demo endpoint! 🎯