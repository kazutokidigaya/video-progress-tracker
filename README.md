# Video Progress Tracker (MERN Stack)

## Description

This project is a web application built using the MERN stack (MongoDB, Express, React, Node.js) designed to accurately track the unique portions of lecture videos watched by users. This tool records specific time intervals viewed, merges overlapping segments, and calculates progress based only on the content actually seen, ignoring skipped sections. The tool has user authentication, persistence of progress, and an admin interface for uploading videos using Cloudinary.

## Features

- Real Progress Tracking: Only counts the unique seconds you've actually watched.
- Saves Your Spot: Remembers exactly where you left off and which parts you've seen.
- Resume Playback: Picks up right from your last saved position.
- Segmented Progress Bar: See exactly which parts of the video you've watched on the timeline.
- User Accounts: Secure signup and login using JWT.
- Protected Content: Only logged-in users can watch lectures and save progress.
- Admin Uploads: A special section for admins to easily upload new videos via Cloudinary.

## Getting Started

1.  **Clone the Code:**

    ```bash
    git clone [Your Repository Link Here]
    cd video-progress-tracker
    ```

2.  **Set Up the Backend:**

    - Go to the backend folder: `cd backend`
    - Install packages: `npm install`
    - Create a `.env` file (copy `.env.example` if provided, or create new) and fill in your details:

      ```dotenv
      PORT=5001
      MONGODB_URI=your_mongodb_connection_string
      JWT_SECRET=a_very_secure_secret_key_for_jwt
      JWT_EXPIRES_IN=30d

      # Cloudinary Credentials
      CLOUDINARY_CLOUD_NAME=your_cloud_name
      CLOUDINARY_API_KEY=your_api_key
      CLOUDINARY_API_SECRET=your_api_secret
      ```

    - **Create an Admin User:** Start the backend (`npm run dev`). Sign up a user via the frontend. Then, connect to your MongoDB database directly and change that user's `role` field from `"user"` to `"admin"`.

3.  **Set Up the Frontend:**
    - Go to the frontend folder: `cd ../frontend`
    - Install packages: `npm install`
    - Create a `.env` file in the `frontend` directory:
      ```dotenv
      # Make sure this points to your running backend API
      VITE_API_BASE_URL=http://localhost:5001/api
      ```

## Running the App

1.  **Start the Backend:**

    - In the `backend` folder, run: `npm run dev`
    - (Listens on port 5001 by default)

2.  **Start the Frontend:**

    - In the `frontend` folder, run: `npm run dev`
    - (Usually opens on port 5173)

3.  **Open in Browser:**
    - Go to `http://localhost:5173` (or the port shown by the frontend).

## Our Approach to Tracking Progress

Getting the unique watch time right, especially with users skipping around, was the main puzzle!

- **The Challenge:** Early attempts using simple video events (`play`, `pause`, `seeking`, `ended`) to manually track start/end times of watched segments got messy. It was hard to reliably figure out the _exact_ moments playback started and stopped, leading to inaccurate intervals when users jumped around.
- **The Solution (`video.played`):** We landed on using the browser's built-in `video.played` property. This handy feature gives us a `TimeRanges` object, which is basically a list of time segments (`[start, end]`) that the browser _knows_ have been played during the current session.

  - The frontend (`VideoPlayer.jsx`) reads these `TimeRanges` when the user pauses, seeks, the video ends, or periodically during playback.
  - It converts these ranges into a simple array like `[{start: 0, end: 10}, {start: 30, end: 40}]`.
  - To avoid spamming the backend (which caused errors!), we "debounce" these saves. This means the frontend waits for a brief pause in events (like 1 second) before sending the latest watched ranges. Periodic saves still happen every few seconds during continuous playback to catch progress without user interaction.

- **Merging & Calculating:**
  1.  The frontend sends its current list of watched ranges (from `video.played`) to the backend.
  2.  The backend fetches the ranges _already saved_ for that user/video from MongoDB.
  3.  It **combines** the saved ranges and the new ranges from the frontend into one big list.
  4.  A utility function (`mergeIntervals`) sorts this combined list and merges any overlapping or touching segments (e.g., `[0, 10]` + `[8, 15]` becomes `[0, 15]`).
  5.  Another utility (`calculateTotalSeconds`) adds up the duration of these final, unique, merged segments.
  6.  The progress percentage is calculated based on this total unique time versus the video's total duration.
  7.  Everything (merged intervals, total seconds, percentage, last position) is saved back to MongoDB.

## Challenges We Faced (and How We Solved Them)

- **Getting Accurate Intervals (Ignoring Skips):** Manually tracking start/stop times with events was unreliable with seeking.
  - **Solution:** Switched to using the browser's `video.played` property, letting the browser handle the tricky parts of determining played ranges.
- **Backend Version Errors:** Sending too many save requests too quickly from the frontend caused database conflicts.
  - **Solution:** Implemented debouncing on the frontend for saves triggered by user actions (pause/seek/end), reducing the frequency of backend calls.
- **Weird Video Jump on Load:** Sometimes the video would jump forward then back to 0 when starting fresh.
  - **Solution:** Adjusted the initial seek logic to only force the video's `currentTime` if resuming from a position greater than 0, avoiding overriding the browser's default start.
- **Progress Resetting:** The `video.played` approach initially overwrote old progress.
  - **Solution:** Fixed the backend logic to correctly _combine_ the new intervals (from the current session) with the _existing_ intervals from the database before merging.

## Demo (Optional)

_[Feel free to add links to screenshots or a video showing off your tracker!]_

- _Example: Screenshot of the Lectures list_
- _Example: Screenshot of the Player with the segmented progress bar_
- _Example: Link to a quick video demo_

---
