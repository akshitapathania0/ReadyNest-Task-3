# InstaFlux — Setup Guide

## Prerequisites
- Node.js 18+
- pnpm (or npm)
- MySQL database (local or Aiven/PlanetScale/Render MySQL)
- Cloudinary account

## Features
- JWT auth via HTTP-only cookies
- Bcrypt password hashing
- Cloudinary image uploads (posts + profiles, up to 5 images per post)
- Infinite-scroll feed
- Real-time likes, comments, follows, notifications via Socket.IO
- Save/bookmark posts
- User search + suggestions
- Follow/unfollow with follower count
- Dark mode (persisted in localStorage)
- Responsive mobile/tablet/desktop layout
