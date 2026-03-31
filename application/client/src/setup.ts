import jquery from "jquery";
import { Buffer } from "buffer";
import * as standardizedAudioContext from "standardized-audio-context";

// Inject globals exactly as ProvidePlugin did in webpack
(window as any).$ = jquery;
(window as any).jQuery = jquery;
(window as any).Buffer = Buffer;
(window as any).AudioContext = (standardizedAudioContext as any).AudioContext;
