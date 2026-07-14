# Yueyue Sapphire Hou — personal website

This is a static website designed for GitHub Pages. It uses plain HTML, CSS, and JavaScript, so no build system or paid hosting is required.

## Publish at yueyuesapphirehou.github.io

1. On GitHub, create a **public** repository named `yueyuesapphirehou.github.io`.
2. Upload every file from this folder to the root of that repository.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then save.
6. Open `https://yueyuesapphirehou.github.io`. Publication may take several minutes.

## Edit the website

### Text and links

Edit `index.html`. The file includes a content-editing map near the top. Search for these section IDs:

- `site-home`: name, introduction, affiliation, and profile links
- `research`: the three research themes
- `publications`: paper titles, authors, and DOI links
- `featured-project`: introduction to the interactive LFP project
- `about`: biography, methods, and public engagement
- `contact`: public email and professional profiles

### Colors and layout

Edit `styles.css`. The black theme and accent colors are grouped near the top of the `#lfp-story` rule:

- `--background`: page background
- `--foreground`: main text
- `--card`: panel background
- `--viz-series-1`, `--viz-series-2`, `--viz-series-3`: coral, purple, and teal accents

### Interactions

`script.js` controls the moving-dot task, neural-signal explorer, ROC/AUC demonstration, inactivation toggle, epoch explorer, and interpretation quiz. You normally do not need to edit this file when changing biography or publication details.

## Edit directly on GitHub

Open a file and select the pencil icon, or press the period key (`.`) while viewing the repository to open the github.dev editor. Commit the changes to `main`; GitHub Pages will republish the site automatically.

## Files

- `index.html` — all visible text and page structure
- `styles.css` — black theme, layout, and responsive design
- `script.js` — interactive scientific demonstrations
- `.nojekyll` — tells GitHub Pages to serve the files directly
