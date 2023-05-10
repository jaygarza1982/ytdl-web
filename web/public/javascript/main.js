
const mp3Download = async () => {
    try {
        const url = document.getElementById('url').value;
        const filename = document.getElementById('filename').value;
        const title = document.getElementById('title').value;
        const artist = document.getElementById('artist').value;
        const album = document.getElementById('album').value;

        const fetchResult = await fetch(`/api/download?album=${album}&artist=${artist}&title=${title}&url=${url}`);

        const fileBlob = await fetchResult.blob();

        const fileBlobURL = URL.createObjectURL(fileBlob);
        
        const dummyLink = document.createElement('a');
        dummyLink.href = fileBlobURL;
        dummyLink.download = filename || 'filename.mp3';
        document.body.appendChild(dummyLink);
        dummyLink.click();
    } catch (error) {
        console.log(`Unable to get MP3 file ${error}`);
    }
}

document.getElementById('download-btn').onclick = () => {
    mp3Download();
}
