# Streaming-AI-Chatbot-with-Flask-and-React

A sandbox chatbot application that delivers treaming AI responses, similar to the ChatGPT interface. Built with a python Flask backend and a React Vite frontend.

## Features

- **Streaming Responses**: Real-time AI responses delivered progressively to enhance user experience.
- **React Frontend**: Leveraging React Vite to built a simple chatbot interface.
- **Python Flask Backend**: Leveraging Flask to handle API requests and responses.
- **ChatGPT Model**: Using the ChatGPT model to generate responses in real-time.

## Demo

![App Demo](https://github.com/janegutou/Streaming-AI-Chatbot-with-Flask-and-React/blob/main/frontend/public/demo.gif)


## Project Structure

```plaintext
Streaming-AI-Chatbot-with-Flask-and-React
|
├── frontend/
│   ├── public
│   ├── src/
|   |   ├── pages/
|   |   |   ├── chatbot.jsx
│   ├── vite.config.ts
│   └── package.json
|
├── backend/
│   ├── server.py
│   ├── requirements.txt
|
├── .gitignore
├── README.md
└── LICENSE
```

## Installation and Setup

### Prerequisites
- Python 3.9+
- Node.js

### Steps to Run

Clone the repository

```bash
git clone https://github.com/janegutou/Streaming-AI-Chatbot-with-Flask-and-React.git
cd Streaming-AI-Chatbot-with-Flask-and-React
```

Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # on Windows, venv\Scripts\activate
pip install -r requirements.txt
python server.py  # run the backend server
```

Frontend Setup

```bash
cd frontend
npm install
npm run dev  # run the frontend server
```

### Environment Variables

To run the backend server, you need to create a `.env` file in the `backend` directory and add the following variables:
```plaintext
OPENAI_API_KEY=<your_openai_api_key>
```

### Usage

Open your browser and go to `http://localhost:5173` to access the chatbot interface.


## How Streaming Works

Frontend:
- Sends a request to backend api endpoint (api/stream) using EventSource.
- Manages the streaming response incrementally and displays it in webpage with real-time markdown formatting.
- _check more details in frontend/src/pages/chatbot.jsx_

Backend:
- Generate a stream of responses using langchain.
- Reformat the stream to adapt to text/event-stream MIME type.
- _check more details in backend/server.py_
