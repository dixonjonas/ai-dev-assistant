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
Once the services are up and running, open your web browser and go to:

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

## Thought Process and Approach

My approach to building this AI Developer Assistant involved an iterative process, prioritizing core functionality and user experience:

* **Establishing the Foundation:** I began by setting up the communication layer between the React/TypeScript frontend and the Node.js backend, ensuring data could be exchanged reliably.

* **Integrating the AI Core:** The next step was to integrate the LLM in the backend. This started with implementing a basic query-response mechanism and then iteratively expanding the complexity of the application. Google Gemini was selected as the main LLM as it is a powerful model with a free API.

* **Developing the Frontend** Next, the frontend UI was developed. Here I focused on creating a simple and responsive interface that allowed users to easily input queries and view AI responses. Only essential buttons and layout adjustments were added, keeping the design clean and functional.
 
* **Focusing on User Experience:** Throughout development, I kept the end-user in mind, prioritizing the most important features to ensure a smooth and effective experience. A key feature prioritized early was maintaining conversation history, an important aspect for any good AI-assistant. Continuous streaming of the output was also added to enhance the user experience.
 
* **Comprehensive Testing:** A significant part of the process involved testing. This included verifying the assistant's responses to various coding questions, testing its handling of non-developer queries (as per the system prompt), and simulating various error conditions (like the backend being disconnected) to ensure graceful error handling.
