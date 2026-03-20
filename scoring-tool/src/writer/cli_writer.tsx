import Markdown from "@inkkit/ink-markdown";
import type { Instance } from "ink";
import { Newline, render, Text } from "ink";
import React from "react";

import type { Writer } from "./writer.ts";

export class CLIWriter implements Writer {
  private _ink: Instance;

  constructor() {
    this._ink = render(<Text />);
  }

  async initialize(): Promise<void> {
    // noop
  }

  async update(markdown: string): Promise<void> {
    this._ink.rerender(
      <Text>
        <Newline count={2} />
        <Markdown tab={2} reflowText={false}>
          {`${markdown}\n`}
        </Markdown>
        <Newline count={2} />
      </Text>,
    );
    return Promise.resolve();
  }
}
