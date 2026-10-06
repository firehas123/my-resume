This website. It is built with Next.js (App Router) and TypeScript, styled with plain CSS Modules and CSS variables, and deployed on Vercel.

## What is in it

- **Projects from GitHub.** A sync script reads my public repositories, sorts them into language tabs and takes each summary, overview and image from the repository's README. Projects without an image get a generated tile.
- **Motion.** Page transitions with shared elements (View Transitions), headlines that reveal line by line, a canvas dot field in the hero that reacts to the cursor or to taps, and a theme switch that spreads as a circle. Everything uses transform and opacity only, stays readable without JavaScript and turns off with reduced motion.
- **Contact form.** Sent through Web3Forms, with validation, a spam trap and no email address shown on the page.
- **Visit statistics.** A small, cookie-free counter of my own, stored in Redis, with charts and a world map.
- **Share images.** Generated at build time for the site and for every project.
