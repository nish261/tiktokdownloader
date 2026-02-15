# TikTok Downloader for Raycast

Download TikTok videos directly from Raycast. Supports bulk downloads with two methods.

## Installation

1. Install [Raycast](https://raycast.com/)
2. Clone this repo or download `download-tiktok.js`
3. Add the script to Raycast: Raycast → Settings → Extensions → Script Commands → Add Script Directory

## Usage

1. Open Raycast
2. Type "Download TikTok"
3. Paste TikTok URLs (space or newline separated)
4. Choose method:
   - **API (Fast)** - Uses tikwm.com API
   - **yt-dlp (Reliable)** - Uses yt-dlp binary

Videos save to `~/Downloads/tiktok videos/`

## Requirements

- Node.js
- yt-dlp (optional, for yt-dlp method)

## Install yt-dlp

```bash
pip install yt-dlp
# or
brew install yt-dlp
```

Then update the `YTDLP_PATH` in the script to your yt-dlp location:
```bash
which yt-dlp
```

## License

MIT
