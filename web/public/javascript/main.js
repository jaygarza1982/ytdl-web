
const webSocket = new WebSocket('ws://localhost:8050/ws');
let clientUUID = '';

const progressTerminal = document.getElementById('download-progress-terminal');

// TODO: Pass this to download API to set the art. This should be the filename of the uploaded art
let albumArtID = '';
const fileInput = document.getElementById('image');
const albumArtImage = document.getElementById('album-art');

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
        progressTerminal.innerText = '';

        const url = document.getElementById('url').value;
        const filename = document.getElementById('filename').value;
        const title = document.getElementById('title').value;
        const artist = document.getElementById('artist').value;
        const album = document.getElementById('album').value;

        const fetchResult = await fetch(`/api/download?uuid=${clientUUID}&album=${album}&artist=${artist}&title=${title}&url=${url}`);
        if (fetchResult.status !== 200) {
            throw new Error(`Download failed with status ${fetchResult.status} from server`);
        }

        const fileBlob = await fetchResult.blob();

        const fileBlobURL = URL.createObjectURL(fileBlob);
        
        const dummyLink = document.createElement('a');
        dummyLink.href = fileBlobURL;
        dummyLink.download = filename || 'filename.mp3';
        document.body.appendChild(dummyLink);
        dummyLink.click();

        document.getElementById('progress-bar').style.display = 'none';
    } catch (error) {
        console.log(`Unable to get MP3 file ${error}`);
    }
}

document.getElementById('download-btn').onclick = () => {
    mp3Download();
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
