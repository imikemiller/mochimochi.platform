# Discord Game Developer Research Bot - Technical Decisions

## Project Overview

Building a Discord bot that randomly selects online users to send research questions, helping game developers gather quantitative feedback from their communities.

## Core Concept

- **Random Sampling**: Target random online Discord users instead of voluntary surveys
- **Server Owner Control**: Game developers define question banks and research goals
- **Context-Aware**: Use recent message context to select appropriate questions and adjust language
- **Discord-focused**: Tight integration with Discord communities

## POC

### Scope

- **Free service** for validation
- **Basic functionality**: Random user selection, question delivery, response collection
- **Configurable limits**: Set constraints by time intervals or recipient count per server

### Core APIs Required

- **Question Management**: AI-assisted question creation through dedicated prompts and model, plus edit/categorize question banks
- **Channel Access**: AI provides guidance on which channels to grant access for effective context analysis
- **Scheduling System**: Configure when and how frequently to send research questions
- **Response Capture**: Collect user responses via DM replies (text messages following questions), with AI processing to aggregate multi-message responses
- **Analytics API**: Export response rates, question performance, user engagement metrics

## Technology Stack

### Backend

- **Framework**: Fastify with TypeScript
- **Discord API**: Discord.js v14
- **Database**: Supabase (PostgreSQL)
- **Rate Limiting**: Bottleneck with Redis datastore
- **Job Queue**: BullMQ with Redis for scheduling question campaigns
- **LLM Integration**: OpenAI SDK for setup assistance and question customization

### Hosting

- **Application**: Railway (managed containers)
- **Database**: Supabase
- **Rate Limiting**: Railway Redis

### Key Dependencies

```json
{
  "fastify": "^5.4.0",
  "discord.js": "^14.20.0",
  "@supabase/supabase-js": "^2.50.0",
  "bottleneck": "^2.19.5",
  "openai": "^5.5.1",
  "zod": "^3.25.67",
  "ai": "^4.3.16"
}
```

## Architecture Decisions

### Rate Limiting Strategy

- **Bottleneck + Redis**: Distributed rate limiting across Railway instances
- **Multi-tier limits**: Global Discord (50/sec), DM limits (5/min), per-guild limits

### Job Scheduling

- **BullMQ + Redis**: Scheduled jobs query database for active research sessions
- **Participant Selection**: Find eligible online users and queue question delivery
- **Rate-Limited Sending**: Integrate with Bottleneck to respect Discord API limits
- **Response Processing**: Scheduled jobs check for replies and process multi-message responses

### Data Privacy

- **Minimal context analysis**: Only recent message topics/keywords for question selection (not poc, but will be added later)
- **No behavioral profiling**: Simple topic matching, not sentiment analysis
- **Ephemeral processing**: Don't store user message analysis

### User Experience

- **Smart question selection**: Match users to relevant questions from owner's predefined bank
- **Language adaptation**: Adjust technical vs casual language based on user's writing style
- **Fallback strategies**: DM → channel mention if DMs blocked (not poc, but will be added later)

### API Endpoints

- `POST /api/assistant` - Handle DM conversations with server owners, includes tool calls for question creation, editing, listing, and server channel analysis
- `GET /api/analytics/{serverId}` - Export response data and metrics

### AI Tools Required

- **create_question_bank** - Generate research questions based on game developer goals
- **list_question_banks** - Show existing question banks for a server
- **edit_questions** - Modify existing questions in a bank
- **configure_limits** - Set time intervals and recipient count constraints
- **start_research_session** - Launch question campaign with specified parameters
- **aggregate_responses** - Process multi-message user replies into clean answers

### Response Processing

- **Automated Collection**: Scheduled jobs check for replies to open questions less than X minutes old
- **Multi-message Aggregation**: AI processes multiple messages within response window
- **Timeout Handling**: Questions older than X minutes automatically flagged as no reply

### Bot Interaction Features

- **DM Assistant**: Server owners can DM the bot for guided setup and configuration help
- **Typing Indicators**: Show typing status during LLM streaming responses for natural conversation flow

## Setup Guide

### Prerequisites

