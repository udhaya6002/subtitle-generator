# 🚀 SUBTITLE GENERATOR

A slick and simple tool to automatically generate subtitles for your videos in any language. Upload a video, choose your options, and let the magic happen.



## ✨ Features

* **Video Upload:** Supports video files up to 500MB.
* **Audio Extraction:** Uses **FFmpeg** to seamlessly pull the audio from your video file.
* **AI-Powered Transcription:** Leverages **OpenAI's Whisper** model for highly accurate transcription and translation.
* **Multi-Language Support:** Generate subtitles in the original language or translate them to a different one on the fly.

---

## 🛠️ Tech Stack

* **Backend:** Python, FastAPI, OpenAI Whisper, FFmpeg
* **Frontend:** Node.js, npm 

---

## 📋 Prerequisites

Before you begin, make sure you have the following installed on your system.

* **Python** (3.8 or higher)
* **Node.js** and **npm**
* **FFmpeg:** You need to install this system-wide.
    * **Windows:** `winget install ffmpeg` or follow the [official guide](https://ffmpeg.org/download.html).
    * **macOS:** `brew install ffmpeg`
    * **Linux:** `sudo apt update && sudo apt install ffmpeg`

---

##  Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository

First, clone this repository to your local machine.


`git clone https://github.com/udhaya6002/subtitle-generator.git`
`cd subtitle-generator`


### 2. (Recommended) Create and activate a virtual environment
`python -m venv venv`

On Linux, use `source venv/bin/activate`  

On Windows, use `venv\Scripts\activate`


### 3. In a new terminal 

Install the necessary packages
`npm i`

Start the frontend development server
`npm run dev`


# The frontend should now be accessible in your browser, usually at http://localhost:8000 or a similar address.