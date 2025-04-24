"use client"

import { useCallback } from 'react';
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";
import type { Engine, ISourceOptions, MoveDirection } from "tsparticles-engine";

interface ElementParticlesProps {
  type: string;
}

export function ElementParticles({ type }: ElementParticlesProps) {
  const particleInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const getParticleConfig = (type: string): ISourceOptions => {
    const baseConfig: ISourceOptions = {
      fullScreen: {
        enable: false,
        zIndex: 1
      },
      fpsLimit: 60,
      particles: {
        number: {
          value: 20,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: "#ffffff",
        },
        opacity: {
          value: 0.7,
          random: false,
        },
        size: {
          value: 4,
          random: true,
          animation: {
            enable: true,
            speed: 2,
            minimumValue: 2,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: 2,
          direction: "none" as MoveDirection,
          random: true,
          straight: false,
          outModes: {
            default: "bounce"
          },
        },
      },
      interactivity: {
        detectsOn: "canvas",
        events: {
          onHover: {
            enable: false
          },
          resize: true,
        },
      },
      detectRetina: true,
      background: {
        color: "transparent"
      }
    };

    const typeConfigs: Record<string, Partial<ISourceOptions>> = {
      "": {
        particles: {
          number: { value: 20 },
          color: { value: "#00ff44" },
          opacity: { value: 0.6 },
          size: { 
            value: 3,
            random: true,
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 2,
              sync: false
            }
          },
          move: { 
            enable: true,
            speed: 2,
            direction: "none" as MoveDirection,
            random: true,
            straight: false,
            outModes: {
              default: "bounce"
            }
          }
        }
      },
      fire: {
        particles: {
          number: { value: 20 },
          color: { value: "#ff4400" },
          opacity: { value: 0.8 },
          size: { 
            value: 4,
            random: true,
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 2,
              sync: false
            }
          },
          move: { 
            enable: true,
            speed: 3,
            direction: "none" as MoveDirection,
            random: true,
            straight: false,
            outModes: {
              default: "bounce"
            }
          }
        },
        emitters: [
          {
            direction: "top" as MoveDirection,
            rate: {
              quantity: 1,
              delay: 0.2
            },
            position: {
              x: 50,
              y: 100
            },
            size: {
              width: 100,
              height: 0
            }
          }
        ]
      },
      water: {
        particles: {
          number: { value: 20 },
          color: { value: "#00ffff" },
          opacity: { value: 0.6 },
          size: { 
            value: 3,
            random: true,
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 1,
              sync: false
            }
          },
          move: { 
            enable: true,
            speed: 2,
            direction: "none" as MoveDirection,
            random: true,
            straight: false,
            outModes: {
              default: "bounce"
            }
          }
        },
        emitters: [
          {
            direction: "bottom" as MoveDirection,
            rate: {
              quantity: 1,
              delay: 0.2
            },
            position: {
              x: 50,
              y: 0
            },
            size: {
              width: 100,
              height: 0
            }
          }
        ]
      },
      grass: {
        particles: {
          number: { value: 20 },
          color: { value: "#00ff44" },
          opacity: { value: 0.6 },
          size: { 
            value: 3,
            random: true,
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 2,
              sync: false
            }
          },
          move: { 
            enable: true,
            speed: 2,
            direction: "none" as MoveDirection,
            random: true,
            straight: false,
            outModes: {
              default: "bounce"
            }
          }
        },
        emitters: [
          {
            direction: "right" as MoveDirection,
            rate: {
              quantity: 1,
              delay: 0.2
            },
            position: {
              x: 0,
              y: 50
            },
            size: {
              width: 0,
              height: 100
            }
          }
        ]
      },
      rock: {
        particles: {
          number: { value: 20 },
          color: { value: "#964B00" },
          opacity: { value: 0.8 },
          size: { 
            value: 6,
            random: true,
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 4,
              sync: false
            }
          },
          move: { 
            enable: true,
            speed: 3,
            direction: "none" as MoveDirection,
            random: true,
            straight: false,
            outModes: {
              default: "bounce"
            }
          }
        },
        emitters: [
          {
            direction: "bottom" as MoveDirection,
            rate: {
              quantity: 1,
              delay: 0.2
            },
            position: {
              x: 50,
              y: 0
            },
            size: {
              width: 100,
              height: 0
            }
          }
        ]
      },
      ice: {
        particles: {
          number: { value: 20 },
          color: { value: "#A5F2F3" },
          opacity: { value: 0.6 },
          size: { 
            value: 4,
            random: true,
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 2,
              sync: false
            }
          },
          move: { 
            enable: true,
            speed: 2,
            direction: "none" as MoveDirection,
            random: true,
            straight: false,
            outModes: {
              default: "bounce"
            }
          }
        },
        emitters: [
          {
            direction: "bottom-right" as MoveDirection,
            rate: {
              quantity: 1,
              delay: 0.2
            },
            position: {
              x: 0,
              y: 0
            },
            size: {
              width: 0,
              height: 100
            }
          }
        ]
      },
      electric: {
        particles: {
          number: { value: 20 },
          color: { value: "#ffff00" },
          opacity: { value: 0.8 },
          size: { 
            value: 3,
            random: true,
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 1,
              sync: false
            }
          },
          move: { 
            enable: true,
            speed: 3,
            direction: "none" as MoveDirection,
            random: true,
            straight: false,
            outModes: {
              default: "bounce"
            }
          }
        }
      },
      dragon: {
        particles: {
          number: { value: 20 },
          color: { value: "#7038F8" },
          opacity: { value: 0.7 },
          size: { 
            value: 4,
            random: true,
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 2,
              sync: false
            }
          },
          move: { 
            enable: true,
            speed: 3,
            direction: "none" as MoveDirection,
            random: true,
            straight: false,
            outModes: {
              default: "bounce"
            }
          }
        }
      }
    };

    const effectiveType = type || "";
    const typeConfig = typeConfigs[effectiveType] || typeConfigs[""];
    
    return {
      ...baseConfig,
      ...typeConfig,
      particles: {
        ...baseConfig.particles,
        ...(typeConfig.particles || {})
      }
    };
  };

  return (
    <div className="absolute inset-0">
      <Particles
        id={`tsparticles-${Math.random()}`}
        init={particleInit}
        options={getParticleConfig(type)}
        className="absolute inset-0"
      />
    </div>
  );
}