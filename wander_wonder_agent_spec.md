# Wander / Wonder — AI Coding Agent Project Brief

## 1. Project Overview

Build an offline-first, location-aware family adventure web application that turns road trips, vacations, waiting, and exploration into games, learning experiences, and lasting memories.

The original concept began as a License Plate Game used by a family. The product should preserve that experience while expanding into a broader platform:

> PLAY → DISCOVER → REMEMBER

The first real-world beta will be used by a family and extended family during an upcoming trip to Grand Teton National Park.

The application should be designed so the initial MVP is useful and fun, but the architecture can eventually support destination-specific games, educational experiences, family multiplayer, custom games, and a long-term family adventure history.

## 2. Working Name

The product name is currently undecided.

The current naming direction is based around the idea of **Wander + Wonder**, potentially using a two-W visual identity.

Do not hard-code the working name deeply into the architecture. Use a configurable product name where practical.

Potential future branding direction:

- Wander + Wonder
- Two W's forming mountains, valleys, buildings, roads, etc.
- Friendly, adventurous, curious, family-oriented
- Avoid feeling like a children's-only product

## 3. Product Vision

The product is not ultimately a license plate tracker.

It is not a travel guide.

It is not a trivia app.

It is not a photo album.

It is a family adventure platform.

The application should help people:

- PLAY while traveling
- DISCOVER the places around them
- LEARN interesting things about the world
- CONNECT with the people they are traveling with
- REMEMBER the experiences they shared

The license plate game is the first game and the initial wedge into the product.

## 4. Core Product Principles

### 4.1 The world is the game

Encourage users to look at and interact with the world around them.

The phone should primarily act as:

- Game host
- Scorekeeper
- Guide
- Memory keeper

Avoid designs that encourage people to stare at the phone continuously.

### 4.2 Offline first

Assume users may have:

- No cellular service
- No Wi-Fi
- Intermittent connectivity
- Limited battery

Core gameplay must continue without an internet connection.

Users should be able to:

- Start trips
- Play games
- Track discoveries
- Track scores
- View downloaded destination content
- Add memories
- Take photos
- Continue gameplay

When connectivity returns, synchronize data.

### 4.3 Shared trip, independent players

Multiple people can participate in the same trip while maintaining individual progress.

Example:

Grand Teton 2026:

- Ben
- Spouse
- Logan
- Grandma
- Sister-in-law

The trip is shared.

Each player can maintain their own:

- Score
- Discoveries
- Achievements
- Photos
- Lifetime history

This specifically solves an existing family use case where different family members want to participate in the same game while maintaining separate collections.

## 5. Core Navigation

The primary product concepts should be:

### PLAY

What can we play right now?

### DISCOVER

What is interesting about where we are?

### TRIP

What are we doing on this trip?

### MEMORIES

What have we experienced together?

Keep navigation simple and family-friendly.

## 6. Trip Creation

Users can create a trip before leaving.

Example:

### Grand Teton Adventure

Dates:
August 2026

Participants:
- Family
- Grandma
- Extended family

Destinations:
- Grand Teton National Park
- Jackson, Wyoming
- Optional additional destinations

The trip should support downloading content for offline use.

### Trip package

A downloaded trip package may eventually contain:

- Destination information
- Games
- Trivia
- Historical content
- Wildlife information
- Landmarks
- Game configuration
- Player information
- Other data required for offline gameplay

## 7. Location-Aware Experiences

The application should use approximate device location when available to determine relevant content.

Location should influence available experiences.

### Driving

Potential games:

- License Plate Game
- Road Trip Bingo
- Car Hunt
- I Spy
- Roadside Scavenger Hunt
- State Streak

### Grand Teton

Potential experiences:

- Wildlife Hunt
- Grand Teton Trivia
- Geology Discovery
- History Challenge
- Landmark Hunt
- Nature Bingo
- Photography Challenges
- "How Does This Work?"
- Interesting facts

### Jackson

Potential experiences:

- Local History
- Western History
- Landmark Hunt
- Trivia
- Scavenger Hunt

### Waiting

Provide short games based on the amount of available time.

Location should not be the only input. Users should also be able to manually select their situation.

## 8. Situational Modes

Users can explicitly tell the application what they are doing:

- Driving
- Exploring
- Sightseeing
- Waiting
- Eating
- Relaxing
- Just give us something fun

This supplements GPS and allows useful experiences when location is unavailable or inaccurate.

## 9. License Plate Game

The original License Plate Game is a flagship experience.

### MVP requirements

Track:

