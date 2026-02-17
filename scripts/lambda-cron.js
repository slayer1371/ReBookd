const https = require('https');

// Configuration
// In AWS Lambda, set these as Environment Variables
const CONFIG = {
  API_URL: process.env.API_URL || 'https://re-bookd.vercel.app/api/cron/expire',
  CRON_SECRET: process.env.CRON_SECRET || 'your-secret-token',
};

exports.handler = async (event) => {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.API_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443, // HTTPS default
      path: url.pathname + url.search,
      method: "POST", // The API route expects POST
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.CRON_SECRET}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response Body: ${body}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: 200,
            body: JSON.stringify({ message: 'Cron triggered successfully', apiResponse: body })
          });
        } else {
          reject(new Error(`API returned status code: ${res.statusCode}. Body: ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Request Error: ${e.message}`);
      reject(e);
    });

    // End the request
    req.end();
  });
};
