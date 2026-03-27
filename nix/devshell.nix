
{ pkgs, inputs }:
let
  pkgs-playwright = import inputs.nixpkgs-playwright { system = pkgs.stdenv.system; };
  browsers = (builtins.fromJSON (builtins.readFile "${pkgs-playwright.playwright-driver}/browsers.json")).browsers;
  chromium-rev = (builtins.head (builtins.filter (x: x.name == "chromium") browsers)).revision;
in
pkgs.mkShell {
  # Add build dependencies
  packages = with pkgs; [
    pnpm_10
    nodejs_24
    google-chrome
    libwebp
    ffmpeg
  ];

  # Add environment variables
  env = {
    PLAYWRIGHT_BROWSERS_PATH = "${pkgs-playwright.playwright-driver.browsers}";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true;
    PLAYWRIGHT_NODEJS_PATH = "${pkgs.nodejs_22}/bin/node";
    PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH = "${pkgs-playwright.playwright-driver.browsers}/chromium-${chromium-rev}/chrome-linux64/chrome";
    E2E_WORKERS=2;
  };

  # Load custom bash code
  shellHook = ''

  '';
}
