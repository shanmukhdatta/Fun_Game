# Jumper Teja - Gundu Man

A small, mobile-friendly Flappy Bird-style game made with HTML, CSS, and the Canvas API. The game runs entirely in the browser; it has no build step, backend, or paid service requirement.

## Play locally

Open `index.html` in a browser, or serve the folder over HTTP:

```powershell
python -m http.server 8080
```

Then visit <http://localhost:8080>.

Tap/click the game or press **Space** / **↑** to flap. Use **Pause** or **P** to pause and resume. The Sound button controls game audio.

## Change the character or music

To use another player's approved photos, replace the files below with new files using the same names. Keeping the names means no code changes are needed.

| File | Used for | Suggested format |
| --- | --- | --- |
| `assets/teja/teja_hero.png` | Character during flight | Transparent PNG cutout |
| `assets/teja/teja_head.png` | Head burst animation | Transparent PNG crop |
| `assets/teja/teja_avatar.png` | Start and game-over cards | Square PNG avatar |

The three paths are declared near the top of `game.js` as `HERO_PHOTO_SRC`, `HEAD_PHOTO_SRC`, and `AVATAR_PHOTO_SRC`.

Replace the music files with approved audio, keeping the names and formats:

| File | When it plays |
| --- | --- |
| `assets/audio/gameplay.mpeg` | Loops while a round is active |
| `assets/audio/gameover.mp3` | Plays once after a loss |

The two audio paths are declared in the `assets` object in `game.js`. Browser audio starts after the player presses **START FLIGHT**, which also satisfies browser playback requirements. The Sound button mutes/unmutes both tracks.

Only commit photos and audio that you have permission to share. Files in a public repository and its deployed site can be viewed or downloaded by anyone.

## Assets and project files

- `index.html`, `style.css`, `game.js`: game page, styling, and gameplay.
- `assets/teja/`: the three character images used by the game.
- `assets/hostel/`: corridor background and obstacle art.
- `assets/audio/`: gameplay and game-over tracks.
- `make_hostel_assets.py`: regenerates the three hostel artwork PNGs (requires Pillow).
- `make_cutout.py`, `make_head.py`, `make_avatar.py`: optional character-image preparation utilities. The cutout and head scripts take the original photo path as an argument; the head crop script is tailored to Teja's source photo.

## Free deployment with GitHub Pages

The repository includes `.github/workflows/pages.yml`. It deploys this static game to GitHub Pages after each push to `main`; no build tool or paid hosting is needed.

1. Push the project to the `main` branch of a **public** GitHub repository (GitHub Pages is available for public repositories on GitHub Free).
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. The workflow deploys the site. Open the URL shown in the repository's **Settings → Pages** or the workflow's deployment summary. For this repository, the expected URL is <https://shanmukhdatta.github.io/Fun_Game/>.

After Pages is enabled, later pushes to `main` publish updates automatically. The site is static, so it can also be hosted on another free static hosting service without changing the game.

## Development

The Python scripts in the root are optional asset-preparation and browser-check utilities; they are not needed to play or deploy the game. The game itself has no package installation or build step.
