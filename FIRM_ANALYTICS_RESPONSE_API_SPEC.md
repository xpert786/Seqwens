# Firm Analytics & Response Time API Specifications

## Analytics API

### Endpoint

**GET** `/user/firm-admin/analytics/`

### Query Parameters (Optional)
- `date_range` (string): Time range filter - `"7d"`, `"30d"`, `"90d"`, `"6m"`, `"1y"` (default: `"30d"`)
- `period` (string): Period type for analytics - `"monthly"`, `"weekly"`, `"daily"` (default: `"monthly"`)
- `tax_year` (integer): Filter by tax year (e.g., `2024`, `2023`)
- `office_id` (integer): Filter by specific office ID
- `tab` (string): Specific tab data to return - `"overview"`, `"revenue"`, `"client"`, `"service"`, `"staff"`, `"compliance"` (default: returns all tabs)

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Analytics API Expected Response Structure

```json
{
  "success": true,
  "data": {
    "overview": {
      "kpi_metrics": {
        "total_revenue": {
          "current": 338000,
          "formatted": "$338,000",
          "percentage_change": 12.5,
          "change_type": "increase"
        },
        "active_clients": {
          "current": 247,
          "percentage_change": 37,
          "change_type": "increase"
        },
        "avg_client_value": {
          "current": 1369,
          "formatted": "$1,369",
          "percentage_change": 8.2,
          "change_type": "increase"
        },
        "client_retention": {
          "current": 96.3,
          "formatted": "96.3%",
          "percentage_change": 1.2,
          "change_type": "increase"
        }
      },
      "revenue_trend": {
        "data": [
          {
            "month": "Jan",
            "revenue": 28000,
            "expenses": 18000,
            "profit": 10000
          },
          {
            "month": "Feb",
            "revenue": 30000,
            "expenses": 19000,
            "profit": 11000
          },
          {
            "month": "Mar",
            "revenue": 35000,
            "expenses": 20000,
            "profit": 15000
          },
          {
            "month": "Apr",
            "revenue": 61000,
            "expenses": 32000,
            "profit": 29000
          },
          {
            "month": "May",
            "revenue": 38000,
            "expenses": 22000,
            "profit": 16000
          },
          {
            "month": "Jun",
            "revenue": 32000,
            "expenses": 18000,
            "profit": 14000
          }
        ]
      },
      "client_growth": {
        "data": [
          {
            "month": "Jan",
            "new_clients": 12,
            "lost_clients": 3,
            "net_growth": 9
          },
          {
            "month": "Feb",
            "new_clients": 15,
            "lost_clients": 2,
            "net_growth": 13
          },
          {
            "month": "Mar",
            "new_clients": 22,
            "lost_clients": 3,
            "net_growth": 19
          },
          {
            "month": "Apr",
            "new_clients": 18,
            "lost_clients": 4,
            "net_growth": 14
          },
          {
            "month": "May",
            "new_clients": 25,
            "lost_clients": 2,
            "net_growth": 23
          },
          {
            "month": "Jun",
            "new_clients": 20,
            "lost_clients": 3,
            "net_growth": 17
          }
        ]
      },
      "client_segmentation": {
        "segments": [
          {
            "name": "Individual Clients",
            "value": 125000,
            "formatted": "$125,000",
            "average": 801,
            "average_formatted": "$801 avg",
            "client_count": 156,
            "percentage": 40,
            "color": "#3B82F6"
          },
          {
            "name": "Small Business",
            "value": 87000,
            "formatted": "$87,000",
            "average": 1299,
            "average_formatted": "$1,299 avg",
            "client_count": 67,
            "percentage": 28,
            "color": "#10B981"
          },
          {
            "name": "Medium Business",
            "value": 69000,
            "formatted": "$69,000",
            "average": 3833,
            "average_formatted": "$3,833 avg",
            "client_count": 18,
            "percentage": 22,
            "color": "#F97316"
          },
          {
            "name": "Enterprise",
            "value": 34000,
            "formatted": "$34,000",
            "average": 5667,
            "average_formatted": "$5,667 avg",
            "client_count": 6,
            "percentage": 10,
            "color": "#EF4444"
          }
        ],
        "total_revenue": 315000,
        "total_clients": 247
      }
    },
    "revenue_analysis": {
      "kpi_metrics": {
        "gross_revenue": {
          "current": 196000,
          "formatted": "$196,000",
          "subtitle": "Before any fees"
        },
        "fees_collected": {
          "current": 160000,
          "formatted": "$160,000",
          "subtitle": "Collection Rate 82%",
          "collection_rate": 82
        },
        "outstanding": {
          "current": 36000,
          "formatted": "$36,000",
          "subtitle": "Unpaid / pending"
        },
        "refund_transfers": {
          "current": 15500,
          "formatted": "$15,500",
          "subtitle": "Bank Adoption 59%",
          "bank_adoption_rate": 59
        },
        "fees_bank_software": {
          "current": 11810,
          "formatted": "$11,810",
          "subtitle": "Bank $5,900 - Soft $5,910",
          "bank_fees": 5900,
          "software_fees": 5910
        },
        "net_profit": {
          "current": 148190,
          "formatted": "$148,190",
          "subtitle": "After bank & software fees"
        }
      },
      "revenue_profit_trend": {
        "data": [
          {
            "month": "Jan",
            "collected": 23000,
            "outstanding": 5000,
            "refund_transfer": 2000,
            "net_profit": 21150,
            "bank_adoption": 58
          },
          {
            "month": "Feb",
            "collected": 25000,
            "outstanding": 5000,
            "refund_transfer": 3000,
            "net_profit": 24000,
            "bank_adoption": 60
          },
          {
            "month": "Mar",
            "collected": 31000,
            "outstanding": 5000,
            "refund_transfer": 3000,
            "net_profit": 28000,
            "bank_adoption": 62
          },
          {
            "month": "Apr",
            "collected": 29000,
            "outstanding": 5000,
            "refund_transfer": 3000,
            "net_profit": 27000,
            "bank_adoption": 64
          },
          {
            "month": "May",
            "collected": 33000,
            "outstanding": 5000,
            "refund_transfer": 5000,
            "net_profit": 30000,
            "bank_adoption": 68
          },
          {
            "month": "Jun",
            "collected": 26000,
            "outstanding": 5000,
            "refund_transfer": 4000,
            "net_profit": 24000,
            "bank_adoption": 64
          }
        ]
      },
      "fees_by_office": {
        "data": [
          {
            "month": "Jan",
            "office_a": 10000,
            "office_b": 9000,
            "office_c": 7000,
            "net_profit": 19400
          },
          {
            "month": "Feb",
            "office_a": 12000,
            "office_b": 10000,
            "office_c": 8000,
            "net_profit": 22000
          },
          {
            "month": "Mar",
            "office_a": 15000,
            "office_b": 12000,
            "office_c": 10000,
            "net_profit": 26000
          },
          {
            "month": "Apr",
            "office_a": 13000,
            "office_b": 11000,
            "office_c": 9000,
            "net_profit": 24000
          },
          {
            "month": "May",
            "office_a": 16000,
            "office_b": 13000,
            "office_c": 11000,
            "net_profit": 28000
          },
          {
            "month": "Jun",
            "office_a": 14000,
            "office_b": 12000,
            "office_c": 10000,
            "net_profit": 25000
          }
        ],
        "office_list": [
          {
            "id": 1,
            "name": "Office A"
          },
          {
            "id": 2,
            "name": "Office B"
          },
          {
            "id": 3,
            "name": "Office C"
          }
        ]
      }
    },
    "client_analytics": {
      "kpi_metrics": {
        "leads": {
          "current": 990
        },
        "paying_clients": {
          "current": 481
        },
        "repeat_clients": {
          "current": 268
        },
        "conversion_rate": {
          "current": 49,
          "formatted": "49%",
          "subtitle": "Paying / Leads"
        },
        "retention_rate": {
          "current": 94,
          "formatted": "94%"
        },
        "avg_clv": {
          "current": 1502,
          "formatted": "$1,502",
          "full_name": "Average Customer Lifetime Value"
        }
      },
      "client_segmentation": {
        "data": [
          {
            "name": "Individual",
            "value": 59,
            "color": "#3B82F6"
          },
          {
            "name": "Amended",
            "value": 35,
            "color": "#8B5CF6"
          },
          {
            "name": "Business",
            "value": 25,
            "color": "#1E40AF"
          },
          {
            "name": "Extensions",
            "value": 12,
            "color": "#F97316"
          }
        ]
      },
      "conversion_funnel": {
        "stages": [
          {
            "stage": "Leads",
            "count": 990,
            "color": "#3B82F6"
          },
          {
            "stage": "Consultations",
            "count": 680,
            "color": "#8B5CF6"
          },
          {
            "stage": "Paying",
            "count": 780,
            "color": "#10B981"
          },
          {
            "stage": "Repeat",
            "count": 980,
            "color": "#F59E0B"
          }
        ]
      },
      "retention_clv": {
        "data": [
          {
            "month": "Jan",
            "avg_clv": 550,
            "retention": 92
          },
          {
            "month": "Feb",
            "avg_clv": 850,
            "retention": 94
          },
          {
            "month": "Mar",
            "avg_clv": 720,
            "retention": 94
          },
          {
            "month": "Apr",
            "avg_clv": 400,
            "retention": 91
          },
          {
            "month": "May",
            "avg_clv": 750,
            "retention": 95
          },
          {
            "month": "Jun",
            "avg_clv": 800,
            "retention": 93
          }
        ]
      },
      "demographics": {
        "age_distribution": [
          {
            "age_range": "18-24",
            "clients": 60
          },
          {
            "age_range": "25-34",
            "clients": 105
          },
          {
            "age_range": "35-44",
            "clients": 75
          },
          {
            "age_range": "45-54",
            "clients": 110
          },
          {
            "age_range": "55+",
            "clients": 125
          }
        ],
        "filing_status": [
          {
            "status": "Single",
            "value": 45,
            "color": "#3B82F6"
          },
          {
            "status": "Married",
            "value": 35,
            "color": "#8B5CF6"
          },
          {
            "status": "Head of Household",
            "value": 8,
            "color": "#1E40AF"
          },
          {
            "status": "Other",
            "value": 3,
            "color": "#F97316"
          }
        ],
        "income_brackets": [
          {
            "bracket": "<50k",
            "clients": 125
          },
          {
            "bracket": "50-100k",
            "clients": 80
          },
          {
            "bracket": "100-150k",
            "clients": 45
          },
          {
            "bracket": "150-250k",
            "clients": 115
          },
          {
            "bracket": ">250k",
            "clients": 75
          }
        ],
        "referral_sources": [
          {
            "source": "Referrals",
            "clients": 95
          },
          {
            "source": "Marketing",
            "clients": 125
          },
          {
            "source": "Walk-ins",
            "clients": 45
          }
        ]
      }
    },
    "service_performance": {
      "kpi_metrics": {
        "total_revenue": {
          "current": 34000,
          "formatted": "$34,000"
        },
        "avg_turnaround": {
          "current": 3.8,
          "formatted": "3.8 days",
          "unit": "days"
        },
        "upsell_rate": {
          "current": 38,
          "formatted": "38%",
          "unit": "percentage"
        },
        "top_satisfaction": {
          "service": "Payroll",
          "satisfaction": 94,
          "formatted": "Payroll — 94%"
        }
      },
      "service_adoption": {
        "data": [
          {
            "month": "Jan",
            "bookkeeping": 35,
            "tax_planning": 22,
            "individual_tax": 55,
            "business_tax": 18,
            "payroll": 12,
            "audit_protection": 8
          },
          {
            "month": "Feb",
            "bookkeeping": 38,
            "tax_planning": 25,
            "individual_tax": 58,
            "business_tax": 20,
            "payroll": 14,
            "audit_protection": 9
          },
          {
            "month": "Mar",
            "bookkeeping": 40,
            "tax_planning": 28,
            "individual_tax": 60,
            "business_tax": 22,
            "payroll": 15,
            "audit_protection": 11
          },
          {
            "month": "Apr",
            "bookkeeping": 37,
            "tax_planning": 27,
            "individual_tax": 62,
            "business_tax": 19,
            "payroll": 13,
            "audit_protection": 10
          },
          {
            "month": "May",
            "bookkeeping": 42,
            "tax_planning": 31,
            "individual_tax": 65,
            "business_tax": 25,
            "payroll": 18,
            "audit_protection": 12
          },
          {
            "month": "Jun",
            "bookkeeping": 39,
            "tax_planning": 29,
            "individual_tax": 61,
            "business_tax": 21,
            "payroll": 16,
            "audit_protection": 11
          }
        ],
        "services": [
          {
            "id": 1,
            "name": "Bookkeeping",
            "key": "bookkeeping"
          },
          {
            "id": 2,
            "name": "Tax Planning",
            "key": "tax_planning"
          },
          {
            "id": 3,
            "name": "Individual Tax Returns",
            "key": "individual_tax"
          },
          {
            "id": 4,
            "name": "Business Tax Returns",
            "key": "business_tax"
          },
          {
            "id": 5,
            "name": "Payroll",
            "key": "payroll"
          },
          {
            "id": 6,
            "name": "Audit Protection",
            "key": "audit_protection"
          }
        ]
      },
      "upsell_performance": {
        "data": [
          {
            "service": "Bookkeeping",
            "upsell_rate": 45
          },
          {
            "service": "Tax Planning",
            "upsell_rate": 52
          },
          {
            "service": "Individual Tax Returns",
            "upsell_rate": 38
          },
          {
            "service": "Business Tax Returns",
            "upsell_rate": 41
          }
        ]
      },
      "turnaround_times": {
        "data": [
          {
            "service": "Bookkeeping",
            "avg_days": 2.8
          },
          {
            "service": "Tax Planning",
            "avg_days": 7.5
          },
          {
            "service": "Business Tax Returns",
            "avg_days": 4.0
          },
          {
            "service": "Payroll",
            "avg_days": 2.8
          },
          {
            "service": "Audit Protection",
            "avg_days": 6.5
          }
        ]
      },
      "service_satisfaction": {
        "data": [
          {
            "service": "Payroll",
            "satisfaction": 94,
            "completion": 100,
            "client_count": 125
          },
          {
            "service": "Bookkeeping",
            "satisfaction": 88,
            "completion": 75,
            "client_count": 95
          },
          {
            "service": "Tax Planning",
            "satisfaction": 92,
            "completion": 50,
            "client_count": 110
          },
          {
            "service": "Individual Tax Returns",
            "satisfaction": 90,
            "completion": 25,
            "client_count": 200
          }
        ]
      }
    },
    "staff_productivity": {
      "kpi_metrics": {
        "total_staff": 15,
        "active_staff": 12,
        "avg_productivity": 85,
        "avg_productivity_formatted": "85%",
        "tasks_completed_this_month": 450,
        "revenue_per_staff": 22533,
        "revenue_per_staff_formatted": "$22,533"
      },
      "productivity_by_staff": {
        "data": [
          {
            "staff_id": 1,
            "name": "John Doe",
            "tasks_completed": 45,
            "revenue_generated": 12000,
            "productivity_score": 94,
            "avg_days_per_task": 1.5
          },
          {
            "staff_id": 2,
            "name": "Jane Smith",
            "tasks_completed": 42,
            "revenue_generated": 11000,
            "productivity_score": 91,
            "avg_days_per_task": 1.6
          }
        ]
      },
      "productivity_trend": {
        "data": [
          {
            "month": "Jan",
            "avg_productivity": 82,
            "tasks_completed": 380,
            "revenue": 180000
          },
          {
            "month": "Feb",
            "avg_productivity": 84,
            "tasks_completed": 410,
            "revenue": 195000
          },
          {
            "month": "Mar",
            "avg_productivity": 85,
            "tasks_completed": 450,
            "revenue": 215000
          }
        ]
      }
    },
    "compliance_reporting": {
      "kpi_metrics": {
        "total_revenue": {
          "current": 338000,
          "formatted": "$338,000",
          "percentage_change": 12.5
        },
        "active_clients": {
          "current": 247,
          "percentage_change": 37
        },
        "avg_client_value": {
          "current": 1369,
          "formatted": "$1,369",
          "percentage_change": 8.2
        },
        "client_retention": {
          "current": 96.3,
          "formatted": "96.3%",
          "percentage_change": 1.2
        }
      },
      "due_diligence": {
        "completed": 85,
        "incomplete": 15,
        "total": 100,
        "completion_rate": 85
      },
      "irs_compliance": {
        "checks": [
          {
            "name": "Missing IDs",
            "count": 6.1,
            "target": 8,
            "status": "pass"
          },
          {
            "name": "Unsigned Forms",
            "count": 9,
            "target": 10,
            "status": "pass"
          },
          {
            "name": "Expired PTINs",
            "count": 6.5,
            "target": 7,
            "status": "pass"
          }
        ]
      },
      "esignature_trends": {
        "data": [
          {
            "year": "2020",
            "e_signed": 80,
            "wet_signed": 40
          },
          {
            "year": "2021",
            "e_signed": 90,
            "wet_signed": 35
          },
          {
            "year": "2022",
            "e_signed": 95,
            "wet_signed": 30
          },
          {
            "year": "2023",
            "e_signed": 100,
            "wet_signed": 25
          },
          {
            "year": "2024",
            "e_signed": 110,
            "wet_signed": 20
          },
          {
            "year": "2025",
            "e_signed": 100,
            "wet_signed": 20
          }
        ]
      }
    },
    "metadata": {
      "date_range": "30d",
      "period": "monthly",
      "generated_at": "2025-11-20T12:00:00Z"
    }
  },
  "message": "Analytics data retrieved successfully"
}
```

