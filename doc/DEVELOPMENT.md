# Development Notes

## Environment

- Node.js
- npm
- Zotero 9.x for runtime testing

## Useful commands

```bash
npm install
npm run test:unit
npx tsc --noEmit
npm run build
```

## Verification checklist

Before publishing:

1. Confirm `package.json` version is `0.1.0`
2. Run `npm run build`
3. Check `.scaffold/build/zotero-random-read.xpi` exists
4. Inspect the packaged manifest:

```bash
unzip -p .scaffold/build/zotero-random-read.xpi manifest.json
```

## GitHub release notes

- Repository: `https://github.com/heimi98/zotero-random-read`
- The scaffold release URLs are configured for GitHub Releases
- The built `.xpi` can be attached to a `v0.1.0` release later
