# 📊 Kalee Food Detection Logging Guide

## Overview

The Kalee food detection functions implement comprehensive logging similar to Flaia, enabling you to monitor performance, debug issues, and track costs through Google Cloud Console.

---

## 🗂️ Firestore Collections Created

### **1. `food_prompts` Collection**
**Purpose**: Logs all AI interactions with detailed metrics

**Document Structure**:
```typescript
{
  user_id: string,
  prompt_type: 'food_image_analysis' | 'nutrition_analysis' | 'meal_save',
  session_id?: string,
  user_request: string, // JSON string for easy copy/paste
  prompt_text: string,
  llm_response: string, // JSON string for easy copy/paste
  token_usage: {
    prompt_tokens: number,
    candidates_tokens: number,
    total_tokens: number,
    thinking_tokens?: number,
    image_tokens?: number
  },
  ai_config: {
    model: string,
    temperature: number,
    max_output_tokens: number
  },
  performance: {
    response_time_ms: number,
    success: boolean,
    confidence_score?: number,
    ingredient_count?: number,
    total_calories?: number
  },
  food_metadata?: {
    meal_name?: string,
    meal_type?: string,
    language?: string,
    unit_system?: string,
    image_size_bytes?: number,
    storage_path?: string
  },
  created_at: Timestamp
}
```

### **2. `food_errors` Collection**
**Purpose**: Logs all errors for debugging

**Document Structure**:
```typescript
{
  user_id: string,
  prompt_type: string,
  session_id?: string,
  error_code: string,
  error_message: string,
  user_request: string, // JSON string
  prompt_text?: string,
  performance: {
    response_time_ms: number,
    success: false
  },
  created_at: Timestamp
}
```

### **3. `food_usage_stats` Collection**
**Purpose**: Daily aggregated usage for cost tracking

**Document ID**: `{userId}_{YYYY-MM-DD}`

**Document Structure**:
```typescript
{
  user_id: string,
  date: string, // YYYY-MM-DD
  total_tokens: number,
  prompt_tokens: number,
  completion_tokens: number,
  image_analysis_count: number,
  request_count: number,
  updated_at: Timestamp
}
```

---

## 📈 Monitoring with Google Cloud Console

### **1. View Logs in Cloud Console**

**URL**: `https://console.cloud.google.com/logs/query?project=kalee-prod`

**Useful Log Filters**:

```sql
-- View all food detection function logs
resource.type="cloud_function"
(resource.labels.function_name="analyzeFoodImageFunction" OR
 resource.labels.function_name="analyzeNutritionFunction" OR
 resource.labels.function_name="saveMealEntryFunction")

-- View successful image analyses
resource.type="cloud_function"
resource.labels.function_name="analyzeFoodImageFunction"
jsonPayload.message:"Analysis completed"

-- View nutrition calculation errors
resource.type="cloud_function"
resource.labels.function_name="analyzeNutritionFunction"
severity="ERROR"

-- View high-confidence food detections
resource.type="cloud_function"
jsonPayload.confidence>=0.8

-- View high-calorie meals
resource.type="cloud_function"
jsonPayload.totalCalories>=500
```

### **2. Create Custom Dashboards**

