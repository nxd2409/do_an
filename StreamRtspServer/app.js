const fs = require('fs');
const NodeMediaServer = require('node-media-server');

const config = {
  rtmp: {
    port: 8686,
    chunk_size: 4096,
    gop_cache: false,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 7007,
    allow_origin: '*',
    mediaroot: './media/streamvideo',
    webroot: './www'
  },
  https: {
    port: 6655,
    key: './cert/key.pem',
    cert: './cert/cert.pem',
    allow_origin: '*',
    mediaroot: './media/streamvideo',
    webroot: './www'
  },
  relay: {
    ffmpeg: './ffmpeg/bin/ffmpeg.exe',
    tasks: [
      {
        app: 'live',
        mode: 'static',
        name: 'P1',
        edge: 'rtsp://admin:D2s2025!@sso.d2s.com.vn:18544/Streaming/Channels/1',
        rtsp_transport: 'tcp'
      }
    ]
  },
  trans: {
    ffmpeg: './ffmpeg/bin/ffmpeg.exe',
    tasks: [
      {
        app: 'live',
        mp4: true,
        hls: true,
        dash: true,
        ws: true,
        wss: true
      }
    ]
  }
};

const nms = new NodeMediaServer(config);
nms.run();