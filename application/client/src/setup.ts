import { Buffer } from "buffer";
import * as standardizedAudioContext from "standardized-audio-context";

// Inject globals exactly as ProvidePlugin did in webpack
(window as any).Buffer = Buffer;
(window as any).AudioContext = (standardizedAudioContext as any).AudioContext;
