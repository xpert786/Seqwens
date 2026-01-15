// Quick test for business codes functionality
import { getBusinessSuggestions, BUSINESS_TYPES } from './src/ClientOnboarding/utils/businessCodes.js';

console.log('Testing Business Codes:');
console.log('Total business types:', BUSINESS_TYPES.length);

// Test suggestions
const testTerms = ['web', 'doctor', 'lawyer', 'consultant', 'driver'];

testTerms.forEach(term => {
  const suggestions = getBusinessSuggestions(term);
  console.log(`\nSuggestions for "${term}":`);
  suggestions.slice(0, 3).forEach(suggestion => {
    console.log(`  - ${suggestion.displayText} (NAICS: ${suggestion.code})`);
  });
});

console.log('\nTest completed successfully!');


