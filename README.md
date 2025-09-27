# .NET Microservices

This project is based on the course: [**.NET Microservices – Full Course for Beginners**](https://www.youtube.com/watch?v=ByYyk8eMG6c) by Julio Casal on freeCodeCamp.org

It provides a lightweight frontend for interacting with the Play microservices ecosystem, which includes Play.Catalog and Play.Inventory services. The backend is built as independent .NET microservices, while this frontend offers a user-friendly interface to test and manage the system.

## What This Project Showcases

- Data persistence with MongoDB
- Repository pattern
- Dependency Inversion
- Entity contracts
- Asynchronous programming
- Shared code with NuGet packages
- Docker containers and Docker Compose
- Async inter-service communication
- Timeouts, retries, and circuit breaker with Polly
- Microservices autonomy
- Event-driven messaging with RabbitMQ and MassTransit

## Features
- View and manage catalog items from Play.Catalog
- View and manage inventory from Play.Inventory

## Getting Started
### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```sh
npm install
```

### Running the App
```sh
npm run dev
```

The app will be available at `http://localhost:5173` by default.

## Running Backend Services

To run the backend microservices and required infrastructure, follow these steps:

1. Start the infrastructure services (MongoDB, RabbitMQ, etc.) using Docker Compose:

```sh
cd ../Play.Infra docker-compose up
```

2. In separate terminals, start each .NET microservice:

```sh
dotnet run --project ../Play.Catalog/src/Play.Catalog.service/Play.Catalog.service.csproj
```

```sh
dotnet run --project ../Play.Inventory/src/Play.Inventory.Service/Play.Inventory.Service.csproj
```

## Backend Services
- [Play.Catalog](../Play.Catalog)
- [Play.Inventory](../Play.Inventory)

## Tools Used
This project leverages a modern stack for building and running microservices:

- **Visual Studio Code** – for efficient code editing and debugging
- **.NET 8** – the core framework for building robust backend microservices
- **React + Vite** – for building a fast and modern frontend user interface
- **Docker & Docker Compose** – to containerize services and manage dependencies easily
- **MongoDB** – as the NoSQL database for storing catalog and inventory data
- **Polly** – for implementing resilient HTTP communication with retries and circuit breakers
- **RabbitMQ** – enabling asynchronous messaging and event-driven architecture between services

## License
MIT