---

# Response Time API

### Endpoint

**GET** `/user/firm-admin/response-time/`

### Query Parameters (Optional)
- `date_range` (string): Time range filter - `"7d"`, `"30d"`, `"90d"`, `"6m"`, `"1y"` (default: `"30d"`)
- `period` (string): Period type - `"monthly"`, `"weekly"`, `"daily"` (default: `"monthly"`)
- `channel` (string): Filter by communication channel - `"email"`, `"phone"`, `"portal"`, `"all"` (default: `"all"`)
- `staff_id` (integer): Filter by specific staff member ID
- `client_id` (integer): Filter by specific client ID
- `priority` (string): Filter by priority - `"low"`, `"medium"`, `"high"`, `"urgent"`

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Response Time API Expected Response Structure

```json
{
  "success": true,
  "data": {
    "summary_metrics": {
      "overall_avg_response_time": {
        "current": 2.4,
        "unit": "hours",
        "formatted": "2.4h",
        "target": 2.0,
        "percentage_change": 18,
        "change_type": "increase",
        "status": "above_target"
      },
      "total_responses": {
        "count": 1247,
        "period": "this_month"
      },
      "response_rate": {
        "percentage": 98.5,
        "formatted": "98.5%",
        "within_sla": true
      },
      "sla_compliance": {
        "percentage": 92.3,
        "formatted": "92.3%",
        "target": 95.0
      }
    },
    "response_time_by_channel": {
      "email": {
        "avg_response_time": 1.8,
        "unit": "hours",
        "formatted": "1.8h",
        "count": 856,
        "target": 2.0,
        "within_target": true,
        "percentage_of_total": 68.6
      },
      "phone": {
        "avg_response_time": 0.5,
        "unit": "hours",
        "formatted": "0.5h",
        "count": 245,
        "target": 1.0,
        "within_target": true,
        "percentage_of_total": 19.6
      },
      "portal": {
        "avg_response_time": 1.5,
        "unit": "hours",
        "formatted": "1.5h",
        "count": 146,
        "target": 2.0,
        "within_target": true,
        "percentage_of_total": 11.7
      }
    },
    "response_time_trend": {
      "data": [
        {
          "month": "Jan",
          "avg_response_time": 2.8,
          "email": 2.1,
          "phone": 0.6,
          "portal": 1.8,
          "total_responses": 1150
        },
        {
          "month": "Feb",
          "avg_response_time": 2.6,
          "email": 2.0,
          "phone": 0.5,
          "portal": 1.7,
          "total_responses": 1180
        },
        {
          "month": "Mar",
          "avg_response_time": 2.5,
          "email": 1.9,
          "phone": 0.5,
          "portal": 1.6,
          "total_responses": 1200
        },
        {
          "month": "Apr",
          "avg_response_time": 2.4,
          "email": 1.8,
          "phone": 0.5,
          "portal": 1.5,
          "total_responses": 1220
        },
        {
          "month": "May",
          "avg_response_time": 2.3,
          "email": 1.8,
          "phone": 0.5,
          "portal": 1.5,
          "total_responses": 1235
        },
        {
          "month": "Jun",
          "avg_response_time": 2.4,
          "email": 1.8,
          "phone": 0.5,
          "portal": 1.5,
          "total_responses": 1247
        }
      ]
    },
    "response_time_by_staff": {
      "data": [
        {
          "staff_id": 1,
          "staff_name": "Sarah Johnson",
          "avg_response_time": 1.2,
          "unit": "hours",
          "formatted": "1.2h",
          "total_responses": 145,
          "within_target": true,
          "target": 2.0,
          "by_channel": {
            "email": {
              "avg_time": 1.0,
              "count": 98
            },
            "phone": {
              "avg_time": 0.4,
              "count": 32
            },
            "portal": {
              "avg_time": 1.1,
              "count": 15
            }
          }
        },
        {
          "staff_id": 2,
          "staff_name": "Mike Rodriguez",
          "avg_response_time": 2.1,
          "unit": "hours",
          "formatted": "2.1h",
          "total_responses": 132,
          "within_target": true,
          "target": 2.0,
          "by_channel": {
            "email": {
              "avg_time": 2.2,
              "count": 85
            },
            "phone": {
              "avg_time": 0.5,
              "count": 28
            },
            "portal": {
              "avg_time": 1.8,
              "count": 19
            }
          }
        },
        {
          "staff_id": 3,
          "staff_name": "John Anderson",
          "avg_response_time": 1.8,
          "unit": "hours",
          "formatted": "1.8h",
          "total_responses": 156,
          "within_target": true,
          "target": 2.0,
          "by_channel": {
            "email": {
              "avg_time": 1.6,
              "count": 112
            },
            "phone": {
              "avg_time": 0.5,
              "count": 31
            },
            "portal": {
              "avg_time": 1.5,
              "count": 13
            }
          }
        }
      ],
      "total_staff": 15,
      "active_staff": 12
    },
    "response_time_by_priority": {
      "urgent": {
        "avg_response_time": 0.3,
        "unit": "hours",
        "formatted": "0.3h",
        "count": 89,
        "target": 0.5,
        "within_target": true
      },
      "high": {
        "avg_response_time": 1.2,
        "unit": "hours",
        "formatted": "1.2h",
        "count": 245,
        "target": 1.5,
        "within_target": true
      },
      "medium": {
        "avg_response_time": 2.1,
        "unit": "hours",
        "formatted": "2.1h",
        "count": 678,
        "target": 2.0,
        "within_target": false
      },
      "low": {
        "avg_response_time": 3.5,
        "unit": "hours",
        "formatted": "3.5h",
        "count": 235,
        "target": 4.0,
        "within_target": true
      }
    },
    "response_time_distribution": {
      "buckets": [
        {
          "range": "0-1 hour",
          "count": 456,
          "percentage": 36.6
        },
        {
          "range": "1-2 hours",
          "count": 523,
          "percentage": 41.9
        },
        {
          "range": "2-4 hours",
          "count": 198,
          "percentage": 15.9
        },
        {
          "range": "4-8 hours",
          "count": 58,
          "percentage": 4.7
        },
        {
          "range": "8+ hours",
          "count": 12,
          "percentage": 1.0
        }
      ]
    },
    "response_performance": {
      "top_performers": [
        {
          "staff_id": 1,
          "staff_name": "Sarah Johnson",
          "avg_response_time": 1.2,
          "rank": 1,
          "improvement": "+15%"
        },
        {
          "staff_id": 5,
          "staff_name": "Emma Wilson",
          "avg_response_time": 1.5,
          "rank": 2,
          "improvement": "+12%"
        },
        {
          "staff_id": 3,
          "staff_name": "John Anderson",
          "avg_response_time": 1.8,
          "rank": 3,
          "improvement": "+8%"
        }
      ],
      "needs_improvement": [
        {
          "staff_id": 7,
          "staff_name": "Robert Brown",
          "avg_response_time": 3.2,
          "rank": 10,
          "improvement": "-5%",
          "reason": "Above target"
        }
      ]
    },
    "recent_responses": {
      "data": [
        {
          "id": 1001,
          "client_id": 45,
          "client_name": "John Doe",
          "staff_id": 1,
          "staff_name": "Sarah Johnson",
          "channel": "email",
          "priority": "high",
          "response_time": 1.2,
          "response_time_formatted": "1.2h",
          "timestamp": "2025-11-20T10:30:00Z",
          "timestamp_formatted": "2 hours ago",
          "subject": "Tax filing question",
          "status": "resolved"
        },
        {
          "id": 1002,
          "client_id": 67,
          "client_name": "Jane Smith",
          "staff_id": 2,
          "staff_name": "Mike Rodriguez",
          "channel": "phone",
          "priority": "medium",
          "response_time": 0.5,
          "response_time_formatted": "0.5h",
          "timestamp": "2025-11-20T09:15:00Z",
          "timestamp_formatted": "3 hours ago",
          "subject": "Document inquiry",
          "status": "resolved"
        }
      ],
      "total_recent": 50,
      "showing": 10
    },
    "sla_performance": {
      "overall_sla_compliance": 92.3,
      "target_sla": 95.0,
      "within_sla": 1150,
      "outside_sla": 97,
      "sla_by_channel": {
        "email": {
          "compliance": 94.2,
          "within_sla": 806,
          "outside_sla": 50
        },
        "phone": {
          "compliance": 98.0,
          "within_sla": 240,
          "outside_sla": 5
        },
        "portal": {
          "compliance": 89.7,
          "within_sla": 131,
          "outside_sla": 15
        }
      },
      "sla_by_priority": {
        "urgent": {
          "compliance": 100.0,
          "within_sla": 89,
          "outside_sla": 0
        },
        "high": {
          "compliance": 96.7,
          "within_sla": 237,
          "outside_sla": 8
        },
        "medium": {
          "compliance": 91.4,
          "within_sla": 620,
          "outside_sla": 58
        },
        "low": {
          "compliance": 88.5,
          "within_sla": 208,
          "outside_sla": 27
        }
      }
    },
    "metadata": {
      "date_range": "30d",
      "period": "monthly",
      "generated_at": "2025-11-20T12:00:00Z",
      "timezone": "UTC"
    }
  },
  "message": "Response time data retrieved successfully"
}
```

