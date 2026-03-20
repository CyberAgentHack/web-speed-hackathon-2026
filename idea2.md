Check if there are any React components that can be replaced with pure CSS:
1. Components that only handle hover states (e.g., Hoverable) → replace with CSS :hover
2. Components that only handle aspect ratio (e.g., AspectRatio) → replace with CSS aspect-ratio property
3. Any other wrapper components that are just CSS in disguise

If found, replace with CSS and delete the components.
