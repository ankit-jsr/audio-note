# Overview

Pensieve is a modern audio content transcription and analysis application built with React and Node.js. The application allows users to upload audio files, automatically transcribe them using OpenAI's Whisper API, and create highlights and summaries of the content. It's designed as a personal knowledge management tool for processing podcasts, lectures, audiobooks, and other audio content.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript and follows a modern component-based architecture. It uses Vite as the build tool and development server, with Wouter for client-side routing. The UI is styled with Tailwind CSS and uses Radix UI components through shadcn/ui for consistent design patterns. State management is handled by TanStack Query for server state and React's built-in state for local component state.

## Backend Architecture
The backend uses Express.js with TypeScript in ESM format. It follows a RESTful API design pattern with route handlers separated into dedicated modules. The server includes middleware for request logging, error handling, and file upload processing using Multer. Audio transcription is handled through OpenAI's API integration.

## Database Design
The application uses PostgreSQL with Drizzle ORM for database operations. The schema includes four main entities:
- **Users**: Basic user management with username/password authentication
- **AudioContent**: Stores metadata about uploaded audio files including transcription status and AI-generated summaries
- **Highlights**: User-created highlights with timestamps and notes
- **TranscriptSegments**: Time-stamped transcript segments for precise playback synchronization

## File Storage
Audio files are stored locally on the server filesystem using Multer with configurable upload limits (500MB maximum). File validation ensures only audio formats are accepted (MP3, WAV, M4A, FLAC).

## Authentication & Session Management
Currently implements a mock user system for development. The architecture supports session-based authentication with plans for proper user authentication integration.

## Development Environment
The application uses a development-first approach with hot module replacement via Vite, runtime error overlays, and Replit-specific development tools integration. The build process creates optimized production bundles with separate client and server builds.

# External Dependencies

## Core Framework Dependencies
- **Express.js**: Web application framework for the backend API
- **React**: Frontend UI framework with TypeScript support
- **Vite**: Build tool and development server
- **Drizzle ORM**: Type-safe database operations with PostgreSQL

## Database
- **PostgreSQL**: Primary database (configured via DATABASE_URL environment variable)
- **Neon Database**: Serverless PostgreSQL provider integration

## AI Services
- **OpenAI API**: Whisper for audio transcription and GPT-4o for content analysis and summarization (requires OPENAI_API_KEY environment variable)

## UI Components & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components via shadcn/ui
- **Lucide React**: Icon library
- **TanStack Query**: Server state management and caching

## File Processing
- **Multer**: Middleware for handling multipart/form-data file uploads
- **File System API**: Local file storage and management

## Development Tools
- **TypeScript**: Type safety across the entire codebase
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Autoprefixer