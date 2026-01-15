# BusinessInfoForm Integration Guide

## Overview

The `BusinessInfoForm` component provides a comprehensive interface for managing client business information, including multiple business details, income records, and rental properties. It handles both POST (creating new data) and GET (loading existing data) operations.

## Features

- **Multi-tab Interface**: Separate tabs for Business Info, Business Income, and Rental Properties
- **Dynamic Forms**: Add/remove multiple entries for each section
- **Data Persistence**: Automatic save/load with proper API integration
- **Responsive Design**: Works on desktop and mobile devices
- **Form Validation**: Required field validation and error handling

## API Integration

### POST Request Structure
```json
{
  "business_infos": [
    {
      "business_name": "ABC Corp",
      "business_address": "123 Main St",
      "business_city": "Anytown",
      "business_state": "CA",
      "business_zip": "12345",
      "business_phone": "(555) 123-4567",
      "business_email": "contact@abc.com",
      "business_type": "Corporation",
      "ein": "12-3456789",
      "start_date": "2020-01-01",
      "end_date": null,
      "is_active": true
    }
  ],
  "business_incomes": [
    {
      "business_id": "1",
      "tax_year": 2024,
      "gross_receipts": "100000.00",
      "cost_of_goods_sold": "40000.00",
      "gross_profit": "60000.00",
      "advertising": "5000.00",
      "office_supplies": "2000.00",
      "repairs_maintenance": "3000.00",
      "insurance": "1500.00",
      "legal_professional": "2500.00",
      "utilities": "1200.00",
      "rent": "1800.00",
      "other_expenses": "1000.00"
    }
  ],
  "rental_properties": [
    {
      "property_address": "456 Oak St",
      "property_city": "Anytown",
      "property_state": "CA",
      "property_zip": "12345",
      "property_type": "Single Family Home",
      "purchase_date": "2019-03-15",
      "purchase_price": "250000.00",
      "current_value": "300000.00",
      "mortgage_balance": "150000.00",
      "monthly_rent": "2000.00",
      "annual_rent_income": "24000.00",
      "property_taxes": "4800.00",
      "insurance": "1200.00",
      "maintenance_repairs": "2400.00",
      "management_fees": "2400.00",
      "is_active": true
    }
  ]
}
```

### GET Response Structure
```json
{
  "business_infos": [
    {
      "id": 1,
      "business_name": "ABC Corp",
      "business_address": "123 Main St",
      // ... other fields with IDs
    }
  ],
  "business_incomes": [...],
  "rental_properties": [...]
}
```

## Integration Examples

### 1. Basic Modal Integration

```jsx
import React, { useState } from 'react';
import BusinessInfoForm from '../components/BusinessInfoForm';

function ClientManagementPage() {
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);

  const handleOpenBusinessForm = (clientId) => {
    setSelectedClientId(clientId);
    setShowBusinessForm(true);
  };

  const handleSaveBusinessData = () => {
    // Refresh client data or update UI
    console.log('Business data saved');
  };

  return (
    <div>
      {/* Your existing client management UI */}
      <button
        onClick={() => handleOpenBusinessForm(client.id)}
        className="btn btn-primary"
      >
        Manage Business Info
      </button>

      {showBusinessForm && (
        <BusinessInfoForm
          clientId={selectedClientId}
          onClose={() => setShowBusinessForm(false)}
          onSave={handleSaveBusinessData}
        />
      )}
    </div>
  );
}
```

### 2. Integration with Existing DataIntake Form

If you want to integrate it into the existing DataIntake form:

```jsx
// In DataIntake.jsx
import BusinessInfoForm from "../components/BusinessInfoForm";

// Add state for the business form modal
const [showBusinessInfoForm, setShowBusinessInfoForm] = useState(false);

// Add a button in the business section
<button
  onClick={() => setShowBusinessInfoForm(true)}
  className="btn btn-primary mb-3"
>
  Open Comprehensive Business Form
</button>

// Add the modal at the end
{showBusinessInfoForm && (
  <BusinessInfoForm
    clientId={clientId} // You'll need to get this from your existing logic
    onClose={() => setShowBusinessInfoForm(false)}
    onSave={() => {
      setShowBusinessInfoForm(false);
      // Optionally refresh the existing form data
    }}
  />
)}
```

### 3. Standalone Page Integration

For a dedicated business info page:

```jsx
// pages/ClientBusinessInfo.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import BusinessInfoForm from '../components/BusinessInfoForm';

function ClientBusinessInfo() {
  const { clientId } = useParams();

  const handleSave = () => {
    // Handle save completion
    console.log('Business info saved');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <BusinessInfoForm
          clientId={clientId}
          onClose={() => window.history.back()}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

export default ClientBusinessInfo;
```

## API Endpoints

The component expects the following API endpoints:

### POST `/api/clients/{clientId}/business-info/`
- **Method**: POST
- **Auth**: Required (Bearer token)
- **Body**: Business info payload as shown above
- **Response**: Success/error message

### GET `/api/clients/{clientId}/business-info/`
- **Method**: GET
- **Auth**: Required (Bearer token)
- **Response**: Existing business data or empty arrays

## Required Dependencies

Make sure you have these imports available:

```jsx
import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { handleAPIError } from '../utils/apiUtils';
```

## Customization Options

### Styling
The component uses Tailwind CSS classes. You can override styles by:

1. **Global CSS overrides** in your main CSS file
2. **Component prop extensions** for custom styling
3. **Theme variables** for consistent branding

### Form Fields
You can customize the form fields by modifying the component:

```jsx
// Add custom fields to business info
const businessInfoTemplate = {
  // ... existing fields
  custom_field: '',
  another_field: ''
};
```

### Validation
Add custom validation logic in the `handleSave` function:

```jsx
const handleSave = async () => {
  // Custom validation
  const errors = [];
  businessInfos.forEach((business, index) => {
    if (!business.business_name.trim()) {
      errors.push(`Business ${index + 1}: Name is required`);
    }
  });

  if (errors.length > 0) {
    toast.error(errors.join('\n'));
    return;
  }

  // Proceed with save...
};
```

## Error Handling

The component handles various error scenarios:

- **Network errors**: Connection issues
- **Authentication errors**: Token expiry
- **Validation errors**: Missing required fields
- **Server errors**: Backend validation failures

All errors are displayed using toast notifications and logged to the console.

## Performance Considerations

- **Lazy loading**: Data is only fetched when the modal opens
- **Efficient updates**: Only changed fields are sent to the server
- **Memory management**: Form data is properly cleaned up on unmount
- **Debounced saves**: Consider adding debouncing for auto-save features

## Security Notes

- All API calls require authentication
- Sensitive data is handled securely
- Form validation prevents malicious input
- CORS configuration should be properly set up

## Testing

Test the following scenarios:

1. **Adding new business info**: Multiple businesses
2. **Editing existing data**: Load and modify existing records
3. **Removing entries**: Delete business/income/property entries
4. **Form validation**: Required fields and data types
5. **API integration**: Both POST and GET operations
6. **Error handling**: Network failures and validation errors
7. **Responsive design**: Mobile and desktop layouts

## Future Enhancements

Possible improvements:

- **Auto-save**: Save drafts automatically
- **File uploads**: Attach business documents
- **Templates**: Pre-filled business type templates
- **Bulk operations**: Import/export business data
- **Audit trail**: Track changes and modifications
- **Advanced validation**: Business rule validation