1. Go to [Cloud Monitoring](https://console.cloud.google.com/monitoring/dashboards?project=kalee-prod)
2. Click "Create Dashboard"
3. Add charts for:

#### **Function Performance Chart**
- **Metric**: `cloud_function/execution_time`
- **Filter**: `function_name=~".*Food.*"`
- **Group By**: `function_name`

#### **Token Usage Chart**
- **Metric**: Custom metric from Firestore
- **Query**: Sum of `total_tokens` by day

#### **Error Rate Chart**
- **Metric**: `cloud_function/execution_count`
- **Filter**: `status!=ok`

### **3. Set Up Alerts**

Create alerts for:

#### **High Error Rate Alert**
```yaml
Condition: 
  Resource: Cloud Function
  Metric: cloud_function/execution_count
  Filter: status!=ok AND function_name=~".*Food.*"
  Condition: > 5 errors in 5 minutes

Notification: Email/Slack
```

#### **High Latency Alert**
```yaml
Condition:
  Resource: Cloud Function  
  Metric: cloud_function/execution_time
  Filter: function_name=~".*Food.*"
  Condition: > 10 seconds for 3 consecutive minutes

Notification: Email/Slack
```

#### **High Token Usage Alert**
```yaml
Condition:
  Daily token usage > 100,000 tokens
  (Custom metric from food_usage_stats)
```

---

## 🔍 Debugging with Logs

### **Common Log Patterns**

#### **Successful Image Analysis**
```
[USER_ID] [food_image] [LOG_DOC_ID] Analysis completed
```

#### **Phase Correlation**
```bash
# Find all logs for a specific session
grep "SESSION_ID" /var/log/functions.log

# Trace from image → nutrition → save
grep "food_1701234567890_abc123def" /var/log/functions.log
```

#### **Performance Analysis**
```bash
# Find slow requests (>5s)
grep "duration.*[5-9][0-9][0-9][0-9]ms\|duration.*[1-9][0-9][0-9][0-9][0-9]ms" /var/log/functions.log
```

### **Firestore Query Examples**

#### **Get All Logs for a User**
```javascript
const logs = await db.collection('food_prompts')
  .where('user_id', '==', 'USER_ID')
  .orderBy('created_at', 'desc')
  .limit(100)
  .get();
```

#### **Find High-Token Sessions**
```javascript
const expensiveSessions = await db.collection('food_prompts')
  .where('token_usage.total_tokens', '>', 1000)
  .orderBy('token_usage.total_tokens', 'desc')
  .get();
```

#### **Get Error Statistics**
```javascript
const errors = await db.collection('food_errors')
  .where('created_at', '>=', startOfWeek)
  .get();

const errorsByType = {};
errors.forEach(doc => {
  const errorCode = doc.data().error_code;
  errorsByType[errorCode] = (errorsByType[errorCode] || 0) + 1;
});
```

---

## 💰 Cost Tracking

### **Token Cost Calculation**

```typescript
// Approximate cost calculation (as of 2024)
// Gemini 2.5 Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens

function calculateCost(tokenUsage: any): number {
  const inputCost = (tokenUsage.prompt_tokens / 1_000_000) * 0.075;
  const outputCost = (tokenUsage.candidates_tokens / 1_000_000) * 0.30;
  const imageCost = (tokenUsage.image_tokens || 0 / 1_000_000) * 0.075; // Images count as input
  
  return inputCost + outputCost + imageCost;
}
```

### **Daily Usage Query**
```javascript
const today = new Date().toISOString().split('T')[0];
const dailyStats = await db.collection('food_usage_stats')
  .where('date', '==', today)
  .get();

let totalCost = 0;
dailyStats.forEach(doc => {
  const data = doc.data();
  const estimatedCost = calculateCost({
    prompt_tokens: data.prompt_tokens,
    candidates_tokens: data.completion_tokens,
    image_tokens: data.image_analysis_count * 258 // Estimated image tokens
  });
  totalCost += estimatedCost;
});

console.log(`Today's estimated cost: $${totalCost.toFixed(4)}`);
```

---

## 🚀 Best Practices

### **1. Log Correlation**
- Every AI interaction gets a unique document ID
- Use `session_id` to link Phase 1 → Phase 2 → Save
- Include document IDs in console logs for easy correlation

### **2. Performance Monitoring**
- Track response times for each phase
- Monitor token usage trends
- Set up alerts for unusual patterns

### **3. Error Handling**
- All errors are logged to `food_errors` collection
- Include user context for debugging
- Never let logging failures break the main flow

### **4. Cost Optimization**
- Monitor daily token usage
- Identify users with high usage patterns
- Optimize prompts based on token consumption data

---

## 📊 Sample Queries for Analysis

### **Most Active Users**
```javascript
const activeUsers = await db.collection('food_usage_stats')
  .where('date', '>=', '2024-01-01')
  .orderBy('request_count', 'desc')
  .limit(10)
  .get();
```

### **Average Confidence by Meal Type**
```javascript
const confidenceByMealType = await db.collection('food_prompts')
  .where('prompt_type', '==', 'food_image_analysis')
  .where('performance.confidence_score', '>', 0)
  .get();

const stats = {};
confidenceByMealType.forEach(doc => {
  const mealType = doc.data().food_metadata?.meal_type || 'unknown';
  const confidence = doc.data().performance.confidence_score;
  
  if (!stats[mealType]) stats[mealType] = [];
  stats[mealType].push(confidence);
});

// Calculate averages
Object.keys(stats).forEach(mealType => {
  const avg = stats[mealType].reduce((a, b) => a + b) / stats[mealType].length;
  console.log(`${mealType}: ${avg.toFixed(3)} avg confidence`);
});
```

This comprehensive logging system provides the same level of observability as Flaia, enabling you to monitor, debug, and optimize your food detection functions effectively.