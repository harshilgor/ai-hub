import axios from 'axios';

const FASTAPI_URL = 'https://transcripter-api.onrender.com/transcript';
const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

console.log('Testing FastAPI Transcriptor Service...');
console.log(`URL: ${FASTAPI_URL}`);
console.log(`Video: ${testVideoUrl}\n`);

try {
  const response = await axios.get(
    `${FASTAPI_URL}?url=${encodeURIComponent(testVideoUrl)}`,
    { timeout: 30000 }
  );
  
  if (response.data && response.data.transcript) {
    console.log('✅ SUCCESS!');
    console.log(`Transcript length: ${response.data.transcript.length} characters`);
    console.log(`Preview: ${response.data.transcript.substring(0, 200)}...`);
  } else {
    console.log('⚠️ Response received but no transcript field');
    console.log('Response:', JSON.stringify(response.data));
  }
} catch (error) {
  console.log('❌ ERROR:', error.message);
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', error.response.data);
  }
}

