# AI Developer Assistant

This project is an AI-powered developer assistant with a React frontend and a Node.js backend, designed to answer technical queries. The application is containerized using Docker and can be run using Docker Compose.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

* **Git:** For cloning the repository.

  * [Download Git](https://git-scm.com/downloads)

* **Docker:** For building and running the containers.

  * [Download Docker](https://www.docker.com/get-started)

## Setup Instructions

Follow these steps to get the application running locally using Docker Compose:

1. **Clone the Repository:**
   Open your terminal or command prompt and clone the project repository:

```bash
git clone https://github.com/dixonjonas/ai-dev-assistant
cd ai-dev-assistant
```

2. **Set up Environment Variables:**
The backend requires a Google Gemini API key. Open the `.env` file in the **root directory** of the project.

```bash
GOOGLE_API_KEY=YOUR_ACTUAL_GOOGLE_GEMINI_API_KEY_HERE
```

Replace `YOUR_ACTUAL_GOOGLE_GEMINI_API_KEY_HERE` with your valid API key which can be created [here](https://aistudio.google.com/app/apikey).

3. **Build and Run with Docker Compose:**
Navigate to the root directory of your project in the terminal (where `docker-compose.yml` is located) and run:

```bash
docker-compose up --build
```

Docker Compose will create the necessary Docker network, build the images, and start the backend and frontend containers. You will see logs from both services in your terminal.

4. **Access the Application:**
Once the services are up and running (look for messages indicating the backend is listening and the frontend build is complete, followed by Nginx starting), open your web browser and go to:

```bash
http://localhost:3000
```

The frontend application should load, and you can start interacting with the AI Developer Assistant.

5. **Stopping the Application**

To stop the running Docker containers, press `Ctrl + C` in the terminal where `docker-compose up` is running.

To remove the containers and the network created by Docker Compose, run:

```bash
docker-compose down
```

This cleans up the resources created by `docker-compose up`.

Thought and work process:

1, Start with the newest for me, setting up the react and typescript front-end to backend connection

2, Try calling a simple LLM (Step by step approach from here with iterative testing)

3, Think about what the user would want: Clean and easy-to-use interface, necessary functionalities such as being being aware of previous conversation history.

4, Scale up backend to where I want it to be

5, Scale up frontend

6, Testing: (Inputting non dev questions, simulating errors such as backend not being connected, testing with wide array of coding questions, etc)
