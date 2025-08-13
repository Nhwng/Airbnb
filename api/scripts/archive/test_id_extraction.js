// Test the ID extraction function with real data

const extractListingId = (listing_id) => {
  if (typeof listing_id === 'object' && listing_id !== null) {
    if (listing_id.low !== undefined && listing_id.high !== undefined) {
      // MongoDB Int64 format - handle negative numbers correctly
      if (listing_id.unsigned === false && listing_id.high < 0) {
        // Handle negative high values
        return listing_id.low + (listing_id.high * Math.pow(2, 32));
      } else {
        // Handle positive values or unsigned
        return (listing_id.low >>> 0) + (listing_id.high * Math.pow(2, 32));
      }
    } else if (listing_id._id) {
      return listing_id._id;
    } else {
      return listing_id.toString();
    }
  }
  return listing_id;
};

// Test with the actual complex IDs from our API response
const testIds = [
  { input: {"low":687867055,"high":313489624,"unsigned":false}, expected: 1346427683403203800 },
  { input: {"low":-1287452346,"high":278520602,"unsigned":false}, expected: 1196236879859747000 },
  { input: {"low":-880530340,"high":263169834,"unsigned":false}, expected: 1130305833738185900 },
  { input: {"low":29791127,"high":269847035,"unsigned":false}, expected: 1158984190277358600 }
];

console.log('=== Testing ID Extraction Function ===');

testIds.forEach((test, i) => {
  const result = extractListingId(test.input);
  const matches = result === test.expected;
  
  console.log(`\n${i+1}. Input: ${JSON.stringify(test.input)}`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Got:      ${result}`);
  console.log(`   Match:    ${matches ? '✅' : '❌'}`);
  
  if (!matches) {
    console.log(`   Diff:     ${result - test.expected}`);
  }
});

// Test a simpler approach - just use the database's raw values
console.log('\n=== Alternative: Direct Number Conversion ===');
testIds.forEach((test, i) => {
  const low = test.input.low;
  const high = test.input.high;
  
  // Method 1: Simple bit shifting (what MongoDB likely uses internally)
  const method1 = low + (high * 4294967296); // 2^32
  
  // Method 2: Using BigInt for accurate large number handling
  const method2 = Number(BigInt(low) + (BigInt(high) << 32n));
  
  console.log(`\n${i+1}. Methods for ${JSON.stringify(test.input)}:`);
  console.log(`   Expected:  ${test.expected}`);
  console.log(`   Method 1:  ${method1} ${method1 === test.expected ? '✅' : '❌'}`);
  console.log(`   Method 2:  ${method2} ${method2 === test.expected ? '✅' : '❌'}`);
});