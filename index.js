const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client, CustomStatus, RichPresence } = require('discord.js-selfbot-v13');
require('dotenv').config();

// ============================================================
// CONFIGURACIÓN Y ARCHIVOS
// ============================================================
const CONFIG_FILE = path.join(__dirname, 'config.json');
const SAVE_FILE = path.join(__dirname, 'save_progress.json');

// Configuración de respaldo por defecto
const DEFAULT_CONFIG = {
    client_id: "1544000490713518100",
    name: "¡Ⲧⲟ𝖽α⳽  Ⲙıⲉⲛⲧⲉⲛ!",
    loading: {
        enabled: true,
        text: "Cargando mentiras...",
        start: 0,
        end: 100,
        step: 10,
        interval: 3
    },
    final_animation: {
        enabled: true,
        texts: [
            { text: "⚠️ ¡Todas sois iguales! ⚠️", duration: 3 },
            { text: "💔 ¡Qué lástima dais! 💔", duration: 3 },
            { text: "⚠️ ¡Todas son mentirosas! ⚠️", duration: 3 },
            { text: "💔 ¡Qué lástima dais, de verdad! 💔", duration: 3 }
        ]
    },
    state: "",
    large_image: "https://cdn.discordapp.com/avatars/1308814761269395527/a_fe716a1a5c62b65cd0f6024b2911b061.webp?size=1024&animated=true",
    large_text: "𝑻𝒐𝒅𝒂𝒔 𝑴𝒊𝒆𝒏𝒕𝒆𝒏, 𝒚 𝒍𝒐 𝒔𝒂𝒃𝒆𝒔",
    small_image: "https://i.ibb.co/Mm7y46n/36m5Vn-E.gif",
    small_text: "",
    sync: {
        confirmation_delay: 0.75,
        retry_delay: 1.0,
        max_retries: 10
    }
};

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('⚠️ Error al leer config.json, usando valores por defecto:', err.message);
    }
    return DEFAULT_CONFIG;
}

let config = loadConfig();

// ============================================================
// CONTADOR FIJADO EN 51.967 HORAS (51967 * 3600 segundos)
// ============================================================
const FIXED_HOURS = 51967;
const FIXED_ACCUMULATED_SECONDS = FIXED_HOURS * 3600; // 187,081,200 segundos

function loadSavedProgress() {
    let lastIndex = 0;
    let accumulatedSeconds = FIXED_ACCUMULATED_SECONDS;
    try {
        if (fs.existsSync(SAVE_FILE)) {
            const data = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf-8'));
            if (data.last_index !== undefined) lastIndex = parseInt(data.last_index, 10);
            if (data.accumulated_seconds !== undefined) {
                accumulatedSeconds = parseFloat(data.accumulated_seconds);
            }
        }
    } catch (err) {
        console.warn('⚠️ No se pudo leer save_progress.json, usando valores iniciales.');
    }
    // Si no tiene el valor de 999999 horas o es inferior al fijado, aseguramos el fijado
    if (!accumulatedSeconds || accumulatedSeconds < FIXED_ACCUMULATED_SECONDS) {
        accumulatedSeconds = FIXED_ACCUMULATED_SECONDS;
    }
    return { lastIndex, accumulatedSeconds };
}

function saveCurrentProgress(index = null, accumulatedSeconds = null) {
    try {
        let data = {};
        if (fs.existsSync(SAVE_FILE)) {
            try {
                data = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf-8'));
            } catch (_) {}
        }
        if (index !== null) data.last_index = parseInt(index, 10);
        if (accumulatedSeconds !== null) data.accumulated_seconds = parseFloat(accumulatedSeconds);
        fs.writeFileSync(SAVE_FILE, JSON.stringify(data, null, 4), 'utf-8');
    } catch (err) {
        console.error('⚠️ Error al guardar progreso:', err.message);
    }
}

// Inicialización de tiempo con 999.999 horas fijadas
const { lastIndex: initialIndex, accumulatedSeconds: initialAccumulated } = loadSavedProgress();
const sessionStartTime = Date.now() - (initialAccumulated * 1000);
const startTimestamp = new Date(sessionStartTime);

// Guardamos inicialmente el progreso
saveCurrentProgress(initialIndex, initialAccumulated);

