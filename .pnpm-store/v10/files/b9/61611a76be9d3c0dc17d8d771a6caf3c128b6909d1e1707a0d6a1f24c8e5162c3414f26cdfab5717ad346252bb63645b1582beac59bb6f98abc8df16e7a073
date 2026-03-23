### A base TSConfig for working with Strictest.

Add the package to your `"devDependencies"`:

```sh
npm install --save-dev @tsconfig/strictest
yarn add --dev @tsconfig/strictest
```

Add to your `tsconfig.json`:

```json
"extends": "@tsconfig/strictest/tsconfig.json"
```

---

The `tsconfig.json`: 

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    "isolatedModules": true,

    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "$schema": "https://www.schemastore.org/tsconfig",
  "_version": "2.0.0"
}

```

You can find the [code here](https://github.com/tsconfig/bases/blob/master/bases/strictest.json).
