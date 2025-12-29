# Tax Preparer Workflows - API Specification

This document lists all the APIs required for the Tax Preparer Workflows feature.

## Base URL
```
Production: http://168.231.121.7/seqwens/api/
Development: http://localhost:8000/api/
```

## Authentication
All requests require JWT token in header:
```
Authorization: Bearer <access_token>
```

---

## 1. List Tax Preparer Workflows

**Endpoint:** `GET /taxpayer/tax-preparer/workflows/`

**Description:** Get all workflows assigned to the authenticated tax preparer.

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `paused`, `completed`, `cancelled`)
- `search` (optional): Search term to filter by client name or workflow template name

**Example Request:**
```bash
GET /seqwens/api/taxpayer/tax-preparer/workflows/?status=active&search=john
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "workflow_template": 3,
      "template_name": "Default Tax Preparation Workflow",
      "tax_case": 54,
      "tax_case_name": "John Doe",
      "tax_case_email": "john@example.com",
      "current_stage": 3,
      "current_stage_name": "Document Request",
      "status": "active",
      "status_display": "Active",
      "assigned_preparer": 49,
      "assigned_preparer_name": "Jane Smith",
      "progress_percentage": 25.5,
      "started_at": "2025-12-29T10:41:26.645546Z",
      "completed_at": null,
      "document_requests": [
        {
          "id": 1,
          "title": "2024 Tax Documents Request",
          "description": "Please provide W-2 and 1099 forms",
          "status": "submitted",
          "due_date": "2025-01-15",
          "categories": [
            { "id": 1, "name": "W-2 Forms" },
            { "id": 2, "name": "1099 Forms" }
          ]
        }
      ]
    }
  ],
  "message": "Workflows retrieved successfully"
}
```

---

## 2. Pause Workflow

**Endpoint:** `POST /taxpayer/firm/workflows/instances/{instance_id}/pause/`

**Description:** Pause an active workflow instance.

**Path Parameters:**
- `instance_id` (required): The workflow instance ID

**Example Request:**
```bash
POST /seqwens/api/taxpayer/firm/workflows/instances/7/pause/
```

**Example Response:**
```json
{
  "success": true,
  "message": "Workflow paused successfully",
  "data": {
    "id": 7,
    "status": "paused",
    "status_display": "Paused",
    "paused_at": "2025-12-29T12:00:00Z"
  }
}
```

---

## 3. Resume Workflow

**Endpoint:** `POST /taxpayer/firm/workflows/instances/{instance_id}/resume/`

**Description:** Resume a paused workflow instance.

**Path Parameters:**
- `instance_id` (required): The workflow instance ID

**Example Request:**
```bash
POST /seqwens/api/taxpayer/firm/workflows/instances/7/resume/
```

**Example Response:**
```json
{
  "success": true,
  "message": "Workflow resumed successfully",
  "data": {
    "id": 7,
    "status": "active",
    "status_display": "Active",
    "resumed_at": "2025-12-29T12:30:00Z"
  }
}
```

---

## 4. Complete Workflow

**Endpoint:** `POST /taxpayer/firm/workflows/instances/{instance_id}/complete/`

**Description:** Mark a workflow instance as completed.

**Path Parameters:**
- `instance_id` (required): The workflow instance ID

**Example Request:**
```bash
POST /seqwens/api/taxpayer/firm/workflows/instances/7/complete/
```

**Example Response:**
```json
{
  "success": true,
  "message": "Workflow completed successfully",
  "data": {
    "id": 7,
    "status": "completed",
    "status_display": "Completed",
    "completed_at": "2025-12-29T13:00:00Z"
  }
}
```

---

## 5. Get Workflow Instance with Documents

**Endpoint:** `GET /taxpayer/workflows/instances/{instance_id}/documents/`

**Description:** Get workflow instance details along with associated documents.

**Path Parameters:**
- `instance_id` (required): The workflow instance ID

