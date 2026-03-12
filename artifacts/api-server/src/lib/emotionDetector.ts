/**
 * Speech Emotion Recognition (SER) Engine
 *
 * This module simulates ML-based emotion detection from audio features.
 * In production, this would use TensorFlow.js with a pre-trained model
 * or call out to a Python FastAPI microservice with a real audio model.
 *
 * The simulation extracts pseudo-features from audio descriptors and maps
 * them to emotional states with confidence scores.
 */

export type Emotion = "stressed" | "drunk" | "abusive" | "pain" | "neutral";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface EmotionResult {
  emotion: Emotion;
  confidence: number;
  timestamp: number;
}

export interface EmotionScores {
  stressed: number;
  drunk: number;
  abusive: number;
  pain: number;
  neutral: number;
}

/**
 * Simulates audio feature extraction.
 * In production: extract MFCC, pitch, energy, zero-crossing rate, etc.
 */
function extractFeatures(audioData: string, segmentStart = 0): number[] {
  // Use hash of audio data to generate deterministic pseudo-features
  let hash = 0;
  for (let i = 0; i < Math.min(audioData.length, 100); i++) {
    hash = ((hash << 5) - hash) + audioData.charCodeAt(i);
    hash |= 0;
  }

  // Add time-based variation to simulate dynamic call content
  const timeVariance = Math.sin(segmentStart * 0.3) * 0.2;
  const rand = (seed: number) => {
    const x = Math.sin(seed + hash) * 10000;
    return x - Math.floor(x);
  };

  return [
    rand(1) + timeVariance, // Simulated pitch variance
    rand(2) + timeVariance, // Simulated energy
    rand(3),                // Simulated spectral centroid
    rand(4),                // Simulated MFCC-1
    rand(5),                // Simulated MFCC-2
    rand(6),                // Simulated zero-crossing rate
    rand(7),                // Simulated rhythm
    rand(8),                // Simulated loudness
  ];
}

/**
 * Maps audio features to emotion confidence scores.
 * In production: this is replaced by TensorFlow.js model inference.
 */
function inferEmotionScores(features: number[], callId: string): EmotionScores {
  const [pitchVar, energy, spectral, mfcc1, mfcc2, zcr, rhythm, loudness] = features;

  // Simulate emotion classification based on feature patterns
  let callSeed = 0;
  for (const ch of callId) callSeed += ch.charCodeAt(0);

  const base = (callSeed % 5);
  const scores: EmotionScores = { stressed: 0, drunk: 0, abusive: 0, pain: 0, neutral: 0 };

  // Different calls simulate different primary emotions
  switch (base % 5) {
    case 0: // Stressed call
      scores.stressed = 0.5 + pitchVar * 0.35;
      scores.neutral = 0.2 + mfcc1 * 0.15;
      scores.pain = energy * 0.15;
      scores.drunk = zcr * 0.1;
      scores.abusive = spectral * 0.05;
      break;
    case 1: // Drunk call
      scores.drunk = 0.45 + rhythm * 0.35;
      scores.neutral = 0.25 + mfcc2 * 0.12;
      scores.stressed = energy * 0.12;
      scores.abusive = pitchVar * 0.08;
      scores.pain = loudness * 0.05;
      break;
    case 2: // Abusive call
      scores.abusive = 0.55 + loudness * 0.30;
      scores.stressed = 0.25 + energy * 0.15;
      scores.neutral = mfcc1 * 0.08;
      scores.pain = spectral * 0.07;
      scores.drunk = zcr * 0.05;
      break;
    case 3: // Pain/distress call
      scores.pain = 0.48 + energy * 0.32;
      scores.stressed = 0.22 + pitchVar * 0.18;
      scores.neutral = mfcc2 * 0.10;
      scores.drunk = rhythm * 0.08;
      scores.abusive = loudness * 0.05;
      break;
    default: // Neutral call
      scores.neutral = 0.60 + mfcc1 * 0.20;
      scores.stressed = pitchVar * 0.10;
      scores.drunk = zcr * 0.07;
      scores.pain = energy * 0.06;
      scores.abusive = spectral * 0.04;
      break;
  }

  // Normalize to sum to 1
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const key of Object.keys(scores) as Emotion[]) {
      scores[key] = Math.max(0, Math.min(1, scores[key] / total));
    }
  }

  return scores;
}

/**
 * Determine risk level from dominant emotion and confidence.
 */
function getRiskLevel(emotion: Emotion, confidence: number): RiskLevel {
  if (emotion === "neutral") return "low";
  if (confidence < 0.4) return "low";

  switch (emotion) {
    case "stressed":
      return confidence > 0.75 ? "high" : confidence > 0.55 ? "medium" : "low";
    case "drunk":
      return confidence > 0.65 ? "high" : "medium";
    case "abusive":
      return confidence > 0.55 ? "critical" : "high";
    case "pain":
      return confidence > 0.60 ? "critical" : "high";
    default:
      return "low";
  }
}

/**
 * Main emotion analysis entry point.
 * audioData: base64 audio chunk or descriptor string
 * segmentStart: seconds from start of call
 */
export function analyzeEmotion(
  audioData: string,
  callId: string,
  segmentStart = 0,
): { emotions: EmotionResult[]; dominantEmotion: Emotion; riskLevel: RiskLevel; shouldEscalate: boolean } {
  const features = extractFeatures(audioData, segmentStart);
  const scores = inferEmotionScores(features, callId);

  // Build result array sorted by confidence
  const emotions: EmotionResult[] = (Object.entries(scores) as [Emotion, number][])
    .map(([emotion, confidence]) => ({
      emotion,
      confidence: Math.round(confidence * 1000) / 1000,
      timestamp: segmentStart,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const dominant = emotions[0];
  const riskLevel = getRiskLevel(dominant.emotion, dominant.confidence);
  const shouldEscalate = riskLevel === "critical" || (riskLevel === "high" && dominant.confidence > 0.70);

  return {
    emotions,
    dominantEmotion: dominant.emotion,
    riskLevel,
    shouldEscalate,
  };
}