1. Node.js (v18 or later)
2. A Discord Developer account and bot token
3. A Supabase account and project
4. An OpenAI API key
5. A Railway account

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd [project-directory]
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:

   ```
   DISCORD_TOKEN=your_discord_bot_token
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Database Setup**

   - Install Supabase CLI:

     ```bash
     # Using Homebrew (macOS)
     brew install supabase/tap/supabase

     # Using npm
     npm install -g supabase
     ```

   - Initialize Supabase in your project:
     ```bash
     supabase init
     ```
   - Link your project:

     ```bash
     supabase link --project-ref mochimochi.platform
     ```

   - Apply the migration:
     ```bash
     supabase db push
     ```
   - (Optional) Start local development database:
     ```bash
     supabase start
     ```

5. **Discord Bot Setup**

   - Create a new Discord application at https://discord.com/developers/applications
   - Add a bot to your application
   - Enable required intents:
     - Message Content Intent
     - Server Members Intent
   - Generate and save your bot token
   - Invite the bot to your server with appropriate permissions

6. **Development Server**
   ```bash
   npm run dev
   ```

### Deployment

1. **Railway Setup**

   - Create a new Railway project
   - Connect your GitHub repository
   - Add the following environment variables:
     - DISCORD_TOKEN
     - SUPABASE_URL
     - SUPABASE_KEY
     - OPENAI_API_KEY

2. **Deploy**
   - Railway will automatically deploy on push to main
   - Monitor the deployment logs for any issues

### Testing

1. **Unit Tests**

   ```bash
   npm test
   ```

2. **Integration Tests**
   ```bash
   npm run test:integration
   ```

### Monitoring

- Set up Railway monitoring for application logs
- Configure Supabase monitoring for database performance
- Set up error tracking (recommended: Sentry)

### Next Steps

1. Configure your first question bank using the DM assistant
2. Set up rate limits for your server
3. Test the bot in a development server
4. Monitor initial responses and adjust question banks as needed

### Project Structure

```
src/
├── types.ts           # Application types
├── bot/              # Discord bot core
│   ├── commands.ts   # Bot command handlers
│   ├── events.ts     # Discord event handlers
│   └── index.ts      # Bot initialization
├── lib/              # Libraries for external services
│   ├── discord.ts    # Discord service (user selection, message handling)
│   ├── openai.ts     # OpenAI integration for question generation
│   └── supabase.ts   # Supabase client & queries
├── api/             # API endpoints
│   ├── assistant.ts  # Assistant API for server owners
│   └── analytics.ts  # Analytics endpoint
├── app.ts          # Fastify application setup
└── server.ts       # Server entry point

tests/             # Test files
└── integration/   # Integration tests
```

### Running the Application

1. **Start the Development Server**

   ```bash
   npm run dev
   ```

   This will start the Fastify server and Discord bot.

2. **Test the API Endpoints**

   - Health Check: `GET http://localhost:3000/health`
   - Assistant API: `POST http://localhost:3000/api/assistant`
     ```json
     {
       "serverId": "your_discord_server_id",
       "message": "Create a question bank for my game",
       "tool": "create_question_bank",
       "parameters": {}
     }
     ```
   - Analytics API: `GET http://localhost:3000/api/analytics/{serverId}`

3. **Available Tools**

   - `create_question_bank`: Generate research questions
   - `list_question_banks`: Show existing question banks
   - `edit_questions`: Modify questions in a bank
   - `configure_limits`: Set rate limits
   - `start_research_session`: Launch question campaign
   - `aggregate_responses`: Process user replies

4. **Environment Variables**
   Make sure your `.env` file includes:

   ```
   DISCORD_TOKEN=your_discord_bot_token
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   REDIS_HOST=tramway.proxy.rlwy.net
   REDIS_PORT=35799
   REDIS_PASSWORD=your_redis_password
   ```

5. **Testing the Bot**
   - Invite the bot to your Discord server
   - DM the bot to start configuring your research questions
   - Use the assistant API to manage question banks and sessions

## Discord Bot Permissions & Intents

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your application, then go to the "OAuth2" > "URL Generator".
3. Under "Scopes", select `bot` (and `applications.commands` if you use slash commands).
4. Under "Bot Permissions", paste the permissions integer above or select the permissions listed.
5. Copy the generated invite link and use it to invite your bot to your server.
6. In the "Bot" section, enable the privileged intents listed above.

**Required Privileged Gateway Intents:**

- SERVER MEMBERS INTENT (GuildMembers)
- PRESENCE INTENT (GuildPresences)
- MESSAGE CONTENT INTENT (MessageContent)

You must enable these intents in the [Discord Developer Portal](https://discord.com/developers/applications) under your application's "Bot" settings.

**Permissions Integer:**

```
40632541640768
```

**Permissions:**

- Send Messages
- Create Private Threads
- Send Messages in Threads
- Send TTS Messages
- Manage Messages
- Manage Threads
- Embed Links
- Attach Files
- Read Message History
- Use External Emojis
- Use External Stickers
- Add Reactions
- Use Slash Commands
- Use Embedded Activities
- Connect (voice)
- Speak (voice)
- Use Soundboard
- Use External Sounds