// ============================================================
// SERVIDOR WEB DUMMY PARA RENDER (24/7 KEEP-ALIVE)
// ============================================================
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const uptimeSeconds = (Date.now() - sessionStartTime) / 1000;
    const hours = (uptimeSeconds / 3600).toFixed(2);
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Discord Rich Presence - 24/7</title>
            <style>
                body { background: #080a0f; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: #10131b; border: 1.5px solid #ff1744; border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 0 25px rgba(255,23,68,0.4); }
                h1 { color: #ff1744; margin-bottom: 10px; }
                p { color: #8b949e; font-size: 14px; margin: 6px 0; }
                .status { color: #00ff88; font-weight: bold; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>¡Ⲧⲟ𝖽α⳽  Ⲙıⲉⲛⲧⲉⲛ!</h1>
                <p class="status">🟢 Rich Presence Activa & Online</p>
                <p>Tiempo de juego acumulado: <strong>${hours} horas</strong></p>
                <p>Render Dummy Server OK</p>
            </div>
        </body>
        </html>
    `);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const nextPort = Number(PORT) + 1;
        console.warn(`⚠️ Puerto ${PORT} en uso, intentando en puerto ${nextPort}...`);
        server.listen(nextPort, () => {
            console.log(`🌐 Servidor dummy de Render iniciado en el puerto ${nextPort}`);
        });
    } else {
        console.error('❌ Error en el servidor HTTP:', err.message);
    }
});

server.listen(PORT, () => {
    console.log(`🌐 Servidor dummy de Render iniciado en el puerto ${PORT}`);
});

// ============================================================
// CLIENTE DISCORD (discord.js-selfbot-v13)
// ============================================================
const client = new Client({ checkUpdate: false });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================
// ASSETS EXTERNOS (REGISTRO DINÁMICO CON DISCORD)
// ============================================================
const LARGE_IMAGE_RAW = config.large_image || "https://cdn.discordapp.com/avatars/1308814761269395527/a_fe716a1a5c62b65cd0f6024b2911b061.webp?size=1024&animated=true";
const SMALL_IMAGE_RAW = config.small_image || "https://i.ibb.co/Mm7y46n/36m5Vn-E.gif";

let cachedLargeAsset = null;
let cachedSmallAsset = null;

async function registerExternalAssets() {
    try {
        const imagesToRegister = [];
        if (LARGE_IMAGE_RAW) imagesToRegister.push(LARGE_IMAGE_RAW);
        if (SMALL_IMAGE_RAW) imagesToRegister.push(SMALL_IMAGE_RAW);

        if (imagesToRegister.length > 0) {
            const ext = await RichPresence.getExternal(client, config.client_id, ...imagesToRegister);
            if (Array.isArray(ext)) {
                if (ext[0] && ext[0].external_asset_path) cachedLargeAsset = ext[0].external_asset_path;
                if (ext[1] && ext[1].external_asset_path) cachedSmallAsset = ext[1].external_asset_path;
            }
            console.log('✅ Assets externos registrados con éxito en Discord.');
        }
    } catch (err) {
        console.warn('⚠️ No se pudo registrar mediante getExternal, usando rutas directas:', err.message);
        cachedLargeAsset = LARGE_IMAGE_RAW;
        cachedSmallAsset = SMALL_IMAGE_RAW;
    }
}

async function setActivity(detail) {
    try {
        const pr = new RichPresence(client)
            .setApplicationId(config.client_id)
            .setType('PLAYING')
            .setName(config.name || '¡Ⲧⲟ𝖽α⳽  Ⲙıⲉⲛⲧⲉⲛ!')
            .setStartTimestamp(startTimestamp);

        if (detail) {
            pr.setDetails(detail);
        }
        if (config.state) {
            pr.setState(config.state);
        }

        // Asignación de imagen grande animada
        if (cachedLargeAsset) {
            pr.setAssetsLargeImage(cachedLargeAsset);
            if (config.large_text) {
                pr.setAssetsLargeText(config.large_text);
            }
        }

        // Asignación de imagen pequeña animada
        if (cachedSmallAsset) {
            pr.setAssetsSmallImage(cachedSmallAsset);
            if (config.small_text) {
                pr.setAssetsSmallText(config.small_text);
            }
        }

        client.user.setActivity(pr);
        client.user.setPresence({ status: 'online' });
    } catch (err) {
        console.error('❌ Error al actualizar actividad en Discord:', err.message);
    }
}

// ============================================================
// ANIMACIONES Y BUCLES DE PRESENCIA (RESPETANDO RATE LIMIT DE DISCORD)
// ============================================================
// Discord aplica rate limit en Gateway si se envían presencias con menos de 4s de diferencia.
// Usamos un mínimo de 4.5s para garantizar que CADA porcentaje y frase se muestre sin saltos.
const SAFE_MIN_INTERVAL = 4.5;

// 1. Fase de Carga (0% -> 100%)
async function runLoading() {
    const loading = config.loading || {};
    if (!loading.enabled) return;

    const text = loading.text || 'Cargando...';
    let start = parseInt(loading.start ?? 0, 10);
    let end = parseInt(loading.end ?? 100, 10);
    let step = parseInt(loading.step ?? 10, 10);
    let interval = Math.max(SAFE_MIN_INTERVAL, parseFloat(loading.interval ?? 4.5));

    if (step <= 0) step = 10;
    if (end < start) end = start;

    let progress = start;
    while (progress <= end) {
        const detail = `❤️ ${text} (${progress}%) 💢`;
        console.log(`[CARGANDO] [${progress}%/100%] -> ${detail}`);
        await setActivity(detail);

        // Guardar tiempo acumulado actualizado
        const currentElapsed = (Date.now() - sessionStartTime) / 1000;
        saveCurrentProgress(0, currentElapsed);

        if (progress >= end) {
            // Espera final en el 100% antes de pasar a las frases
            await sleep(interval * 1000);
            break;
        }

        await sleep(interval * 1000);
        progress += step;
        if (progress > end) progress = end;
    }
}

// 2. Animación de frases finales
async function runFinalAnimation() {
    const finalAnim = config.final_animation || {};
    if (!finalAnim.enabled) return;

    const texts = finalAnim.texts || [];
    if (!texts.length) return;

    const total = texts.length;
    for (let idx = 0; idx < total; idx++) {
        const item = texts[idx];
        const detail = typeof item === 'object' ? (item.text || '') : String(item);
        const configuredDur = typeof item === 'object' ? parseFloat(item.duration || 4.5) : 4.5;
        const duration = Math.max(SAFE_MIN_INTERVAL, configuredDur);

        console.log(`[ANIMACIÓN] [Paso ${idx + 1}/${total}] -> ${detail}`);
        saveCurrentProgress(idx, (Date.now() - sessionStartTime) / 1000);

        await setActivity(detail);
        await sleep(duration * 1000);
    }

    saveCurrentProgress(0, (Date.now() - sessionStartTime) / 1000);
}

// 3. Ciclo Completo Infinito
async function startPresenceLoop() {
    console.log('🔄 Iniciando bucle continuo de Rich Presence...');
    while (true) {
        try {
            config = loadConfig();
            await runLoading();
            config = loadConfig();
            await runFinalAnimation();
        } catch (err) {
            console.error('❌ Error en el ciclo de animación:', err);
            await sleep(5000);
        }
    }
}

// ============================================================
// EVENTOS DISCORD
// ============================================================
client.on('ready', async () => {
    console.log(`\n==================================================`);
    console.log(`🌴 CONECTADO A DISCORD COMO: ${client.user.tag}`);
    console.log(`⏱️  Contador fijado: ${FIXED_HOURS.toLocaleString()} horas (${(initialAccumulated / 3600).toFixed(2)}h acumuladas)`);
    console.log(`==================================================\n`);

    await registerExternalAssets();
    startPresenceLoop();
});

// ============================================================
// CIERRE LIMPIO E INSTANTÁNEO DE LA PRESENCIA
// ============================================================
let isShuttingDown = false;

async function cleanupAndExit(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n🛑 Recibida señal ${signal}. Limpiando actividad de Discord inmediatamente...`);
    try {
        if (client && client.user) {
            // Vaciar actividades y estado para eliminarlo al instante de los servidores de Discord
            client.user.setPresence({ activities: [], status: 'invisible' });
            await sleep(350);
            client.destroy();
        }
        console.log('✅ Actividad eliminada correctamente de tu perfil.');
    } catch (err) {
        console.error('⚠️ Error al limpiar presencia:', err.message);
    } finally {
        process.exit(0);
    }
}

process.on('SIGINT', () => cleanupAndExit('SIGINT'));
process.on('SIGTERM', () => cleanupAndExit('SIGTERM'));
process.on('SIGHUP', () => cleanupAndExit('SIGHUP'));
process.on('message', (msg) => {
    if (msg === 'shutdown') cleanupAndExit('message');
});

// Obtención del token desde variables de entorno o fallback directo
const TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN || "MTMwODgxNDc2MTI2OTM5NTUyNw.G6s7Pd.a2zjqNVRGCaaWLx2uovuKU0CA_KDKnqly-m6uM";

if (!TOKEN) {
    console.warn('⚠️ No se encontró la variable DISCORD_TOKEN en .env o en el entorno.');
    console.warn('ℹ️ Por favor agrega DISCORD_TOKEN=tu_token_aqui en un archivo .env o en las variables de entorno de Render.');
} else {
    client.login(TOKEN).catch(err => {
        console.error('❌ Error al iniciar sesión en Discord:', err.message);
    });
}
