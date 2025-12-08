# API Update Requirements: Firm Dashboard Date Range Controls

## Overview
This document outlines the API requirements for the configurable date-range controls added to the Firm Admin Overview Dashboard.

---

## Current API Endpoint

**Endpoint:** `GET /user/firm-admin/dashboard/`

**Base URL:** `{API_BASE_URL}/user/firm-admin/dashboard/`

**Authentication:** Bearer Token (JWT) required

---

## Request Parameters

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|----------|-------------|
| `date_range` | string | No | `30d` | Date range filter for analytics data |
| `period` | string | No | `monthly` | Aggregation period for data |
| `recent_clients_limit` | integer | No | `10` | Number of recent clients to return |

### Date Range Values

The frontend sends the following `date_range` values:

| Frontend Display | API Value | Description |
|-----------------|----------|-------------|
| "Last 7 days" | `7d` | Last 7 days from current date |
| "Last 30 days" | `30d` | Last 30 days from current date |
| "Last 90 days" | `90d` | Last 90 days from current date |
| "Last 6 months" | `6m` | Last 6 months from current date |
| "Last year" | `1y` | Last 12 months from current date |

### Period Values

| Value | Description |
|-------|-------------|
| `monthly` | Aggregate data by month |
| `weekly` | Aggregate data by week (if supported) |
| `daily` | Aggregate data by day (if supported) |

---

## Example API Requests

### Request 1: Last 30 Days (Default)
```http
GET /user/firm-admin/dashboard/?date_range=30d&period=monthly&recent_clients_limit=10
Authorization: Bearer {access_token}
```

### Request 2: Last 7 Days
```http
GET /user/firm-admin/dashboard/?date_range=7d&period=monthly&recent_clients_limit=10
Authorization: Bearer {access_token}
```

### Request 3: Last 6 Months
```http
GET /user/firm-admin/dashboard/?date_range=6m&period=monthly&recent_clients_limit=10
Authorization: Bearer {access_token}
```

### Request 4: Last Year
```http
GET /user/firm-admin/dashboard/?date_range=1y&period=monthly&recent_clients_limit=10
Authorization: Bearer {access_token}
```

---

## Expected Response Structure

The API should return a JSON response with the following structure:

```json
{
  "success": true,
  "data": {
    "key_metrics": {
      "revenue": {
        "current": 125000,
        "formatted": "$125,000",
        "target": 150000,
        "percentage_change": 8.5,
        "change_type": "increase",
        "breakdown": {
          "prep_fees": 95000,
          "add_ons": 20000,
          "training": 10000
        }
      },
      "clients": {
        "current": 245,
        "target": 300,
        "percentage_change": 12,
        "change_type": "increase"
      },
      "tasks": {
        "current": 180,
        "target": 200,
        "percentage_change": -5,
        "change_type": "decrease",
        "breakdown": {
          "tax_prep": 120,
          "review": 40,
          "followups": 20
        }
      },
      "documents": {
        "current": 450
      }
    },
    "revenue_analytics": {
      "trend": {
        "data": [
          {
            "month": "Jan",
            "revenue": 95000,
            "target": 100000
          },
          {
            "month": "Feb",
            "revenue": 110000,
            "target": 100000
          }
        ]
      },
      "breakdown": {
        "data": [
          {
            "category": "Tax Preparation",
            "amount": 95000
          },
          {
            "category": "Add-ons",
            "amount": 20000
          },
          {
            "category": "Training",
            "amount": 10000
          }
        ]
      }
    },
    "client_engagement": {
      "funnel": [
        {
          "stage": "Leads",
          "value": 500,
          "percentage": 100
        },
        {
          "stage": "Contacted",
          "value": 350,
          "percentage": 70
        },
        {
          "stage": "Qualified",
          "value": 280,
          "percentage": 56
        },
        {
          "stage": "Converted",
          "value": 245,
          "percentage": 49
        }
      ],
      "metrics": {
        "conversion_rate": 49,
        "avg_response_time": 2,
        "avg_response_time_unit": "h"
      }
    },
    "staff_performance": {
      "leaderboard": [
        {
          "staff_id": 1,
          "name": "John Doe",
          "rank": 1,
          "revenue": 45000,
          "tasks_completed": 45,
          "avg_days": 3.5,
          "performance_percentage": 95
        }
      ]
    },
    "top_preparers": {
      "data": [
        {
          "preparer_id": 1,
          "name": "Jane Smith",
          "returns": 25,
          "revenue": 35000
        }
      ]
    },
    "compliance_risk": {
      "statuses": [
        {
          "status": "Completed",
          "score_display": "95%",
          "percentage": 95,
          "risk_level": "low"
        },
        {
          "status": "In Progress",
          "score_display": "4%",
          "percentage": 4,
          "risk_level": "low"
        },
        {
          "status": "Pending",
          "score_display": "1%",
          "percentage": 1,
          "risk_level": "medium"
        }
      ],
      "metrics": {
        "kpa_completion_rate": 95,
        "flagged_returns_active": 3,
        "overall_compliance_score": 92
      }
    },
    "subscription": {
      "current_plan": "Professional",
      "price_formatted": "$299/month",
      "next_billing_date_formatted": "March 15, 2025"
    }
  },
  "message": "Dashboard data retrieved successfully"
}
```

