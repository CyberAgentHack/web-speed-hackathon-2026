{
  description = "web-speed-hackathon-2026 development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Development: Node.js 24 + pnpm (project requires node 24.14.0, pnpm 10.32.1)
            nodejs_24
            corepack_24

            # Database
            sqlite

            # Bench: Browser for Lighthouse headless
            chromium

            # Bench: Utilities
            jq
            bc
            coreutils
            gnused
            gawk
          ];

          shellHook = ''
            export CHROME_PATH="${pkgs.chromium}/bin/chromium"
            export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
            export PUPPETEER_EXECUTABLE_PATH="${pkgs.chromium}/bin/chromium"

            # corepack_24 in buildInputs already provides pnpm on PATH
          '';
        };
      }
    );
}
