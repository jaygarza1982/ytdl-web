
const { origin, protocol } = window.location;

const https = protocol.includes('https');

const webSocket = new WebSocket(`${https ? 'wss' : 'ws'}://${origin.split('//').pop()}/ws`);
let clientUUID = '';

const progressTerminal = document.getElementById('download-progress-terminal');

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const progressBarIncrement = (loaded, contentLength) => {
    document.getElementById('progress-bar-progress').value = Math.round((loaded / contentLength) * 100);
}

// TODO: Pass this to download API to set the art. This should be the filename of the uploaded art
let albumArtID = '';
const fileInput = document.getElementById('image');
const albumArtImage = document.getElementById('album-art');
const mp3RadioButton = document.getElementById('mp3');
const mp4RadioButton = document.getElementById('mp4');
const mp3MetadataFields = document.getElementById('mp3-metadata-fields');

// Show / hide mp3 metadata fields
const downloadTypeRadioClick = () => {
    if (mp3RadioButton.checked) {
        mp3MetadataFields.style.display = 'block';
        return;
    }

    mp3MetadataFields.style.display = 'none';
}

webSocket.onmessage = (event) => {
    console.log(event.data);

    // Our first message from the server will be our UUID
    if (clientUUID === '') {
        clientUUID = event.data;
        return;
    }

    progressTerminal.style.display = 'block';
    progressTerminal.innerText += event.data + '\n';
}


const mp3Download = async () => {
    try {
        document.getElementById('progress-bar').style.display = 'block';
        
        // Start progress at 0
        document.getElementById('progress-bar-progress').value = 0;
        document.getElementById('byte-value-full').innerHTML = 0;
        document.getElementById('byte-value-loaded').innerHTML = 0;
        
        progressTerminal.innerText = '';

        const url = document.getElementById('url').value;
        const filename = document.getElementById('filename').value || 'filename.mp3';
        const title = document.getElementById('title').value;
        const artist = document.getElementById('artist').value;
        const album = document.getElementById('album').value;

        const fetchResult = await fetch(`/api/download?uuid=${clientUUID}&artid=${albumArtID}&album=${album}&artist=${artist}&title=${title}&url=${url}`);
        if (fetchResult.status !== 200) {
            throw new Error(`Download failed with status ${fetchResult.status} from server`);
        }

        // Craft a stream in order to get download progress
        const contentLength = parseInt(fetchResult.headers.get('Content-Length') || '0');
        document.getElementById('byte-value-full').innerHTML = formatBytes(contentLength);

        let loaded = 0;
        const res = new Response(new ReadableStream({
            async start(controller) {
                const reader = fetchResult.body.getReader();
                for (; ;) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    loaded += value.byteLength;

                    // Update UI
                    progressBarIncrement(loaded, contentLength);
                    document.getElementById('byte-value-loaded').innerHTML = formatBytes(loaded);

                    controller.enqueue(value);
                }
                controller.close();
            },
        }));

        const fileBlob = await res.blob();

        const fileBlobURL = URL.createObjectURL(fileBlob);
        
        const dummyLink = document.createElement('a');
        dummyLink.href = fileBlobURL;

        // Append '.mp3' to filename if not there
        const finalFilename = filename.endsWith('.mp3') ? filename : filename + '.mp3'

        dummyLink.download = finalFilename;
        document.body.appendChild(dummyLink);
        dummyLink.click();

        document.getElementById('progress-bar').style.display = 'none';
    } catch (error) {
        console.log(`Unable to get MP3 file ${error}`);
    }
}

const videoDownload = async () => {
    try {
        document.getElementById('progress-bar').style.display = 'block';
        progressTerminal.innerText = '';

        const url = document.getElementById('url').value;
        const filename = document.getElementById('filename').value;

        const fetchResult = await fetch(`/api/download-video?uuid=${clientUUID}&url=${url}`);
        if (fetchResult.status !== 200) {
            throw new Error(`Download failed with status ${fetchResult.status} from server`);
        }

        const fileBlob = await fetchResult.blob();

        const fileBlobURL = URL.createObjectURL(fileBlob);
        
        const dummyLink = document.createElement('a');
        dummyLink.href = fileBlobURL;
        dummyLink.download = filename || 'filename.mp4';
        document.body.appendChild(dummyLink);
        dummyLink.click();

        document.getElementById('progress-bar').style.display = 'none';
    } catch (error) {
        console.log(`Unable to get MP3 file ${error}`);
    }
}

document.getElementById('download-btn').onclick = () => {
    if (mp3RadioButton.checked) {
        mp3Download();
        return;
    }

    videoDownload();
}

fileInput.addEventListener('change', async e => {
    try {
        const file = e.target.files[0];

        const formData = new FormData();
        formData.append('image', file);

        const fetchReq = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });

        if (fetchReq.status !== 200) {
            console.log('Unable to upload file. Status returned ', fetchReq.status);
            return;
        }

        // Set our album art string to where it lives on the server
        const albumArtServerPath = await fetchReq.text();
        albumArtID = albumArtServerPath;
        console.log('Album art ID:', albumArtID);

        // Show the uploaded file
        const fr = new FileReader();
        fr.onload = function () {
            albumArtImage.src = fr.result;
            albumArtImage.style.display = 'block';
        }

        fr.readAsDataURL(file);
    } catch (error) {
        console.log(`Could not upload file ${error}`);
    }
});
