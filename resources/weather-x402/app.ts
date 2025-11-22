import { config } from 'dotenv';
import express from 'express';
import { paymentMiddleware } from 'x402-express';
import { facilitator } from '@coinbase/x402';
import { createHash } from 'crypto';
import { privateKeyToAccount } from 'viem/accounts';
import { hashMessage } from 'viem';

config();

const payTo = process.env.ADDRESS as `0x${string}`;
let merchantPrivateKey = process.env.MERCHANT_PK;

if (!payTo) {
  throw new Error('Missing required environment variable: ADDRESS');
}

if (!merchantPrivateKey) {
  throw new Error('Missing required environment variable: MERCHANT_PK');
}

// Ensure private key has 0x prefix and remove any whitespace
merchantPrivateKey = merchantPrivateKey.trim();
if (!merchantPrivateKey.startsWith('0x')) {
  merchantPrivateKey = `0x${merchantPrivateKey}`;
}

const merchantAccount = privateKeyToAccount(merchantPrivateKey as `0x${string}`);
const merchantPublicKey = merchantAccount.address;

const app = express();

app.use(
  paymentMiddleware(
    payTo,
    {
      'GET /weather': {
        price: '$0.001',
        network: 'base',
      },
    },
    facilitator
  )
);

// Mock weather data generator
function generateMockWeather(location: string, date: string) {
  const conditions = ['sunny', 'cloudy', 'rainy', 'partly cloudy', 'stormy', 'snowy'];
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const seed = hashCode(location + date);
  const conditionIndex = seed % conditions.length;
  const temperature = 32 + (seed % 68);
  const humidity = 30 + (seed % 70);
  const windSpeed = seed % 30;

  return {
    location,
    date,
    conditions: conditions[conditionIndex],
    temperature,
    temperatureUnit: 'F',
    humidity,
    windSpeed,
    windSpeedUnit: 'mph',
  };
}

// x402 metadata endpoint
app.get('/.well-known/x402', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const resourceUrl = `${protocol}://${host}/weather`;

  res.json({
    x402Version: 1,
    accepts: [
      {
        scheme: 'exact',
        network: 'base',
        maxAmountRequired: '1000',
        resource: resourceUrl,
        description:
          'Mock weather API providing weather data for any location and date. Returns temperature, conditions, humidity, and wind speed.',
        mimeType: 'application/json',
        payTo,
        maxTimeoutSeconds: 60,
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        outputSchema: {
          input: {
            type: 'http',
            method: 'GET',
            discoverable: true,
            queryParams: {
              location: {
                type: 'string',
                description: 'City or location name for weather data (e.g., "San Francisco", "Tokyo")',
                required: true,
              },
              date: {
                type: 'string',
                description: 'Date in YYYY-MM-DD format for weather data',
                required: true,
              },
            },
          },
          output: {
            requestId: {
              type: 'string',
              description: 'Unique request ID from the payment nonce (32-byte hex string)',
            },
            from: {
              type: 'string',
              description: 'Payer wallet address (extracted from payment authorization)',
            },
            to: {
              type: 'string',
              description: 'Recipient wallet address (extracted from payment authorization)',
            },
            data: {
              type: 'object',
              description: 'Weather report data',
              properties: {
                location: { type: 'string', description: 'The queried location' },
                date: { type: 'string', description: 'The queried date' },
                conditions: { type: 'string', description: 'Weather conditions' },
                temperature: { type: 'number', description: 'Temperature value' },
                temperatureUnit: { type: 'string', description: 'Temperature unit (F)' },
                humidity: { type: 'number', description: 'Humidity percentage' },
                windSpeed: { type: 'number', description: 'Wind speed value' },
                windSpeedUnit: { type: 'string', description: 'Wind speed unit (mph)' },
              },
            },
            dataHash: {
              type: 'string',
              description: 'SHA-256 hash of the data field (for verification)',
            },
            signature: {
              type: 'string',
              description: 'Cryptographic signature of the dataHash signed by merchant private key',
            },
            merchantPublicKey: {
              type: 'string',
              description: 'Merchant public key for signature verification',
            },
          },
        },
        extra: { name: 'USD Coin', version: '2' },
      },
    ],
  });
});