**Example Request:**
```bash
GET /seqwens/api/taxpayer/workflows/instances/7/documents/
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "workflow_template": 3,
    "template_name": "Default Tax Preparation Workflow",
    "tax_case": 54,
    "tax_case_name": "John Doe",
    "current_stage": 3,
    "current_stage_name": "Document Request",
    "status": "active",
    "documents": [
      {
        "id": 101,
        "document_request": 1,
        "document_request_id": 1,
        "category": {
          "id": 1,
          "name": "W-2 Forms"
        },
        "tax_documents": "https://s3.amazonaws.com/bucket/file.pdf",
        "status": "submitted",
        "created_at": "2025-12-29T11:00:00Z"
      }
    ],
    "tax_documents": []
  },
  "message": "Workflow instance with documents retrieved successfully"
}
```

---

## 6. Create Document Request

**Endpoint:** `POST /taxpayer/workflows/document-requests/create/`

**Description:** Create a new document request for a workflow instance.

**Request Body:**
```json
{
  "workflow_instance_id": 7,
  "category_ids": [1, 2],
  "title": "2024 Tax Documents Request",
  "description": "Please provide the following documents for your 2024 tax return preparation.",
  "due_date": "2025-01-15"
}
```

**Example Request:**
```bash
POST /seqwens/api/taxpayer/workflows/document-requests/create/
Content-Type: application/json

{
  "workflow_instance_id": 7,
  "category_ids": [1, 2],
  "title": "2024 Tax Documents Request",
  "description": "Please provide W-2 and 1099 forms",
  "due_date": "01/15/2025"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Document request created successfully",
  "data": {
    "id": 2,
    "workflow_instance": 7,
    "taxpayer": 54,
    "taxpayer_name": "John Doe",
    "tax_preparer": 49,
    "tax_preparer_name": "Jane Smith",
    "requested_categories": [
      { "id": 1, "name": "W-2 Forms" },
      { "id": 2, "name": "1099 Forms" }
    ],
    "title": "2024 Tax Documents Request",
    "description": "Please provide W-2 and 1099 forms",
    "status": "pending",
    "due_date": "2025-01-15",
    "created_at": "2025-12-29T14:00:00Z"
  }
}
```

---

## 7. Get Document Request Details

**Endpoint:** `GET /taxpayer/workflows/document-requests/{request_id}/`

**Description:** Get details of a specific document request including documents.

**Path Parameters:**
- `request_id` (required): The document request ID

**Example Request:**
```bash
GET /seqwens/api/taxpayer/workflows/document-requests/1/
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "workflow_instance": 7,
    "title": "2024 Tax Documents Request",
    "description": "Please provide W-2 and 1099 forms",
    "status": "submitted",
    "due_date": "2025-01-15",
    "requested_categories": [
      { "id": 1, "name": "W-2 Forms" },
      { "id": 2, "name": "1099 Forms" }
    ],
    "documents": [
      {
        "id": 101,
        "category": { "id": 1, "name": "W-2 Forms" },
        "tax_documents": "https://s3.amazonaws.com/bucket/file.pdf",
        "status": "submitted",
        "created_at": "2025-12-29T11:00:00Z"
      }
    ],
    "tax_documents": []
  },
  "message": "Document request retrieved successfully"
}
```

---

## 8. Verify Documents

**Endpoint:** `POST /taxpayer/workflows/document-requests/verify/`

**Description:** Verify or reject documents submitted for a document request.

**Request Body:**
```json
{
  "document_request_id": 1,
  "verified": true,
  "notes": "All documents verified successfully. Ready to proceed."
}
```

**Example Request:**
```bash
POST /seqwens/api/taxpayer/workflows/document-requests/verify/
Content-Type: application/json

{
  "document_request_id": 1,
  "verified": true,
  "notes": "All documents verified successfully."
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Documents verified successfully",
  "data": {
    "id": 1,
    "status": "verified",
    "verified_at": "2025-12-29T15:00:00Z",
    "verified_by": 49,
    "verified_by_name": "Jane Smith",
    "verification_notes": "All documents verified successfully."
  }
}
```

