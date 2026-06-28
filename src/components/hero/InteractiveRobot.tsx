import { useState } from "react";
import Spline from "@splinetool/react-spline";
import * as THREE from "three";

// ─── AVELIS Brand Palette ───────────────────────────────────────────────────
const PALETTE = {
  deepNavy:    new THREE.Color(0x07111F),
  surface:     new THREE.Color(0x0D1830),
  mutedSlate:  new THREE.Color(0x1A2433),
  gold:        new THREE.Color(0xC9A227),
  softGold:    new THREE.Color(0xE5C16B),
  warmIvory:   new THREE.Color(0xF7F5EE),
  darkGraphite: new THREE.Color(0x12191F),
};

// ─── Helper: Convert THREE.Color to HSL for smarter analysis ────────────────
function getHSL(color: THREE.Color) {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  return hsl;
}

// ─── Helper: Compute perceived luminance ────────────────────────────────────
function luminance(c: THREE.Color): number {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

// ─── Helper: Check if a color is "cool" (blue/purple/cyan/violet family) ────
function isCoolTone(c: THREE.Color): boolean {
  const { h, s } = getHSL(c);
  // Hue 0.5–0.85 covers cyan → blue → violet → purple
  return s > 0.1 && h >= 0.5 && h <= 0.85;
}

// ─── Helper: Check if a color is "warm neon" (magenta/pink/red-violet) ──────
function isWarmNeon(c: THREE.Color): boolean {
  const { h, s } = getHSL(c);
  return s > 0.3 && (h > 0.85 || h < 0.05) && c.b > 0.2;
}

// ─── Helper: Check if a color is nearly achromatic (gray/white/black) ───────
function isNeutral(c: THREE.Color): boolean {
  const { s } = getHSL(c);
  return s < 0.12;
}

// ─── Safe property setter ───────────────────────────────────────────────────
function safeSet(material: any, prop: string, value: number) {
  if (prop in material && typeof material[prop] === "number") {
    material[prop] = value;
  }
}

// ─── Core: Restyle a single material to AVELIS brand ────────────────────────
function restyleMaterial(material: THREE.Material) {
  // Only touch standard PBR materials; leave shaders, sprites, etc. alone
  if (
    !(material instanceof THREE.MeshStandardMaterial) &&
    !(material instanceof THREE.MeshPhysicalMaterial) &&
    !(material instanceof THREE.MeshPhongMaterial)
  ) {
    return;
  }

  const mat = material as THREE.MeshStandardMaterial;
  const color = mat.color;
  const hsl = getHSL(color);
  const lum = luminance(color);

  // ── 1. Emissive / Glowing elements (eyes, indicators) ──────────────────
  //    These are the most recognizable parts — treat them as warm ivory glass
  //    with a soft gold inner glow.
  if (mat.emissive && luminance(mat.emissive) > 0.01) {
    mat.color.copy(PALETTE.warmIvory);
    mat.emissive.copy(PALETTE.softGold);
    mat.emissiveIntensity = Math.min(mat.emissiveIntensity, 0.3);
    // Clamp to a soft, alive-but-calm glow
    if (mat.emissiveIntensity < 0.05) mat.emissiveIntensity = 0.15;
    safeSet(mat, "roughness", 0.15);
    safeSet(mat, "metalness", 0.1);
    mat.needsUpdate = true;
    return;
  }

  // ── 2. Cool-toned surfaces (blue, purple, cyan, violet) ────────────────
  //    These become either deep navy body panels or polished gold accents,
  //    depending on brightness.
  if (isCoolTone(color)) {
    if (lum > 0.35) {
      // Bright cool accent → polished gold trim
      color.copy(PALETTE.gold);
      safeSet(mat, "roughness", 0.18);
      safeSet(mat, "metalness", 0.92);
    } else if (lum > 0.12) {
      // Mid-tone cool surface → muted slate with subtle metallic
      color.copy(PALETTE.mutedSlate);
      safeSet(mat, "roughness", 0.55);
      safeSet(mat, "metalness", 0.45);
    } else {
      // Dark cool surface → deep navy brushed metal
      color.copy(PALETTE.deepNavy);
      safeSet(mat, "roughness", 0.6);
      safeSet(mat, "metalness", 0.5);
    }

    // Kill any residual cool emissive bleed
    if (mat.emissive) {
      const emLum = luminance(mat.emissive);
      if (emLum > 0.01 && isCoolTone(mat.emissive)) {
        mat.emissive.copy(PALETTE.softGold);
        mat.emissiveIntensity = Math.min(mat.emissiveIntensity * 0.3, 0.15);
      }
    }

    mat.needsUpdate = true;
    return;
  }

  // ── 3. Warm neon accents (magenta / pink / red-violet) ─────────────────
  //    Convert to gold accents
  if (isWarmNeon(color)) {
    color.copy(PALETTE.gold);
    safeSet(mat, "roughness", 0.2);
    safeSet(mat, "metalness", 0.85);

    if (mat.emissive && luminance(mat.emissive) > 0.01) {
      mat.emissive.copy(PALETTE.softGold);
      mat.emissiveIntensity = Math.min(mat.emissiveIntensity * 0.4, 0.2);
    }

    mat.needsUpdate = true;
    return;
  }

  // ── 4. Neutral surfaces (gray, white, black) ──────────────────────────
  //    Map based on luminance:
  //      Very dark → deep navy
  //      Mid-gray → dark graphite / muted slate (joints / titanium parts)
  //      Light / white → deep navy satin (body panels)
  if (isNeutral(color)) {
    if (lum > 0.6) {
      // Light gray / white body panels → deep navy satin metallic
      color.copy(PALETTE.deepNavy);
      safeSet(mat, "roughness", 0.55);
      safeSet(mat, "metalness", 0.5);
    } else if (lum > 0.2) {
      // Mid gray → dark graphite (joints, neck, mechanical parts)
      color.copy(PALETTE.darkGraphite);
      safeSet(mat, "roughness", 0.5);
      safeSet(mat, "metalness", 0.55);
    } else if (lum > 0.05) {
      // Dark gray → muted slate with a touch of metallic
      color.copy(PALETTE.mutedSlate);
      safeSet(mat, "roughness", 0.6);
      safeSet(mat, "metalness", 0.4);
    }
    // Very dark (near black) — leave as is; it already fits the dark theme

    mat.needsUpdate = true;
    return;
  }

  // ── 5. Any remaining saturated warm tones (yellow, orange, green) ──────
  //    If saturated enough, convert to gold. Otherwise leave alone.
  if (hsl.s > 0.3) {
    if (hsl.h > 0.1 && hsl.h < 0.5) {
      // Green / yellow / orange range → soft gold
      color.copy(lum > 0.3 ? PALETTE.gold : PALETTE.softGold);
      safeSet(mat, "roughness", 0.25);
      safeSet(mat, "metalness", 0.8);
      mat.needsUpdate = true;
    }
  }
}

// ─── Core: Restyle a single light to warm cinematic tones ───────────────────
function restyleLight(light: THREE.Light) {
  const color = light.color;
  const hsl = getHSL(color);

  // Cool-toned lights → warm ivory
  if (isCoolTone(color)) {
    color.copy(PALETTE.warmIvory);
  }
  // Very white / cold white → warm ivory tint
  else if (isNeutral(color) && luminance(color) > 0.7) {
    color.copy(PALETTE.warmIvory);
  }
  // Warm neon → soft gold
  else if (isWarmNeon(color)) {
    color.copy(PALETTE.softGold);
  }
  // If it's already warm-ish, give it a very slight gold shift
  else if (hsl.s < 0.2 && luminance(color) > 0.4) {
    color.lerp(PALETTE.warmIvory, 0.3);
  }

  // Slightly reduce overly intense lights to prevent bloom
  if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
    if (light.intensity > 3) {
      light.intensity *= 0.7;
    }
  }
}

