import { useCallback } from 'react';
import type { Engine } from "tsparticles-engine";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import type { OutMode, MoveDirection } from "tsparticles-engine";

interface ElementParticlesProps {
  type: string;
}

export function ElementParticles({ type }: ElementParticlesProps) {
  const particleInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const getParticleConfig = (type: string) => {
    const baseConfig = {
      fpsLimit: 120,
      particles: {
        number: {
          value: 80,
          density: {
            enable: true,
            value_area: 800
          }
        },
        color: {
          value: "#ffffff"
        },
        shape: {
          type: "circle"
        },
        opacity: {
          value: 0.5,
          random: false,
          anim: {
            enable: false,
            speed: 1,
            opacity_min: 0.1,
            sync: false
          }
        },
        size: {
          value: 3,
          random: false,
          anim: {
            enable: false,
            speed: 40,
            size_min: 0.1,
            sync: false
          }
        },
        move: {
          enable: true,
          speed: 2,
          direction: "none" as MoveDirection,
          random: false,
          straight: false,
          outModes: {
            default: "out" as OutMode
          },
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200
          }
        }
      },
      detectRetina: true,
      fullScreen: {
        enable: false,
        zIndex: 1
      },
      style: {
        position: "absolute"
      }
    }

    switch (type.toLowerCase()) {
      case "fire":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: "#ff4400" },
            move: {
              ...baseConfig.particles.move,
              direction: "top" as MoveDirection,
              speed: 3
            }
          }
        }
      case "water":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: "#00aaff" },
            move: {
              ...baseConfig.particles.move,
              direction: "none" as MoveDirection,
              speed: 1
            }
          }
        }
      case "grass":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: "#00ff44" },
            move: {
              ...baseConfig.particles.move,
              direction: "none" as MoveDirection,
              speed: 1.5
            }
          }
        }
      case "rock":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: "#aa8866" },
            size: { value: 4 },
            move: {
              ...baseConfig.particles.move,
              speed: 1
            }
          }
        }
      case "ice":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: "#aaddff" },
            size: { value: 2 },
            move: {
              ...baseConfig.particles.move,
              direction: "bottom" as MoveDirection,
              speed: 2
            }
          }
        }
      case "electric":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: "#ffff00" },
            size: { value: 2 },
            move: {
              ...baseConfig.particles.move,
              direction: "none" as MoveDirection,
              speed: 3,
              straight: true
            }
          }
        }
      case "dragon":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: "#ff0000" },
            size: { value: 3 },
            move: {
              ...baseConfig.particles.move,
              direction: "none" as MoveDirection,
              speed: 2.5,
              straight: false
            }
          }
        }
      case "poisonous":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: "#aa00ff" },
            size: { value: 2 },
            move: {
              ...baseConfig.particles.move,
              direction: "none" as MoveDirection,
              speed: 2,
              straight: false
            }
          }
        }
      default:
        return baseConfig
    }
  }

  return (
    <Particles
      className="absolute inset-0 pointer-events-none"
      init={particleInit}
      options={getParticleConfig(type)}
    />
  );
}