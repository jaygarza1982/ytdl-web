import axios from "axios";

const fetchVideoTitle = async (url: string): Promise<string | null> => {
    try {
        // Fetch HTML content of the YouTube URL
        const response = await axios.get<string>(url);
        const html = response.data;

        // Use regex to find the title tag
        const titleMatch = html.match(/<title>(.*?)<\/title>/i)?.shift() || null;

        // Remove "<title>...</title> - YouTube"
        const videoTitle = titleMatch?.substring(7, (titleMatch?.length || 0) - 18)

        return videoTitle || null;
    } catch (error) {
        console.log(`Could not fetch title from ${url} because ${error}`);
    }

    return null;
}

export { fetchVideoTitle }
