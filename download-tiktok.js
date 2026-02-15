#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Download TikTok Videos
// @raycast.mode fullOutput
// @raycast.packageName TikTok Downloader

// Optional parameters:
// @raycast.icon 🎵
// @raycast.argument1 { "type": "text", "placeholder": "Paste TikTok URLs (space or newline separated)" }
// @raycast.argument2 { "type": "dropdown", "placeholder": "Method", "data": [{"title": "API (Fast)", "value": "api"}, {"title": "yt-dlp (Reliable)", "value": "ytdlp"}], "optional": false }

// Documentation:
// @raycast.description Download TikTok videos - paste URLs separated by space or newline
// @raycast.author Nishchal

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);
const DOWNLOAD_DIR = path.join(os.homedir(), 'Downloads', 'tiktok videos');
const YTDLP_PATH = '/Users/nishchalasri/Tiktok dashboard/bulk-downloader/bin/yt-dlp';

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function downloadWithAPI(url) {
    console.log(`📥 [API] Fetching: ${url}`);

    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;

    return new Promise((resolve, reject) => {
        https.get(apiUrl, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                try {
                    const json = JSON.parse(data);

                    if (json.code !== 0 || !json.data) {
                        throw new Error(json.msg || 'Failed to fetch video');
                    }

                    const videoData = json.data;
                    const videoUrl = videoData.hdplay || videoData.play;

                    if (!videoUrl) {
                        throw new Error('No video URL found');
                    }

                    const author = videoData.author?.unique_id || 'tiktok';
                    const title = videoData.title ? videoData.title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '') : 'video';
                    const filename = `${author} - ${title} - ${Date.now()}.mp4`;
                    const filepath = path.join(DOWNLOAD_DIR, filename);

                    console.log(`⬇️  Downloading: ${filename}`);

                    await downloadFile(videoUrl, filepath);

                    console.log(`✅ Downloaded: ${filename}`);
                    resolve(filename);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

async function downloadWithYtDlp(url) {
    console.log(`📥 [yt-dlp] Fetching: ${url}`);

    const command = `"${YTDLP_PATH}" -o "%(title)s [%(id)s].%(ext)s" --no-playlist --paths "${DOWNLOAD_DIR}" "${url}" 2>&1`;

    try {
        const { stdout } = await execPromise(command);

        // Extract filename from output
        const match = stdout.match(/Destination:.*\/([^\/\n]+)$/m) || stdout.match(/\[download\].*\/([^\/\n]+\.mp4)/);
        const filename = match ? match[1] : 'video.mp4';

        console.log(`✅ Downloaded: ${filename}`);
        return filename;
    } catch (error) {
        throw new Error(`yt-dlp failed: ${error.message}`);
    }
}

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });

        file.on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function main() {
    try {
        const urls = process.argv[2] || '';
        const method = process.argv[3] || 'api';

        if (!urls || !urls.trim()) {
            console.error('❌ Please paste TikTok URLs');
            process.exit(1);
        }

        // Split by newlines OR spaces and filter TikTok URLs
        const urlList = urls
            .split(/[\n\s]+/)
            .filter(u => u.trim().includes('tiktok.com'))
            .map(u => u.trim());

        if (urlList.length === 0) {
            console.error('❌ No valid TikTok URLs found');
            process.exit(1);
        }

        console.log(`📝 Found ${urlList.length} URL(s)`);
        console.log(`🔧 Method: ${method === 'ytdlp' ? 'yt-dlp' : 'API'}`);
        console.log(`⚡ Downloading ONE AT A TIME (not parallel)...\n`);

        let successCount = 0;
        let failCount = 0;

        // Download ONE AT A TIME (sequential, not parallel)
        for (let i = 0; i < urlList.length; i++) {
            const url = urlList[i];
            console.log(`[${i + 1}/${urlList.length}]`);

            try {
                if (method === 'ytdlp') {
                    await downloadWithYtDlp(url);
                } else {
                    await downloadWithAPI(url);
                }
                successCount++;
            } catch (error) {
                console.error(`❌ Failed: ${error.message}`);
                failCount++;
            }

            // Small delay between requests (API needs 1sec+ between calls)
            if (i < urlList.length - 1 && method === 'api') {
                await new Promise(resolve => setTimeout(resolve, 1100));
            }
        }

        console.log(`\n🎉 Done! ✅ ${successCount} success, ❌ ${failCount} failed`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

main();