- 50 U.S. states
- Washington DC
- Canadian provinces/territories if practical

Each player has an independent collection.

Example:

Grandma: 42/50

Ben: 38/50

Logan: 45/50

### Scoring

Support configurable scoring.

Initial example:

- Common state: 1 point
- Less common state: 2 points
- Rare state: 5 points

Potential bonuses:

- First plate of trip
- Last missing state
- Consecutive states
- Region completion

Do not over-engineer scoring in the first version.

## 10. Road Trip Games

Initial game candidates:

### License Plate Hunt

Find different states.

### Road Trip Bingo

Individual bingo cards containing discoveries such as:

- Semi
- Motorcycle
- Tractor
- Camper
- Police car
- Train
- Animal
- Water tower

### Car Hunt

Find specific vehicle types.

### I Spy

Examples:

- Find something blue.
- Find an animal.
- Find something shaped like a triangle.

### State Streak

Find different states consecutively.

### Roadside Scavenger Hunt

Find objects visible from the road.

## 11. National Park Games

National parks should become an important destination category.

For Grand Teton, potential wildlife:

- Moose
- Elk
- Bison
- Pronghorn
- Bald eagle
- Bear
- Marmot
- Deer

Track:

- Observed
- Optionally photographed

Potential landmarks:

- Teton Range
- Jenny Lake
- Jackson Lake
- Snake River
- Mormon Row
- Chapel of the Transfiguration
- Schwabacher Landing
- Oxbow Bend

The app must not encourage unsafe stopping, wildlife approach, or other unsafe behavior.

## 12. Learn Mode

Every destination should eventually offer educational content.

Categories:

### History

How did this place become what it is?

### Geology

How was the landscape formed?

### Wildlife

What animals live here?

### Human History

Who lived here?

### How Things Work

How do natural or human-made things work?

### Weird Facts

Interesting things people probably do not know.

## 13. Interactive Learning

Avoid large walls of text.

Prefer:

- Questions
- Multiple choice
- Predictions
- Short explanations
- Visual discoveries
- Conversation prompts

Example:

> Why are the Tetons so dramatically shaped?

A. Glaciers  
B. Fault movement  
C. Volcanoes  
D. Ancient erosion

Everyone guesses.

Then reveal the answer and provide a short explanation.

Learning should feel like gameplay rather than schoolwork.

## 14. "How Does That Work?"

Location-aware educational prompts.

Examples:

At a mountain:

> How was this mountain formed?

At a river:

> Where does this water come from?

At a geyser:

> Why does this erupt?

At a dam:

> How does this generate electricity?

At a farm:

> How does a combine harvest wheat?

This category can eventually work almost anywhere.

## 15. Waiting Mode

Waiting is a first-class product experience.

Ask:

> How long are we waiting?

Options:

- 5 minutes
- 10 minutes
- 20 minutes
- 30+ minutes

Recommend appropriate games.

Potential games:

- Trivia
- Would You Rather
- Alphabet Game
- Twenty Questions
- Character Challenge
- Family Challenge

## 16. Location-Specific Waiting

Eventually support destination-specific waiting experiences.

### Disneyland examples

- Disney Trivia
- Character Hunt
- Hidden Mickey-style hunts
- Ride trivia
- Disney history
- How attractions work
- Would You Rather
- Park challenges

Other potential waiting environments:

- Airports
- Restaurants
- Museums
- Theme parks
- Train stations
- Doctor's offices
- DMV
- Any place where people are waiting

## 17. Family Multiplayer

A trip contains multiple players.

Each player has:

- Name
- Avatar
- Score
- Discoveries
- Achievements

Players can join a trip using a short code.

Example:

TETON-482

Grandma enters the code and joins the trip.

### MVP multiplayer approach

Do not require sophisticated real-time multiplayer.

Each device can maintain local state.

Synchronization can happen when connectivity becomes available.

## 18. Offline Multiplayer

Design the data layer so future local-device synchronization is possible.

Potential future technologies:

- Bluetooth
- Local Wi-Fi
- Nearby-device synchronization

Do not make this a required MVP feature.

## 19. Trip Memory System

This is a major long-term feature.

Every trip should produce a persistent history.

Example:

# Grand Teton 2026

August 18–22

- 1,087 miles
- 6 games played
- 43 discoveries
- 27 trivia questions
- 18 wildlife observations
- 31 license plates

The exact stats should be generated from actual recorded activity.

## 20. Memory Timeline

Record significant events.

Example:

9:42 AM
- Wyoming license plate discovered.

11:15 AM
- First elk spotted.

