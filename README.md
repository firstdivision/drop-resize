# Drop Resize

Drop Resize is an Electron desktop app for batch image resizing.

## Current Features

- Main screen starts with a drag-and-drop image zone
- Pick images via native file dialog
- Settings are available from a gear icon in the upper-right
- Batch resize all selected images
- Resize modes:
  - Contain: preserves aspect ratio inside target bounds
  - Exact: forces exact width and height
- Output formats:
  - Keep source format when possible
  - PNG
  - JPEG with quality slider
- Output folder is optional:
  - If not set, each resized image is saved next to its source file
  - You can still choose a single custom output folder
- Output filename template support with placeholders:
  - {filename}
  - {extension}
  - {width}
  - {height}
- Detailed per-file success/failure results

## Defaults

- Width: 1900
- Height: 1900
- Filename template: {filename}-resized.{extension}

## Example Filename Templates

- {filename}-resized.{extension}
- {filename}-{width}x{height}.{extension}
- web-{filename}.{extension}

## Development

```bash
npm install
npm run dev
```

## Lint

```bash
npm run lint
```

## Build

```bash
npm run build
```

Build outputs are created in the release folder.

## GitHub Releases (Linux + Windows)

This repo includes a GitHub Actions workflow at `.github/workflows/release.yml` that:

- builds Linux and Windows packages in CI
- creates/updates a GitHub Release
- uploads built installers to the Release assets for public download

### Trigger options

- Push a tag (recommended for fixed versions):

```bash
git tag v1.2.3
git push origin v1.2.3
```

- Run manually from **Actions -> Build and Publish Release -> Run workflow**:
  - leave `version` empty to auto-generate a date-based version like `2026.4.17-build.142`
  - or set `version` explicitly (for example `1.2.3`)

Version values are validated as SemVer because Electron Builder uses the app version for artifact naming and output folders.