**For Rejection:**
```json
{
  "document_request_id": 1,
  "verified": false,
  "notes": "W-2 form is missing signature. Please resubmit."
}
```

---

## 9. Get Workflow Instance Details (Optional)

**Endpoint:** `GET /taxpayer/firm/workflows/instances/{instance_id}/`

**Description:** Get detailed information about a specific workflow instance.

**Path Parameters:**
- `instance_id` (required): The workflow instance ID

**Example Request:**
```bash
GET /seqwens/api/taxpayer/firm/workflows/instances/7/
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "workflow_template": 3,
    "template_name": "Default Tax Preparation Workflow",
    "tax_case": 54,
    "tax_case_name": "John Doe",
    "tax_case_email": "john@example.com",
    "current_stage": 3,
    "current_stage_name": "Document Request",
    "status": "active",
    "status_display": "Active",
    "assigned_preparer": 49,
    "assigned_preparer_name": "Jane Smith",
    "progress_percentage": 25.5,
    "started_at": "2025-12-29T10:41:26.645546Z",
    "completed_at": null,
    "stage_instances": [
      {
        "id": 1,
        "stage": {
          "id": 3,
          "name": "Document Request"
        },
        "status": "in_progress",
        "started_at": "2025-12-29T10:41:26Z",
        "completed_at": null
      }
    ]
  },
  "message": "Workflow instance retrieved successfully"
}
```

---

## 10. Get Workflow Instance with Description and Logs (Optional)

**Endpoint:** `GET /taxpayer/firm/workflows/instances/{instance_id}/description-logs/`

**Description:** Get workflow instance with template/stage descriptions and execution logs.

**Path Parameters:**
- `instance_id` (required): The workflow instance ID

**Example Request:**
```bash
GET /seqwens/api/taxpayer/firm/workflows/instances/7/description-logs/
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "workflow_template": 3,
    "template_name": "Default Tax Preparation Workflow",
    "template_description": "Standard workflow for tax preparation",
    "current_stage": 3,
    "current_stage_name": "Document Request",
    "current_stage_description": "Request necessary tax documents from client",
    "status": "active",
    "execution_logs": [
      {
        "id": 1,
        "action_type": "stage_started",
        "action_type_display": "Stage Started",
        "performed_by": 49,
        "performed_by_name": "Jane Smith",
        "details": {
          "stage_id": 3,
          "stage_name": "Document Request"
        },
        "created_at": "2025-12-29T10:41:26.645546Z"
      }
    ],
    "execution_logs_count": 1
  },
  "message": "Workflow description and logs retrieved successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Workflow instance not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "An error occurred while processing your request"
}
```

---

## Status Values

Workflow statuses:
- `active` - Workflow is currently running
- `paused` - Workflow has been paused
- `completed` - Workflow has been completed
- `cancelled` - Workflow has been cancelled

Document request statuses:
- `pending` - Request created, waiting for client submission
- `submitted` - Client has submitted documents
- `verified` - Tax preparer has verified documents
- `needs_revision` - Documents need to be resubmitted

---

## Date Format

- **Input:** MM/DD/YYYY (e.g., "01/15/2025")
- **Output:** ISO 8601 format (e.g., "2025-01-15T00:00:00Z")

---

## Notes

1. All date fields should be sent in MM/DD/YYYY format and will be converted by the backend.
2. The `listTaxPreparerWorkflows` endpoint automatically filters workflows to only show those assigned to the authenticated tax preparer.
3. Status updates (pause/resume/complete) require the tax preparer to be assigned to the workflow.
4. Document verification requires the tax preparer to be assigned to the workflow instance.
5. All endpoints support pagination if needed (add `page` and `page_size` query parameters).