app.get('/weather', async (req, res) => {
  const location = req.query.location as string;
  const date = req.query.date as string;

  if (!location || !date) {
    return res.status(400).send({
      error: 'Missing required parameters: location and date',
    });
  }

  // Check if request is from a browser
  const userAgent = req.headers['user-agent'] || '';
  const acceptHeader = req.headers['accept'] || '';
  const isWebBrowser = acceptHeader.includes('text/html') && userAgent.includes('Mozilla');

  // Extract payment details from X-PAYMENT header (if available)
  // After x402-express middleware verifies payment, the header is still available
  const paymentHeader = req.headers['x-payment'] as string | undefined;
  let requestId: string = 'NO_PAYMENT_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  let from: string | undefined;
  let to: string | undefined;

  if (paymentHeader) {
    try {
      // X-PAYMENT header is base64 encoded
      const decodedPayment = Buffer.from(paymentHeader, 'base64').toString('utf-8');
      const paymentData = JSON.parse(decodedPayment);

      // The payment structure has a payload.authorization object with from, to, and nonce
      const authorization = paymentData.payload?.authorization;
      if (authorization) {
        requestId = authorization.nonce || requestId;
        from = authorization.from;
        to = authorization.to;
        console.log('📋 Payment details - Request ID:', requestId, 'From:', from, 'To:', to);
      } else {
        console.log('⚠️  No authorization object in payment header');
      }
    } catch (e) {
      console.log('⚠️  Failed to parse payment header:', e);
    }
  } else {
    console.log('⚠️  No X-PAYMENT header found, using generated request ID');
  }

  // Generate weather data
  const weatherData = generateMockWeather(location, date);

  // 50% chance ALL fields are corrupted
  const isFaulty = Math.random() < 0.5;

  if (isFaulty) {
    console.log('⚠️  Faulty response: ALL fields corrupted with NaN/invalid data');
    weatherData.conditions = undefined as any;
    weatherData.temperature = NaN;
    weatherData.temperatureUnit = undefined as any;
    weatherData.humidity = NaN;
    weatherData.windSpeed = NaN;
    weatherData.windSpeedUnit = undefined as any;
  } else {
    console.log('✅ Valid response: All fields contain good data');
  }

  // Create response structure (with possibly corrupted data)
  const data = {
    location: weatherData.location,
    date: weatherData.date,
    conditions: weatherData.conditions,
    temperature: weatherData.temperature,
    temperatureUnit: weatherData.temperatureUnit,
    humidity: weatherData.humidity,
    windSpeed: weatherData.windSpeed,
    windSpeedUnit: weatherData.windSpeedUnit,
  };

  // Hash the data (SHA-256)
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  const dataHash = createHash('sha256').update(dataString).digest('hex');

  // Sign the hash using merchant private key
  const signature = await merchantAccount.signMessage({
    message: dataHash,
  });

  // Prepare response data
  const responseData = {
    requestId,
    from,
    to,
    data,
    dataHash,
    signature,
    merchantPublicKey,
  };

  // If browser request, return formatted HTML
  if (isWebBrowser) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather Data - ${location}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .content { padding: 30px; }
    .weather-box {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
    }
    .weather-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    .weather-row:last-child { border-bottom: none; }
    .weather-label {
      font-weight: 600;
      color: #4a5568;
      font-size: 14px;
    }
    .weather-value {
      font-size: 18px;
      color: #2d3748;
      font-weight: 500;
    }
    .temperature { font-size: 32px !important; color: #667eea; }
    .details-box {
      background: #f7fafc;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      font-size: 12px;
      font-family: 'Courier New', monospace;
    }
    .detail-row {
      display: flex;
      margin-bottom: 8px;
      word-break: break-all;
    }
    .detail-label {
      font-weight: bold;
      color: #4a5568;
      min-width: 140px;
    }
    .detail-value { color: #2d3748; flex: 1; }
    .buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    button {
      flex: 1;
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }
    .btn-secondary:hover { background: #cbd5e0; }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }
    .status-valid { background: #48bb78; color: white; }
    .status-faulty { background: #f56565; color: white; }
    #copyNotification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #48bb78;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      display: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  </style>
</head>
<body>
  <div id="copyNotification">Copied to clipboard!</div>
  <div class="container">
    <div class="header">
      <h1>Weather Report</h1>
      <p>${location} • ${date}</p>
    </div>
    <div class="content">
      <div class="weather-box">
        <div class="weather-row">
          <span class="weather-label">Temperature</span>
          <span class="weather-value temperature">${data.temperature != null && !isNaN(data.temperature) ? data.temperature + '°' + data.temperatureUnit : 'N/A'}</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Conditions</span>
          <span class="weather-value">${data.conditions || 'N/A'}</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Humidity</span>
          <span class="weather-value">${data.humidity != null && !isNaN(data.humidity) ? data.humidity + '%' : 'N/A'}</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Wind Speed</span>
          <span class="weather-value">${data.windSpeed != null && !isNaN(data.windSpeed) ? data.windSpeed + ' ' + data.windSpeedUnit : 'N/A'}</span>
        </div>
      </div>

      ${!data.temperature || isNaN(data.temperature) || !data.conditions ?
        '<span class="status-badge status-faulty">⚠️ Faulty Data Detected</span>' :
        '<span class="status-badge status-valid">✓ Data Verified</span>'}

      <details style="margin-top: 20px;">
        <summary style="cursor: pointer; font-weight: 600; color: #4a5568; padding: 10px 0;">
          Payment & Verification Details
        </summary>
        <div class="details-box" style="margin-top: 10px;">
          ${requestId ? `<div class="detail-row"><span class="detail-label">Request ID:</span><span class="detail-value">${requestId}</span></div>` : ''}
          ${from ? `<div class="detail-row"><span class="detail-label">From (Payer):</span><span class="detail-value">${from}</span></div>` : ''}
          ${to ? `<div class="detail-row"><span class="detail-label">To (Recipient):</span><span class="detail-value">${to}</span></div>` : ''}
          <div class="detail-row"><span class="detail-label">Data Hash:</span><span class="detail-value">${dataHash}</span></div>
          <div class="detail-row"><span class="detail-label">Signature:</span><span class="detail-value">${signature}</span></div>
          <div class="detail-row"><span class="detail-label">Merchant Key:</span><span class="detail-value">${merchantPublicKey}</span></div>
        </div>
      </details>

      <div class="buttons">
        <button class="btn-secondary" onclick="window.history.back()">← Back</button>
        <button class="btn-primary" onclick="copyJSON()">Copy JSON Data</button>
      </div>
    </div>
  </div>

  <script>
    function copyJSON() {
      const data = ${JSON.stringify(responseData, null, 2)};
      navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
        const notification = document.getElementById('copyNotification');
        notification.style.display = 'block';
        setTimeout(() => {
          notification.style.display = 'none';
        }, 2000);
      });
    }
  </script>
</body>
</html>
    `;
    return res.send(html);
  }

  // For API requests, return JSON
  res.send(responseData);
});

// Start server when run directly (local development)
// Vercel serverless will import this as a module, not execute it directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(4021, () => {
    console.log(`Server listening at http://localhost:4021`);
  });
}

export default app;