---

## Field Descriptions

### Analytics API

#### Overview Tab
- **kpi_metrics**: Key performance indicators for revenue, clients, and retention
- **revenue_trend**: Monthly revenue, expenses, and profit breakdown
- **client_growth**: Monthly new vs lost clients with net growth
- **client_segmentation**: Revenue breakdown by client segment type

#### Revenue Analysis Tab
- **kpi_metrics**: Detailed revenue metrics including gross, collected, outstanding, refunds, fees, and net profit
- **revenue_profit_trend**: Monthly revenue and profit trends with refund transfers and bank adoption
- **fees_by_office**: Revenue breakdown by office location

#### Client Analytics Tab
- **kpi_metrics**: Client acquisition and retention metrics (leads, paying clients, conversion, CLV)
- **client_segmentation**: Client distribution by type (Individual, Amended, Business, Extensions)
- **conversion_funnel**: Client journey stages with counts
- **retention_clv**: Monthly retention rate and average customer lifetime value
- **demographics**: Age distribution, filing status, income brackets, and referral sources

#### Service Performance Tab
- **kpi_metrics**: Service-related KPIs (revenue, turnaround time, upsell rate, satisfaction)
- **service_adoption**: Monthly adoption rates by service type
- **upsell_performance**: Upsell rates by service
- **turnaround_times**: Average completion time by service
- **service_satisfaction**: Client satisfaction scores by service

