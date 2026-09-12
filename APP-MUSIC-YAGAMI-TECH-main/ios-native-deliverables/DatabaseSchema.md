# Esquema de Base de Datos Offline (Capacitor SQLite)

Para mantener el máximo rendimiento en la UI (búsquedas, filtros por Artista, Álbum, Género), la recomendación es usar una base de datos local en React/Capacitor, como `@capacitor-community/sqlite`.

## Estructura SQL Recomendada

```sql
CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id TEXT,
    release_year INTEGER,
    image_url TEXT,
    FOREIGN KEY(artist_id) REFERENCES artists(id)
);

CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    album_id TEXT,
    artist_id TEXT,
    duration INTEGER,
    track_number INTEGER,
    genre TEXT,
    local_path TEXT NOT NULL, -- Ruta física en ApplicationSupportDirectory
    format TEXT,
    download_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(album_id) REFERENCES albums(id),
    FOREIGN KEY(artist_id) REFERENCES artists(id)
);

-- Índices para búsquedas rápidas en la librería offline
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
```

## Flujo Lógico:
1. React lanza la descarga usando el `YagamiDownloadManager` de iOS.
2. Swift notifica a React: `onDownloadCompleted (trackId, path)`.
3. React toma los metadatos que ya tiene en memoria (del JSON original de la API de Qobuz) y los inserta en estas tablas de SQLite junto con el `local_path` proporcionado por Swift.
4. La pestaña "Librería" lee directamente de SQLite y usa Capacitor Filesystem para leer los audios físicos de la ruta guardada.