---

## Backend Requirements

### 1. Date Range Calculation

The backend should calculate date ranges based on the `date_range` parameter:

- **`7d`**: Data from `today - 7 days` to `today`
- **`30d`**: Data from `today - 30 days` to `today`
- **`90d`**: Data from `today - 90 days` to `today`
- **`6m`**: Data from `today - 6 months` to `today`
- **`1y`**: Data from `today - 12 months` to `today`

### 2. Data Filtering

All analytics data should be filtered by the specified date range:

- **Revenue Analytics**: Filter revenue transactions by date range
- **Client Engagement**: Filter client interactions by date range
- **Staff Performance**: Filter staff activities by date range
- **Compliance Data**: Filter compliance records by date range
- **Key Metrics**: Calculate metrics (revenue, clients, tasks) within the date range

### 3. Percentage Changes

For metrics with `percentage_change`, calculate the change compared to the **previous period of the same duration**:

- **Last 7 days**: Compare with previous 7 days
- **Last 30 days**: Compare with previous 30 days
- **Last 90 days**: Compare with previous 90 days
- **Last 6 months**: Compare with previous 6 months
- **Last year**: Compare with previous 12 months

### 4. Revenue Trend Data

The `revenue_analytics.trend.data` array should contain data points aggregated by the `period` parameter (monthly, weekly, or daily) within the specified date range.

### 5. Error Handling

The API should handle invalid date range values gracefully:

```json
{
  "success": false,
  "message": "Invalid date_range parameter. Valid values: 7d, 30d, 90d, 6m, 1y",
  "error": "INVALID_DATE_RANGE"
}
```

---

## Validation Rules

1. **Date Range Validation**:
   - Accept only: `7d`, `30d`, `90d`, `6m`, `1y`
   - Return 400 Bad Request for invalid values

2. **Period Validation**:
   - Accept: `monthly`, `weekly`, `daily` (if supported)
   - Default to `monthly` if not provided or invalid

3. **Recent Clients Limit**:
   - Must be a positive integer
   - Default to 10 if not provided
   - Maximum recommended: 100

---

## Performance Considerations

1. **Caching**: Consider caching dashboard data for frequently requested date ranges (e.g., last 30 days)

2. **Database Queries**: Optimize queries to efficiently filter by date ranges

3. **Response Time**: Target response time < 2 seconds for standard date ranges

4. **Data Aggregation**: Pre-aggregate data where possible to improve performance

---

## Testing Requirements

### Test Cases

1. **Valid Date Ranges**:
   - ✅ `date_range=7d` returns last 7 days of data
   - ✅ `date_range=30d` returns last 30 days of data
   - ✅ `date_range=90d` returns last 90 days of data
   - ✅ `date_range=6m` returns last 6 months of data
   - ✅ `date_range=1y` returns last 12 months of data

2. **Default Behavior**:
   - ✅ No `date_range` parameter defaults to `30d`

3. **Invalid Inputs**:
   - ✅ Invalid `date_range` returns 400 error
   - ✅ Invalid `period` defaults to `monthly`

4. **Data Accuracy**:
   - ✅ Revenue calculations match filtered transactions
   - ✅ Client counts match filtered clients
   - ✅ Percentage changes are calculated correctly

5. **Edge Cases**:
   - ✅ Empty result sets return empty arrays (not null)
   - ✅ Insufficient data for comparison periods handled gracefully

---

## Additional Recommendations

### Optional Enhancements

1. **Custom Date Range**: Consider adding support for custom start/end dates:
   ```
   ?start_date=2025-01-01&end_date=2025-01-31
   ```

2. **Time Zone Support**: Ensure date calculations respect the firm's timezone

3. **Real-time Updates**: Consider WebSocket support for live dashboard updates

4. **Export Functionality**: Support exporting filtered data in CSV/PDF formats

---

## Frontend Integration Notes

- The frontend applies date range changes only when the user clicks "Apply"
- The `selectedDateRange` state tracks the dropdown selection
- The `dateRange` state tracks the currently applied filter
- API calls are triggered when `dateRange` changes (via useEffect)

---

## Contact & Support

For questions or clarifications regarding these API requirements, please contact the development team.

**Last Updated:** January 2025
**Version:** 1.0

