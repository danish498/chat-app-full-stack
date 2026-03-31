import { writeFileSync } from 'fs';
import { generateCollection } from '../src/utils/postman.js';

// Generate the Postman collection
const collectionJSON = generateCollection();

// Write to file
writeFileSync('postman-collection.json', collectionJSON);

console.log('✅ Postman collection generated successfully!');
console.log('📁 File saved as: postman-collection.json');
console.log('🚀 Import this file into Postman to test your API');
