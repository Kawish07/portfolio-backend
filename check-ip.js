// check-ip.js
import https from 'https';

const getPublicIP = () => {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.ip);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const checkIP = async () => {
  try {
    const ip = await getPublicIP();
    console.log('🌐 Your current public IP address is:', ip);
    console.log('📋 Steps to whitelist this IP in MongoDB Atlas:');
    console.log('1. Go to https://cloud.mongodb.com/');
    console.log('2. Select your project');
    console.log('3. Go to Security → Network Access');
    console.log('4. Click "Add IP Address"');
    console.log(`5. Add this IP: ${ip}`);
    console.log('6. Or add 0.0.0.0/0 for development (allows all IPs)');
    console.log('7. Click "Confirm"');
    console.log('8. Wait for the status to show "Active" (green dot)');
  } catch (error) {
    console.error('❌ Error getting IP:', error.message);
    console.log('🔧 Alternative: Run this command to get your IP:');
    console.log('   curl ifconfig.me');
  }
};

checkIP();