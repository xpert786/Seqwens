// Test script to verify business codes API integration
import { getBusinessSuggestions, validateBusinessInput, getBusinessCategories } from './src/ClientOnboarding/utils/businessCodes.js';

async function testBusinessCodesAPI() {
  console.log('🧪 Testing Business Codes API Integration...\n');

  try {
    // Test 1: Search for consulting
    console.log('1️⃣ Testing search for "consulting":');
    const suggestions = await getBusinessSuggestions('consulting');
    console.log(`   Found ${suggestions.length} suggestions`);
    if (suggestions.length > 0) {
      console.log(`   First result: ${suggestions[0].title} (NAICS: ${suggestions[0].naics_code})`);
    }

    // Test 2: Validate user input
    console.log('\n2️⃣ Testing input validation for "web development":');
    const validation = await validateBusinessInput('web development');
    console.log(`   Validation successful: ${validation.success}`);
    if (validation.success && validation.data) {
      console.log(`   Is valid: ${validation.data.is_valid}`);
      console.log(`   Confidence: ${validation.data.confidence}`);
    }

    // Test 3: Get categories
    console.log('\n3️⃣ Testing categories retrieval:');
    const categories = await getBusinessCategories();
    console.log(`   Found ${categories.length} categories`);
    if (categories.length > 0) {
      console.log(`   First few categories: ${categories.slice(0, 3).join(', ')}`);
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBusinessCodesAPI();

