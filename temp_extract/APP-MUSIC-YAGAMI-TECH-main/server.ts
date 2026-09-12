import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import axios from 'axios';
import archiver from "archiver";
import fs from 'fs';
import util from 'util';






dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const qobuzAppId = process.env.QOBUZ_APP_ID || process.env.VITE_QOBUZ_APP_ID || '';
const qobuzSecret = process.env.QOBUZ_SECRET || process.env.VITE_QOBUZ_APP_SECRET || '';
let qobuzToken = '';
try {
  const tokens = JSON.parse(process.env.QOBUZ_AUTH_TOKENS || '[]');
  if (tokens.length > 0) qobuzToken = tokens[0];
  if (!qobuzToken) qobuzToken = process.env.VITE_QOBUZ_USER_TOKEN || '';
} catch(e) {
  console.error("Failed to parse QOBUZ_AUTH_TOKENS");
}
const qobuzApiBase = 'https://www.qobuz.com/api.json/0.2/';

// Helper to interact with Qobuz API
async function qobuzSearch(query: string, limit = 50, offset = 0, type?: string) {
  if (!qobuzAppId) return { error: 'QOBUZ_APP_ID not configured.' };
  
  try {
    let url = `${qobuzApiBase}catalog/search`;
    if (type === 'tracks') url = `${qobuzApiBase}track/search`;
    if (type === 'albums') url = `${qobuzApiBase}album/search`;
    if (type === 'artists') url = `${qobuzApiBase}artist/search`;
    if (type === 'playlists') url = `${qobuzApiBase}playlist/search`;
    const response = await axios.get(url, {
      params: { query, limit, offset },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Qobuz search error:', error?.response?.data || error.message);
    return { error: 'Failed to search Qobuz' };
  }
}

app.get('/api/featured', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  const type = req.query.type || 'new-releases';
  try {
    const response = await axios.get(`${qobuzApiBase}album/getFeatured`, {
      params: { type, limit: req.query.limit || 50, genre_id: req.query.genre_id },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Qobuz featured error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get featured albums', details: error?.response?.data });
  }
});



app.get('/api/favorites', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  try {
    const type = req.query.type || 'albums'; // albums, artists, tracks
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;
    const response = await axios.get(`${qobuzApiBase}favorite/getUserFavorites`, {
      params: { type, limit, offset },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Qobuz favorites error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get favorites', details: error?.response?.data });
  }
});

app.get('/api/user/playlists', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  try {
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;
    const response = await axios.get(`${qobuzApiBase}playlist/getUserPlaylists`, {
      params: { limit, offset },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Qobuz user playlists error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get user playlists', details: error?.response?.data });
  }
});


app.get('/api/artist', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  const { artist_id, limit, offset } = req.query;
  try {
    const response = await axios.get(`${qobuzApiBase}artist/get`, {
      params: { artist_id, extra: 'albums,tracks', limit: 200, offset: 0 }, // Fetch all we can
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Qobuz artist error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get artist', details: error?.response?.data });
  }
});

app.get('/api/playlist', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  const { playlist_id, limit, offset } = req.query;
  try {
    const params: any = { playlist_id, extra: 'tracks' };
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await axios.get(`${qobuzApiBase}playlist/get`, {
      params,
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Qobuz playlist error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

app.get('/api/playlists', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  try {
    const response = await axios.get(`${qobuzApiBase}playlist/getFeatured`, {
      params: { type: 'editor-picks', limit: req.query.limit || 50 },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Qobuz playlists error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get playlists', details: error?.response?.data });
  }
});

app.get('/api/search', async (req, res) => {
  const { q, limit, offset, type } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }
  const results = await qobuzSearch(q as string, parseInt(limit as string) || 50, parseInt(offset as string) || 0, type as string);
  res.json(results);
});

app.get('/api/stream', async (req, res) => {
  const { track_id, format_id = '5' } = req.query;
  if (!track_id) return res.status(400).json({ error: 'track_id is required' });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: 'Qobuz credentials not configured' });

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const r_sig = `trackgetFileUrlformat_id${format_id}intentstreamtrack_id${track_id}${timestamp}${qobuzSecret}`;
    const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');

    const response = await axios.get(`${qobuzApiBase}track/getFileUrl`, {
      params: {
        format_id: format_id,
        intent: 'stream',
        track_id: track_id,
        request_ts: timestamp,
        request_sig: r_sig_hashed
      },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Qobuz stream error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get stream URL', details: error?.response?.data });
  }
});

app.get('/api/album', async (req, res) => {
  const { album_id } = req.query;
  if (!album_id) return res.status(400).json({ error: 'album_id is required' });
  if (!qobuzAppId) return res.status(400).json({ error: 'Qobuz credentials not configured' });

  try {
    const response = await axios.get(`${qobuzApiBase}album/get`, {
      params: { album_id },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Qobuz album error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get album details' });
  }
});

app.get('/api/downloadUrl', async (req, res) => {
  const { track_id, format_id } = req.query;
  if (!track_id || !format_id) return res.status(400).json({ error: 'track_id and format_id are required' });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: 'Qobuz credentials not configured' });

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const r_sig = `trackgetFileUrlformat_id${format_id}intentstreamtrack_id${track_id}${timestamp}${qobuzSecret}`;
    const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');

    const response = await axios.get(`${qobuzApiBase}track/getFileUrl`, {
      params: {
        format_id: format_id,
        intent: 'stream',
        track_id: track_id,
        request_ts: timestamp,
        request_sig: r_sig_hashed
      },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Qobuz download error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});


import { exec } from 'child_process';

const execPromise = util.promisify(exec);

app.get('/api/downloadWithMetadata', async (req, res) => {
  const { track_id, format_id } = req.query;
  if (!track_id || !format_id) return res.status(400).json({ error: 'track_id and format_id are required' });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: 'Qobuz credentials not configured' });

  const ext = format_id === '5' ? 'mp3' : 'flac';
  const rawPath = path.join('/tmp', `${track_id}_raw.${ext}`);
  const coverPath = path.join('/tmp', `${track_id}_cover.jpg`);
  const finalPath = path.join('/tmp', `${track_id}_final.${ext}`);

  const cleanup = () => {
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  };

  try {
    // 1. Get Track Info for Metadata
    const trackInfo = await axios.get(`${qobuzApiBase}track/get`, {
      params: { track_id },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    const t = trackInfo.data;
    const title = t.title || 'Unknown Title';
    const artist = t.performer?.name || t.artist?.name || 'Unknown Artist';
    const album = t.album?.title || 'Unknown Album';
    const trackNum = t.track_number || '1';
    let coverUrl = t.album?.image?.large || t.album?.image?.small || t.image?.large || t.image?.small;

    // 2. Get Download URL
    const timestamp = Math.floor(Date.now() / 1000);
    const r_sig = `trackgetFileUrlformat_id${format_id}intentstreamtrack_id${track_id}${timestamp}${qobuzSecret}`;
    const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');

    const downloadUrlRes = await axios.get(`${qobuzApiBase}track/getFileUrl`, {
      params: { format_id, intent: 'stream', track_id, request_ts: timestamp, request_sig: r_sig_hashed },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });

    const streamUrl = downloadUrlRes.data.url;
    if (!streamUrl) throw new Error("No stream URL returned from Qobuz");

    // 3. Download Raw Audio
    const audioRes = await axios({ method: 'get', url: streamUrl, responseType: 'stream' });
    const audioWriter = fs.createWriteStream(rawPath);
    audioRes.data.pipe(audioWriter);
    await new Promise<void>((resolve, reject) => {
      audioWriter.on('finish', () => resolve());
      audioWriter.on('error', reject);
    });

    // 4. Download Cover Art
    let hasCover = false;
    if (coverUrl) {
      try {
        const coverRes = await axios({ method: 'get', url: coverUrl, responseType: 'stream' });
        const coverWriter = fs.createWriteStream(coverPath);
        coverRes.data.pipe(coverWriter);
        await new Promise<void>((resolve, reject) => {
          coverWriter.on('finish', () => resolve());
          coverWriter.on('error', reject);
        });
        hasCover = true;
      } catch (err) {
        console.warn("Failed to download cover art", err);
      }
    }

    // 5. Run FFmpeg to Embed Metadata
    const safeTitle = title.replace(/"/g, '\\"');
    const safeArtist = artist.replace(/"/g, '\\"');
    const safeAlbum = album.replace(/"/g, '\\"');
    
    let ffmpegCmd = '';
    if (ext === 'mp3') {
      if (hasCover) {
        ffmpegCmd = `ffmpeg -y -i "${rawPath}" -i "${coverPath}" -map 0:a -map 1:v -c copy -id3v2_version 3 -metadata title="${safeTitle}" -metadata artist="${safeArtist}" -metadata album="${safeAlbum}" -metadata track="${trackNum}" "${finalPath}"`;
      } else {
        ffmpegCmd = `ffmpeg -y -i "${rawPath}" -c copy -id3v2_version 3 -metadata title="${safeTitle}" -metadata artist="${safeArtist}" -metadata album="${safeAlbum}" -metadata track="${trackNum}" "${finalPath}"`;
      }
    } else {
      // FLAC
      if (hasCover) {
        ffmpegCmd = `ffmpeg -y -i "${rawPath}" -i "${coverPath}" -map 0:a -map 1:v -c copy -disposition:v attached_pic -metadata title="${safeTitle}" -metadata artist="${safeArtist}" -metadata album="${safeAlbum}" -metadata track="${trackNum}" "${finalPath}"`;
      } else {
        ffmpegCmd = `ffmpeg -y -i "${rawPath}" -c copy -metadata title="${safeTitle}" -metadata artist="${safeArtist}" -metadata album="${safeAlbum}" -metadata track="${trackNum}" "${finalPath}"`;
      }
    }

    await execPromise(ffmpegCmd);

    // 6. Send File to Client
    res.setHeader('Content-Disposition', `attachment; filename="${artist.replace(/[/\\?%*:|"<>]/g, '-')} - ${title.replace(/[/\\?%*:|"<>]/g, '-')}.${ext}"`);
    res.setHeader('Content-Type', ext === 'mp3' ? 'audio/mpeg' : 'audio/flac');
    const readStream = fs.createReadStream(finalPath);
    readStream.on('close', cleanup);
    readStream.on('error', (err) => {
      console.error("Error sending file to client:", err);
      cleanup();
    });
    readStream.pipe(res);

  } catch (error: any) {
    cleanup();
    console.error('Metadata download error:', error?.response?.data || error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process download with metadata' });
    }
  }
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: message,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        systemInstruction: `You are an intelligent music assistant inside an iOS-style high-resolution music app. 
You answer complex queries about music, artists, and albums.
Keep responses concise, well-formatted, and helpful. 
Recommend real albums and tracks that the user could search for.`,
      },
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.get('/api/downloadAlbumZip', async (req, res) => {
  const { album_id, format_id } = req.query;
  if (!album_id || !format_id) return res.status(400).json({ error: 'album_id and format_id are required' });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: 'Qobuz credentials not configured' });

  const ext = format_id === '5' ? 'mp3' : 'flac';

  try {
    const albumRes = await axios.get(`${qobuzApiBase}album/get`, {
      params: { album_id },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    const albumData = albumRes.data;
    const tracks = albumData.tracks?.items || [];
    if (!tracks.length) throw new Error("No tracks found in album");

    const safeAlbumTitle = (albumData.title || 'Album').replace(/[/\\?%*:|"<>]/g, '-');
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeAlbumTitle}.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 0 }
    });

    archive.on('error', (err: any) => { throw err; });
    archive.pipe(res);

    const tempFiles = [];
    const cleanup = () => {
      for (const file of tempFiles) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    };
    
    res.on('finish', cleanup);
    res.on('close', cleanup);

    for (const track of tracks) {
      const track_id = track.id;
      const title = track.title || 'Unknown Title';
      const artist = track.performer?.name || track.artist?.name || 'Unknown Artist';
      const albumTitle = albumData.title || 'Unknown Album';
      const trackNum = track.track_number || '1';
      let coverUrl = albumData.image?.large || albumData.image?.small || track.image?.large;

      const rawPath = path.join('/tmp', `${track_id}_raw_${Date.now()}.${ext}`);
      const coverPath = path.join('/tmp', `${track_id}_cover_${Date.now()}.jpg`);
      const finalPath = path.join('/tmp', `${track_id}_final_${Date.now()}.${ext}`);
      tempFiles.push(rawPath, coverPath, finalPath);

      const timestamp = Math.floor(Date.now() / 1000);
      const r_sig = `trackgetFileUrlformat_id${format_id}intentstreamtrack_id${track_id}${timestamp}${qobuzSecret}`;
      const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');

      const downloadUrlRes = await axios.get(`${qobuzApiBase}track/getFileUrl`, {
        params: { format_id, intent: 'stream', track_id, request_ts: timestamp, request_sig: r_sig_hashed },
        headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
      });
      const streamUrl = downloadUrlRes.data.url;
      if (!streamUrl) continue;

      const audioRes = await axios({ method: 'get', url: streamUrl, responseType: 'stream' });
      const audioWriter = fs.createWriteStream(rawPath);
      audioRes.data.pipe(audioWriter);
      await new Promise<void>((resolve, reject) => {
        audioWriter.on('finish', () => resolve());
        audioWriter.on('error', reject);
      });

      let hasCover = false;
      if (coverUrl) {
        try {
          const coverRes = await axios({ method: 'get', url: coverUrl, responseType: 'stream' });
          const coverWriter = fs.createWriteStream(coverPath);
          coverRes.data.pipe(coverWriter);
          await new Promise<void>((resolve, reject) => {
            coverWriter.on('finish', () => resolve());
            coverWriter.on('error', reject);
          });
          hasCover = true;
        } catch (err) { }
      }

      const safeTitleMetadata = title.replace(/"/g, '\\"');
      const safeArtistMetadata = artist.replace(/"/g, '\\"');
      const safeAlbumMetadata = albumTitle.replace(/"/g, '\\"');
      
      let ffmpegCmd = '';
      if (ext === 'mp3') {
        if (hasCover) {
          ffmpegCmd = `ffmpeg -y -i "${rawPath}" -i "${coverPath}" -map 0:a -map 1:v -c copy -id3v2_version 3 -metadata title="${safeTitleMetadata}" -metadata artist="${safeArtistMetadata}" -metadata album="${safeAlbumMetadata}" -metadata track="${trackNum}" "${finalPath}"`;
        } else {
          ffmpegCmd = `ffmpeg -y -i "${rawPath}" -c copy -id3v2_version 3 -metadata title="${safeTitleMetadata}" -metadata artist="${safeArtistMetadata}" -metadata album="${safeAlbumMetadata}" -metadata track="${trackNum}" "${finalPath}"`;
        }
      } else {
        if (hasCover) {
          ffmpegCmd = `ffmpeg -y -i "${rawPath}" -i "${coverPath}" -map 0:a -map 1:v -c copy -disposition:v attached_pic -metadata title="${safeTitleMetadata}" -metadata artist="${safeArtistMetadata}" -metadata album="${safeAlbumMetadata}" -metadata track="${trackNum}" "${finalPath}"`;
        } else {
          ffmpegCmd = `ffmpeg -y -i "${rawPath}" -c copy -metadata title="${safeTitleMetadata}" -metadata artist="${safeArtistMetadata}" -metadata album="${safeAlbumMetadata}" -metadata track="${trackNum}" "${finalPath}"`;
        }
      }
      
      try {
        await execPromise(ffmpegCmd);
        const fileName = `${trackNum.toString().padStart(2, '0')} - ${title.replace(/[/\\?%*:|"<>]/g, '-')}.${ext}`;
        archive.append(fs.createReadStream(finalPath), { name: fileName });
      } catch (err) {
        console.error("FFmpeg failed for track", track_id, err);
      }
    }

    archive.finalize();
  } catch (error) {
    console.error('Album Zip error:', error?.response?.data || error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process album download' });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
