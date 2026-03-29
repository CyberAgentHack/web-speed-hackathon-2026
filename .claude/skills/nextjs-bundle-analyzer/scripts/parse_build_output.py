#!/usr/bin/env python3
"""Parse Next.js bundle analysis data from .next/diagnostics/.

Next.js 16 (Turbopack) does not print per-route sizes in terminal output.
Instead, use .next/diagnostics/route-bundle-stats.json which is always generated
when building with --experimental-analyze.
"""

import json
import sys
from pathlib import Path


def read_route_bundle_stats(project_dir: Path) -> list[dict]:
    """Read per-route sizes from route-bundle-stats.json."""
    stats_file = project_dir / ".next" / "diagnostics" / "route-bundle-stats.json"
    if not stats_file.exists():
        return []
    return json.loads(stats_file.read_text())


def read_analyze_dir(project_dir: Path) -> dict:
    """Read data from .next/diagnostics/analyze/ directory."""
    analyze_dir = project_dir / ".next" / "diagnostics" / "analyze"
    result = {"routes_json": None, "txt_files": {}}

    routes_json = analyze_dir / "data" / "routes.json"
    if routes_json.exists():
        result["routes_json"] = json.loads(routes_json.read_text())

    for txt_file in sorted(analyze_dir.glob("*.txt")):
        content = txt_file.read_text()
        if content.strip():
            result["txt_files"][txt_file.name] = content

    return result


def analyze(project_dir: str = ".") -> dict:
    """Main analysis: read route-bundle-stats.json and analyze directory."""
    project = Path(project_dir)

    route_stats = read_route_bundle_stats(project)

    # Sort by size descending
    sorted_routes = sorted(
        route_stats,
        key=lambda x: x.get("firstLoadUncompressedJsBytes", 0),
        reverse=True,
    )

    total = sum(r.get("firstLoadUncompressedJsBytes", 0) for r in route_stats)

    report = {
        "routes": [
            {
                "route": r["route"],
                "firstLoadUncompressedJsBytes": r["firstLoadUncompressedJsBytes"],
                "firstLoadKB": round(r["firstLoadUncompressedJsBytes"] / 1024),
                "chunkCount": len(r.get("firstLoadChunkPaths", [])),
            }
            for r in sorted_routes
        ],
        "summary": {
            "totalRoutes": len(route_stats),
            "totalBytes": total,
            "totalKB": round(total / 1024),
            "maxBytes": sorted_routes[0]["firstLoadUncompressedJsBytes"] if sorted_routes else 0,
            "maxRoute": sorted_routes[0]["route"] if sorted_routes else None,
            "minBytes": sorted_routes[-1]["firstLoadUncompressedJsBytes"] if sorted_routes else 0,
            "minRoute": sorted_routes[-1]["route"] if sorted_routes else None,
        },
        "analyze_data": read_analyze_dir(project) if (project / ".next" / "diagnostics" / "analyze").exists() else None,
    }

    return report


if __name__ == "__main__":
    project_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    result = analyze(project_dir)
    print(json.dumps(result, indent=2, ensure_ascii=False))