#### Staff Productivity Tab
- **kpi_metrics**: Overall staff productivity metrics
- **productivity_by_staff**: Individual staff member performance
- **productivity_trend**: Monthly productivity trends

#### Compliance Reporting Tab
- **kpi_metrics**: Compliance-related KPIs
- **due_diligence**: Due diligence completion rates
- **irs_compliance**: IRS compliance check results
- **esignature_trends**: E-signature adoption trends over years

### Response Time API

- **summary_metrics**: Overall response time statistics and SLA compliance
- **response_time_by_channel**: Breakdown by communication channel (email, phone, portal)
- **response_time_trend**: Historical trend of response times
- **response_time_by_staff**: Individual staff member response time performance
- **response_time_by_priority**: Response times categorized by priority level
- **response_time_distribution**: Distribution of response times in buckets
- **response_performance**: Top performers and staff needing improvement
- **recent_responses**: Recent response activity log
- **sla_performance**: SLA compliance metrics by channel and priority

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 500 Internal Server Error
```json
{
  "detail": "An error occurred while processing your request."
}
```

---

## Notes

1. All monetary values should be in decimal numbers (e.g., 338000.00). The frontend will format them for display.
2. Response times should be in hours as decimal numbers (e.g., 2.4 = 2 hours 24 minutes).
3. Percentages should be numbers (0-100), not decimals.
4. Dates should be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ).
5. The `tab` parameter allows fetching specific tab data only, reducing payload size.
6. Colors for charts should be provided as hex codes (e.g., "#3B82F6").
7. All IDs should be integers.

