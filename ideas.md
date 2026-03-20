4. Replace heavy libraries with lighter alternatives:
   - Check if react-hook-form can be replaced with a lighter form library or native form handling
   - Check if any remaining date/time libraries can be replaced (dayjs is already in, anything else?)
   - Check for any icon libraries (e.g. @iconify, font-awesome) bundled at full size instead of tree-shaken

5. Replace webpack with Vite:
   - Current bundler is webpack with babel-loader which is slow and produces larger output
   - Migrate to Vite for faster builds and better tree-shaking
   - Pass current webpack.config.js to guide the migration
   - Validate with typecheck and build after migration
