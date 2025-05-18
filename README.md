# Study Overlay ✨

Elevate your study streams with customisable, easy-to-use overlays for OBS and other streaming software. Study Overlay provides a suite of tools to keep your audience engaged and informed, from Pomodoro timers to live Spotify track displays.

## Overview

Study Overlay is a Next.js web application designed to generate dynamic, browser-based overlays perfect for students, coders, artists, or anyone looking to enhance their live streams. With a simple link generation process, you can add a professional touch to your content without any complex setup.

The project is live and can be accessed: `https://study-overlay.vercel.app`

## Key Features

*   **Multiple Overlay Types:** Choose from a variety of overlays to suit your streaming needs.
*   **Easy OBS Integration:** Simply generate a link and add it as a Browser Source in OBS.
*   **Customisable:** Configure overlays like the Pomodoro timer with your preferred work/rest intervals.
*   **Spotify Integration:** Display your currently playing Spotify song, complete with album art and progress.
*   **Real-time Updates:** Overlays like timers and Spotify trackers update live on your stream.
*   **Clean & Modern UI:** Designed to be visually appealing and unobtrusive.

## Getting Started with OBS (or other streaming software)

1.  **Open Study Overlay:** Navigate to the main page of the Study Overlay application.
2.  **Select Overlay Type:** Choose the type of overlay you want to use (e.g., Pomodoro Timer, Spotify Tracker, Local Time).
3.  **Configure (if necessary):**
    *   For the **Pomodoro Timer**, enter your desired working time and resting time in minutes.
    *   For the **Spotify Tracker**, you will be prompted to log in with your Spotify account (Premium may be required for full functionality).
4.  **Generate Link:** Click the "Generate Link" button.
5.  **Copy Link:** Your unique overlay URL will be displayed. Click the copy icon or manually copy the link.
6.  **Add to OBS:**
    *   Open OBS Studio.
    *   In the "Sources" dock, click the "+" button and select "Browser".
    *   Choose "Create new", give your source a name (e.g., "Spotify Overlay"), and click "OK".
    *   In the Properties window:
        *   Paste the copied URL into the "URL" field.
        *   Set the "Width" to `1000` pixels (recommended starting point, adjust as needed).
        *   Set the "Height" to `200` pixels (recommended starting point, adjust as needed).
        *   Click "OK".
    *   (Optional but Recommended) For a transparent background:
        *   Right-click on the newly added Browser source.
        *   Select "Filters".
        *   Click the "+" button under "Effect Filters" and choose "Chroma Key".
        *   Give it a name (e.g., "Green Screen") and click "OK".
        *   In the Chroma Key settings, if your overlay page has a solid background (like the default green), it should become transparent. You might need to adjust "Key Color Type" or "Similarity" if the default green (`#00FF00`) isn't perfectly keyed out. (Note: The overlays are designed with a green background: `bg-green-500`).
7.  **Position and Resize:** Adjust the position and size of the overlay in your OBS scene as desired.
8.  **Enjoy!** Your overlay is now live.

## Available Overlays

### 1. Pomodoro Timer

*   **Description:** A classic Pomodoro timer to help you and your viewers manage study/work sessions and breaks.
*   **Features:**
    *   Displays current phase (e.g., 📚 for work, "Break" for rest).
    *   Shows remaining time in `MMm SSs` format.
    *   Indicates the configured work/rest cycle (e.g., "Pomodoro timer (25/5)").
*   **Customisation:** Set custom work and rest durations (in minutes).

### 2. Spotify Tracker

*   **Description:** Let your audience know what you're listening to on Spotify.
*   **Features:**
    *   Displays current song title and artist.
    *   Shows album art (option for a standard square or a spinning vinyl style).
    *   Includes a progress bar with current playback time and total song duration.
    *   Handles Spotify token authentication and refresh.
*   **Note:** Requires Spotify login. Spotify Premium may be required for uninterrupted playback data.

### 3. Local Time Display

*   **Description:** A simple overlay to show your current local time.
*   **Features:**
    *   Displays time in `HH:MM AM/PM Day` format (e.g., "12:32 Fri").

### 4. Flip Clock (Experimental)
*   **Description:** A stylish flip clock to display the current time.
*   **Status:** Currently in development, may not be fully functional.

## Development

This is a Next.js project. To run it locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/stfn-c/study-overlay.git
    cd study-overlay
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add necessary environment variables. At a minimum, you'll likely need `HOST` for Spotify OAuth redirects during local development:
    ```env
    HOST=http://localhost:3000/
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID=fb31251099ec4a96a54f36d223ceb448
    # Add SPOTIFY_CLIENT_SECRET if you use it for token exchange in a backend
    ```
    (Your `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` seems to be hardcoded in `pages/index.tsx` as `fb31251099ec4a96a54f36d223ceb448`. It's good practice to move such values to environment variables.)

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please feel free to open an issue or submit a pull request.

(Details on contribution guidelines can be added here if you have specific requirements.)

## Acknowledgements

*   This project was created and is independently managed by **Stefan Ciutina**. Follow on Instagram: [@stfn.c](https://instagram.com/stfn.c).
*   Built with [Next.js](https://nextjs.org/), [React](https://reactjs.org/), and [Tailwind CSS](https://tailwindcss.com/).
*   Spotify integration powered by the [Spotify Web API](https://developer.spotify.com/documentation/web-api/).

## Licence

This project is licensed under the MIT Licence. See the [LICENCE.md](LICENCE.md) file for details (if you choose to add one).

---

Happy Streaming!
