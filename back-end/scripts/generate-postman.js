import { writeFileSync } from 'fs';
import { generateCollection } from '../src/utils/postman.js';

// Generate the Postman collection
const collectionJSON = generateCollection();

// Write to file
writeFileSync('postman-collection.json', collectionJSON);


