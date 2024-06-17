
CREATE TABLE IF NOT EXISTS VideosDownloaded (
    VideoKey SERIAL PRIMARY KEY,
    VideoID CHAR(11),
    Title VARCHAR(100),
    InsertedAt TIMESTAMP,
    Hits INT
);