12:34 PM
- Learned how the Tetons were formed.

2:15 PM
- Grandma won the wildlife challenge.

5:42 PM
- Family photo at Jenny Lake.

Users should be able to edit or delete memory events.

## 21. Photos

Allow photos to be associated with:

- Locations
- Discoveries
- Games
- Memories
- Trip events

The product should minimize manual organization.

Eventually it can suggest:

> Add this photo to your Grand Teton memory?

Photo handling should work offline.

## 22. Favorite Memories

Users can mark moments as:

- Favorite moment
- Favorite discovery
- Funniest moment
- Best game
- Favorite photo
- Most interesting thing learned

## 23. Post-Trip Experience

After a trip, create a recap.

Example:

# Grand Teton 2026

You traveled 1,087 miles together.

You discovered:

- 12 landmarks
- 18 animals
- 31 license plates
- 22 new facts
- 14 games

Family champions:

- License Plates — Logan
- Trivia — Grandma
- Wildlife — Ben
- Overall — Grandma

All numbers must come from actual trip data.

## 24. Trip Stories

Eventually generate a beautiful, shareable trip story containing:

- Route
- Places visited
- Games played
- Discoveries
- Photos
- Favorite moments
- Scores
- Funny moments
- Things learned

The story should become the family's permanent record of the trip.

## 25. Long-Term Family History

Users should eventually see all adventures.

Example:

### Our Adventures

2026
- Grand Teton
- Disneyland

2025
- Grand Canyon
- San Diego

2024
- Banff

Each trip can be reopened.

## 26. Return Visits

When a family returns somewhere:

> You've been here before!

Show:

- Previous trip
- Previous discoveries
- Previous games
- Previous scores
- Favorite memories

Potential challenge:

> Want to beat your previous score?

## 27. Game Engine

Games should share a common architecture.

Conceptual model:

```text
Game
├── Players
├── Rules
├── Challenges
├── Discoveries
├── Scores
├── Achievements
└── Memories
```

A new game should primarily introduce new rules/content rather than require an entirely separate technical system.

## 28. Content Model

Conceptual model:

```text
Location
├── Games
├── Trivia
├── History
├── Science
├── Landmarks
├── Wildlife
├── Scavenger Hunts
└── Memories
```

A destination can provide multiple experiences.

## 29. Offline Architecture

Offline behavior is a fundamental product requirement.

### Before trip

User selects:

> Download Trip

Download the data required to play without connectivity.

### During trip

The local device should be capable of:

- Reading trip content
- Recording gameplay
- Recording discoveries
- Recording scores
- Recording memories
- Taking photos
- Continuing after app restart

### When online

Synchronize local changes with cloud data.

The architecture should account for:

- Offline writes
- Sync retries
- Duplicate events
- Conflicting updates
- Multiple devices
- Last-known state

Do not implement a complex distributed system unnecessarily in MVP. Build clean boundaries so it can evolve.

## 30. Grand Teton MVP

The first beta should prove the concept rather than attempt the complete vision.

### Trip

- Create trip
- Add destinations
- Add players
- Download trip

### License Plates

- Track states
- Individual collections
- Scores
- Offline support

### Games

Implement approximately 4–6:

1. License Plate Game
2. Road Trip Bingo
3. Wildlife Hunt
4. Grand Teton Trivia
5. Scavenger Hunt
6. I Spy

### Location

- GPS detection
- Basic destination detection
- Manual location override

### Learn

- Grand Teton history
- Geology
- Wildlife
- Interesting facts
- Interactive trivia

### Memories

- Trip timeline
- Photos
- Favorite moments
- Game results

### Sync

Basic synchronization when connectivity returns.

## 31. Explicitly Out of Scope for MVP

Do not build these yet:

- Complex social network
- Public user-generated content
- Hundreds of destinations
- Sophisticated AI-generated content
- Bluetooth multiplayer
- Subscription billing
- Advanced maps
- Full trip booking
- Travel recommendations
- Extensive achievement system
- Dozens of games

## 32. Grand Teton Beta Test Plan

The beta should answer:

### Do people actually play?

Measure:

- Games started
- Games completed
- Players participating
- Game duration

### Does location-aware content work?

Observe whether the family actually wants different experiences in different places.

### Does offline mode work?

Intentionally test:

- No cellular service
- Airplane mode
- Poor connectivity
- App restart while offline

### Is learning fun?

Ask:

> Did you enjoy learning this?

rather than only:

> Did you learn this?

### Do people care about memories?

After the trip ask:

> Would you want to look back at this trip in a year?

