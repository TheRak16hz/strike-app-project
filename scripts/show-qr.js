const qrcode = require('qrcode-terminal');
const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prioritize 192.168.x.x or 10.x.x.x addresses typical for LAN
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address;
        }
      }
    }
  }
  // Fallback to first non-internal IPv4 found
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const url = `http://${localIp}:5173`;

console.log('\n📱 ¡Escanea este QR para abrir la app en tu móvil!');
console.log(`🔗 URL: ${url}\n`);

qrcode.generate(url, { small: true });

console.log('\n(Asegúrate de que tu móvil esté en la misma red Wi-Fi)\n');
