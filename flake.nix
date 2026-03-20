{
  description = "web-speed-hackathon-2026 development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            (final: prev: {
              nodejs_24 = prev.nodejs_24.overrideAttrs (old: rec {
                version = "24.14.0";
                src = prev.fetchurl {
                  url = "https://nodejs.org/dist/v${version}/node-v${version}.tar.xz";
                  hash = "sha256-XkuKiIC9Z8pONdHwc1UOxkfUeTIZU2PI5aEy+35uUzc=";
                };
              });
              corepack_24 = prev.corepack_24.override { nodejs = final.nodejs_24; };
            })
          ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
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
          '';
        };
      }
    );
}
