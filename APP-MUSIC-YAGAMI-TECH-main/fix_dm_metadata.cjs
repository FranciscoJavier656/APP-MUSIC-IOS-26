const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const originalWebBlock = `  } else {
    // Web mock
    const filename = \`\${track.track_number?.toString().padStart(2, '0') || '01'} - \${(track.title || 'Track').replace(/[/\\\\?+%*:_|"<>]/g, '-')}.\${ext}\`;
    await downloadFileWeb(url, filename);
  }`;

const newWebBlock = `  } else {
    // Web mock
    const filename = \`\${track.track_number?.toString().padStart(2, '0') || '01'} - \${(track.title || 'Track').replace(/[/\\\\?+%*:_|"<>]/g, '-')}.\${ext}\`;
    await downloadFileWeb(url, filename);
    
    // Añadimos metadatos también en Web para que aparezca en la pestaña de descargas
    const trackWithLocalPath = {
      ...track,
      localPath: '',
      downloadedAt: Date.now()
    };
    addMetadataToLibrary(trackWithLocalPath);
    window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId: track.id.toString(), status: 'completed' } }));
  }`;

if (code.includes(originalWebBlock)) {
    code = code.replace(originalWebBlock, newWebBlock);
    fs.writeFileSync('src/lib/DownloadManager.ts', code);
    console.log('Fixed DM Web block');
} else {
    console.log('Could not find original Web block in DM');
}
