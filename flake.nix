{
  description = "Simple flake with a devshell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs?ref=nixos-unstable";
    nixpkgs-playwright.url = "github:NixOS/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { self, nixpkgs, nixpkgs-playwright, flake-utils }:
    {
      templates.default = {
        path = ./.;
        description = "Simple flake with a devshell";
      };
    } // flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
      inputs = { inherit nixpkgs-playwright; };
    in
    {
      devShells.default = import ./nix/devshell.nix { inherit pkgs inputs; };
      formatter = pkgs.nixpkgs-fmt;
    });
}
