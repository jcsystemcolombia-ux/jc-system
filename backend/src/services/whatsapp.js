const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

let client = null
let reconectando = false

const conectarWhatsApp = async () => {
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './whatsapp-session'
    }),
  puppeteer: {
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
}
  })

  client.on('qr', (qr) => {
    console.log('\n📱 Escanea este QR con WhatsApp:\n')
    qrcode.generate(qr, { small: true })
  })

  client.on('ready', () => {
    console.log('✅ WhatsApp conectado exitosamente')
    reconectando = false
  })

  client.on('disconnected', async (reason) => {
    console.log('WhatsApp desconectado:', reason)
    client = null
    if (!reconectando) {
      reconectando = true
      console.log('🔄 Reconectando WhatsApp en 10 segundos...')
      setTimeout(async () => {
        try {
          await conectarWhatsApp()
        } catch (error) {
          console.error('Error reconectando WhatsApp:', error)
          reconectando = false
        }
      }, 10000)
    }
  })

  client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación WhatsApp:', msg)
    client = null
  })

  await client.initialize()
}

const enviarMensaje = async (telefono, mensaje, intentos = 3) => {
  try {
    if (!client) {
      console.log('⚠️ WhatsApp no está conectado, mensaje no enviado')
      return false
    }

    const estado = await client.getState().catch(() => null)
    
    if (estado !== 'CONNECTED') {
      if (intentos > 0) {
        console.log(`⚠️ WhatsApp no está CONNECTED (${estado}), reintentando en 5s... (${intentos} intentos restantes)`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        return enviarMensaje(telefono, mensaje, intentos - 1)
      }
      console.log('⚠️ WhatsApp no disponible después de reintentos')
      return false
    }

    const numero = `57${telefono}@c.us`
    await client.sendMessage(numero, mensaje)
    console.log(`✅ Mensaje enviado a ${telefono}`)
    return true
  } catch (error) {
    console.error('Error enviando mensaje:', error.message)
    if (error.message?.includes('detached Frame') || error.message?.includes('Session closed')) {
      console.log('🔄 Frame desconectado — marcando cliente como desconectado')
      client = null
      if (!reconectando) {
        reconectando = true
        setTimeout(async () => {
          try {
            await conectarWhatsApp()
          } catch (e) {
            console.error('Error reconectando:', e)
            reconectando = false
          }
        }, 10000)
      }
    }
    return false
  }
}

const getClient = () => client

module.exports = { conectarWhatsApp, enviarMensaje, getClient }