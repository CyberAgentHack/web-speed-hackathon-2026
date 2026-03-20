main.js is now 3.2MB. Remaining targets:
1. redux-form → check if it can be replaced with react-hook-form (much lighter) or uncontrolled forms
2. @imagemagick/magick-wasm JS wrapper → lazy-load, only needed for image processing UI
3. pako → check usage and lazy-load if possible
4. transitive lodash → use lodash-es or babel-plugin-lodash to tree-shake transitive deps

Validate build and typecheck after each change.
