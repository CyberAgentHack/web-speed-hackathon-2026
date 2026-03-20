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
          config.allowUnfree = true;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_24
            corepack_24

            # Database
            sqlite

            # Browser: Lighthouse / Playwright / scoring-tool
            google-chrome

            # Bench: Utilities
            jq
            bc
            coreutils
            gnused
            gawk
          ];

          shellHook = ''
            export CHROME_PATH="${pkgs.google-chrome}/bin/google-chrome-stable"
            export CHROMIUM_PATH="${pkgs.google-chrome}/bin/google-chrome-stable"
            export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
            export PUPPETEER_EXECUTABLE_PATH="${pkgs.google-chrome}/bin/google-chrome-stable"

            # actrun (GitHub Actions 互換ローカルランナー)
            export npm_config_prefix="$PWD/.npm-global"
            export PATH="$npm_config_prefix/bin:$PATH"
            if ! command -v actrun &>/dev/null; then
              echo "Installing actrun..."
              npm install -g @mizchi/actrun 2>/dev/null
            fi
          '';
        };
      }
    );
}