// ─── Main: Traverse the entire scene and apply overrides ────────────────────
function restyleScene(scene: THREE.Object3D) {
  scene.traverse((object: any) => {
    try {
      if (object instanceof THREE.Light) {
        restyleLight(object);
        return;
      }

      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.forEach((mat) => {
          if (mat) restyleMaterial(mat);
        });
      }
    } catch (err) {
      // Silently preserve the original appearance if anything goes wrong
      console.warn("[AVELIS] Could not restyle:", object.name, err);
    }
  });
}

// ─── React Component ────────────────────────────────────────────────────────
export const InteractiveRobot = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleSplineLoad = (splineApp: any) => {
    // The Spline runtime exposes the Three.js scene in different ways
    // depending on the version. Try common access patterns.
    const scene: THREE.Object3D | null =
      splineApp?._scene || splineApp?.scene || null;

    if (scene) {
      restyleScene(scene);
    }

    setIsLoaded(true);
  };

  return (
    <div className="relative w-full h-full min-h-[320px] md:min-h-[480px] max-h-[520px] flex items-center justify-center">
      {/* Premium Luxury Gold Loading Shimmer */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative w-72 h-72 rounded-full border border-primary/10 flex items-center justify-center">
            {/* Outer glowing pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
            <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl animate-pulse" />

            {/* Inner luxury spinner */}
            <div className="w-16 h-16 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />

            {/* Subtle text indicator */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-primary/60 uppercase whitespace-nowrap">
              Entering Sanctuary...
            </div>
          </div>
        </div>
      )}

      {/* Spline 3D Scene */}
      <div
        className={`w-full h-full transition-all duration-1000 ease-out ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <Spline
          scene="https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode"
          onLoad={handleSplineLoad}
        />
      </div>
    </div>
  );
};

export default InteractiveRobot;