## 33. Beta Success Criteria

The beta is successful if:

1. Family members voluntarily open the application.
2. Multiple generations participate.
3. Players continue playing without prompting.
4. Offline mode works reliably.
5. Location-specific games feel meaningfully different.
6. Learning content generates conversation.
7. The family wants to review the trip afterward.
8. Family members want to use the application on another trip.

The most important qualitative question is:

> "Can we make the family say, 'Let's play that game again'?"

## 34. Future Game Categories

### Road

- License Plates
- Car Hunt
- Road Bingo
- I Spy
- State Streak

### Nature

- Wildlife
- Birds
- Trees
- Geology
- Weather

### History

- Historical trivia
- Time travel
- Historical figure guessing
- "What happened here?"

### Science

- How Things Work
- Prediction Games
- Observation Challenges

### Family

- Would You Rather
- Family Trivia
- Two Truths and a Lie
- Conversation Starters

### Destination

- Theme Parks
- Museums
- Cities
- National Parks
- Beaches
- Resorts

### Waiting

- 5-minute games
- 10-minute games
- 30-minute games

## 35. Potential Monetization

Do not optimize for monetization during the Grand Teton beta.

Potential future models:

### Free

- License Plate Game
- Basic games
- Basic trips

### Premium

- Unlimited trips
- Family multiplayer
- Advanced memories
- More games
- Destination packs
- Custom games

### Destination Packs

Potential examples:

- Grand Teton
- Yellowstone
- Disneyland
- Disney World
- Zion
- New York City
- Washington DC

### Family Plan

One account shared across a family.

## 36. Future AI Features

AI may eventually generate experiences based on:

- Location
- Destination
- Player ages
- Time available
- Interests

Potential generated content:

- Trivia
- History lessons
- Scavenger hunts
- Conversation prompts
- Games
- Interesting facts

Important constraint:

Factual destination information must be grounded in trusted sources.

AI must not invent historical facts, scientific claims, landmarks, or other factual destination information.

AI-generated experiences should ideally be generated/downloaded before the user enters an offline area.

## 37. Product Positioning

Do not position the product exclusively as a license plate application.

Core positioning:

> Make every adventure more fun—and remember it forever.

Potential taglines:

> Turn the world into a game.

> Play where you are.

> Explore. Play. Remember.

## 38. Product Evolution

### Phase 1
License Plate Game + Trip + Offline

### Phase 2
Location-aware games

### Phase 3
National Park / destination experiences

### Phase 4
Trip memories and family history

### Phase 5
Custom family games

### Phase 6
AI-assisted game/content generation

### Phase 7
Public destination/game marketplace

## 39. Branding Direction

The current naming exploration is moving toward a **Wander + Wonder** concept.

The name should communicate:

- Curiosity
- Movement
- Discovery
- Adventure
- Family
- Play
- Memories

The visual identity may use two W shapes to create imagery such as:

- Mountains
- Valleys
- Roads
- Buildings
- Waves
- Landscapes

Avoid overly childish branding. The product should appeal to grandparents, parents, teens, and children.

## 40. Technical Agent Instructions

Build the MVP incrementally.

Before implementing a feature:

1. Understand the user experience.
2. Identify the domain model.
3. Identify offline requirements.
4. Determine whether the feature belongs in the shared game framework.
5. Implement the smallest useful version.
6. Add tests for important business rules.
7. Verify the feature works without network connectivity where applicable.

After implementing a feature:

1. Explain what was changed.
2. Explain the important architectural decisions.
3. Explain how the offline behavior works.
4. Explain how the feature will support future expansion.
5. Identify any known limitations or technical debt.

Favor:

- Simple architecture
- Strong domain boundaries
- Local-first data handling
- Testable game rules
- Extensible game/content models
- Clear separation between game logic and UI
- Progressive enhancement for location/network features

Do not prematurely build infrastructure for features that are explicitly out of scope for the MVP.

## 41. First Development Milestone

The first milestone should be a playable local prototype.

A user should be able to:

1. Create a Grand Teton trip.
2. Add several family members.
3. Start a License Plate Game.
4. Record plates for individual players.
5. Play at least one additional game.
6. View destination-specific content.
7. Turn off network connectivity.
8. Continue playing.
9. Record a memory.
10. View a basic trip recap.

Only after this workflow works well should additional games and advanced functionality be added.

## 42. Guiding Product Question

At every major product decision, ask:

> Does this help a family PLAY, DISCOVER, CONNECT, or REMEMBER?

If it does none of those things, it probably does not belong in the product.
