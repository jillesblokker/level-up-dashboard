// Animation Types
export type AnimationType = 
  | 'fade' 
  | 'slide' 
  | 'scale' 
  | 'rotate' 
  | 'bounce' 
  | 'shake' 
  | 'pulse';

export type AnimationTiming = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

// Animation Configuration
export interface AnimationConfig {
  type: AnimationType;
  duration: number;
  timing: AnimationTiming;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
}

// Animation Keyframes
export interface Keyframe {
  offset: number;
  [key: string]: string | number;
}

// Animation Manager Class
export class AnimationManager {
  private static instance: AnimationManager;
  private activeAnimations: Map<string, Animation>;
  private defaultConfig: AnimationConfig = {
    type: 'fade',
    duration: 300,
    timing: 'ease',
    iterations: 1,
    direction: 'normal',
    fill: 'forwards'
  };

  private constructor() {
    this.activeAnimations = new Map();
  }

  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  public animate(
    element: HTMLElement,
    config: Partial<AnimationConfig> = {}
  ): Promise<void> {
    const animationId = Math.random().toString(36).substr(2, 9);
    const fullConfig = { ...this.defaultConfig, ...config };
    
    const keyframes = this.generateKeyframes(fullConfig.type);
    const animation = element.animate(keyframes, {
      duration: fullConfig.duration,
      easing: fullConfig.timing,
      delay: fullConfig.delay ?? 0,
      iterations: fullConfig.iterations ?? 1,
      direction: fullConfig.direction ?? 'normal',
      fill: fullConfig.fill ?? 'forwards'
    });

    this.activeAnimations.set(animationId, animation);

    return new Promise((resolve) => {
      animation.onfinish = () => {
        this.activeAnimations.delete(animationId);
        resolve();
      };
    });
  }

  private generateKeyframes(type: AnimationType): Keyframe[] {
    switch (type) {
      case 'fade':
        return [
          { offset: 0, opacity: 1 },
          { offset: 1, opacity: 0 }
        ];
      case 'slide':
        return [
          { offset: 0, transform: 'translateX(0)' },
          { offset: 1, transform: 'translateX(100%)' }
        ];
      case 'scale':
        return [
          { offset: 0, transform: 'scale(1)' },
          { offset: 1, transform: 'scale(0)' }
        ];
      case 'rotate':
        return [
          { offset: 0, transform: 'rotate(0deg)' },
          { offset: 1, transform: 'rotate(360deg)' }
        ];
      case 'bounce':
        return [
          { offset: 0, transform: 'translateY(0)' },
          { offset: 0.5, transform: 'translateY(-20px)' },
          { offset: 1, transform: 'translateY(0)' }
        ];
      case 'shake':
        return [
          { offset: 0, transform: 'translateX(0)' },
          { offset: 0.1, transform: 'translateX(-10px)' },
          { offset: 0.2, transform: 'translateX(10px)' },
          { offset: 0.3, transform: 'translateX(-10px)' },
          { offset: 0.4, transform: 'translateX(10px)' },
          { offset: 0.5, transform: 'translateX(-10px)' },
          { offset: 0.6, transform: 'translateX(10px)' },
          { offset: 0.7, transform: 'translateX(-10px)' },
          { offset: 0.8, transform: 'translateX(10px)' },
          { offset: 0.9, transform: 'translateX(-10px)' },
          { offset: 1, transform: 'translateX(0)' }
        ];
      case 'pulse':
        return [
          { offset: 0, transform: 'scale(1)' },
          { offset: 0.5, transform: 'scale(1.1)' },
          { offset: 1, transform: 'scale(1)' }
        ];
      default:
        return [];
    }
  }

  public stopAnimation(animationId: string) {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.cancel();
      this.activeAnimations.delete(animationId);
    }
  }

  public stopAllAnimations() {
    this.activeAnimations.forEach((animation) => {
      animation.cancel();
    });
    this.activeAnimations.clear();
  }
}

// Export singleton instance
export const animations = AnimationManager.getInstance(); 