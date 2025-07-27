import gsap from "gsap";
import { ShapeAnimation, AnimationTemplate, SpinAnimation, PulseAnimation, BounceAnimation, FadeAnimation, ShakeAnimation } from "@/types/canvasElements";

export const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  {
    type: "spin",
    name: "Spin",
    defaultValues: {
      id: "",
      type: "spin",
      duration: 3,
      startTime: 0,
      enabled: true,
      playOnSelect: true,
      repeat: -1,
      direction: "clockwise",
      degrees: 360,
      ease: "none"
    }
  },
  {
    type: "pulse",
    name: "Pulse",
    defaultValues: {
      id: "",
      type: "pulse",
      duration: 1.5,
      startTime: 0,
      enabled: true,
      playOnSelect: true,
      repeat: -1,
      scaleFrom: 1,
      scaleTo: 1.2,
      ease: "power2.inOut"
    }
  },
  {
    type: "bounce",
    name: "Bounce",
    defaultValues: {
      id: "",
      type: "bounce",
      duration: 2,
      startTime: 0,
      enabled: true,
      playOnSelect: true,
      repeat: -1,
      height: 50,
      bounces: 3,
      ease: "bounce.out"
    }
  },
  {
    type: "fade",
    name: "Fade",
    defaultValues: {
      id: "",
      type: "fade",
      duration: 2,
      startTime: 0,
      enabled: true,
      playOnSelect: true,
      repeat: -1,
      opacityFrom: 1,
      opacityTo: 0.3,
      ease: "power2.inOut"
    }
  },
  {
    type: "shake",
    name: "Shake",
    defaultValues: {
      id: "",
      type: "shake",
      duration: 0.5,
      startTime: 0,
      enabled: true,
      playOnSelect: false,
      repeat: 0,
      intensity: 10,
      axis: "both",
      ease: "power2.inOut"
    }
  }
];

export class AnimationManager {
  private timelines: Map<string, gsap.core.Timeline> = new Map();

  seekAnimationToTime(id: string, time: number, totalDuration: number) {
    const timeline = this.timelines.get(id);
    if (!timeline) return;

    const animationDuration = timeline.duration()

    if (animationDuration === 0) return;

    let progress = 0;

    if (timeline.repeat() === -1) {
    // For infinite animations, loop the progress
    progress = (time % animationDuration) / animationDuration;
  } else {
    // Handle finite animations
    const repeatCount = timeline.repeat() + 1;
    const totalAnimationTime = animationDuration * repeatCount;
    
    if (time <= totalAnimationTime) {
      // Animation is active, calculate looped progress
      progress = (time % animationDuration) / animationDuration;
    } else {
      // Animation has completed, show final state
      progress = 1;
    }
  }

    // Pause the timeline and seek to the calculated progress
    timeline.pause().progress(progress);
  }

  setTimelinePlayback(id: string, isPlaying: boolean) {
    const timeline = this.timelines.get(id);
    if (!timeline) return;

    if (isPlaying) {
      timeline.play();
    } else {
      timeline.pause();
    }
  }

  refreshAnimationState(id: string, currentTime: number, totalDuration: number) {
  const timeline = this.timelines.get(id);
  if (!timeline) return;
  
  // Force the timeline to update its visual state
  this.seekAnimationToTime(id, currentTime, totalDuration);
  
  // Trigger a render update
  if (timeline.getChildren) {
    timeline.getChildren().forEach((tween: any) => {
      if (tween.target && tween.target.getLayer) {
        tween.target.getLayer()?.batchDraw();
      }
    });
  }
}

  createAnimationTimeline(
    target: any,
    animation: ShapeAnimation,
    originalProps?: { rotation?: number; x?: number; y?: number; opacity?: number }
  ): gsap.core.Timeline {
    const timeline = gsap.timeline({
      repeat: animation.repeat ?? 0,
      paused: true,
      onComplete: () => {
        // Reset to original values when animation completes (for non-infinite animations)
        if (animation.repeat !== -1 && originalProps) {
          this.resetToOriginal(target, originalProps);
        }
      }
    });

    switch (animation.type) {
      case "spin":
        this.createSpinAnimation(timeline, target, animation as SpinAnimation, originalProps);
        break;
      case "pulse":
        this.createPulseAnimation(timeline, target, animation as PulseAnimation);
        break;
      case "bounce":
        this.createBounceAnimation(timeline, target, animation as BounceAnimation, originalProps);
        break;
      case "fade":
        this.createFadeAnimation(timeline, target, animation as FadeAnimation, originalProps);
        break;
      case "shake":
        this.createShakeAnimation(timeline, target, animation as ShakeAnimation, originalProps);
        break;
      default:
        console.warn(`Unknown animation type: ${(animation as any).type}`);
    }

    return timeline;
  }

  private createSpinAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: SpinAnimation,
    originalProps?: { rotation?: number }
  ) {
    const startRotation = originalProps?.rotation || 0;
    const degrees = animation.degrees || 360;
    const endRotation = animation.direction === "clockwise" 
      ? startRotation + degrees 
      : startRotation - degrees;

    timeline.to(target, {
      rotation: endRotation,
      duration: animation.duration,
      ease: animation.ease || "none",
      transformOrigin: "center center"
    });
  }

  private createPulseAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: PulseAnimation
  ) {
    timeline
      .to(target, {
        scaleX: animation.scaleTo,
        scaleY: animation.scaleTo,
        duration: animation.duration / 2,
        ease: animation.ease || "power2.inOut",
        transformOrigin: "center center"
      })
      .to(target, {
        scaleX: animation.scaleFrom,
        scaleY: animation.scaleFrom,
        duration: animation.duration / 2,
        ease: animation.ease || "power2.inOut",
        transformOrigin: "center center"
      });
  }

  private createBounceAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: BounceAnimation,
    originalProps?: { y?: number }
  ) {
    const startY = originalProps?.y || 0;
    
    timeline
      .to(target, {
        y: startY - animation.height,
        duration: animation.duration / 2,
        ease: "power2.out"
      })
      .to(target, {
        y: startY,
        duration: animation.duration / 2,
        ease: animation.ease || "bounce.out"
      });
  }

  private createFadeAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: FadeAnimation,
    originalProps?: { opacity?: number }
  ) {
    timeline
      .to(target, {
        opacity: animation.opacityTo,
        duration: animation.duration / 2,
        ease: animation.ease || "power2.inOut"
      })
      .to(target, {
        opacity: animation.opacityFrom,
        duration: animation.duration / 2,
        ease: animation.ease || "power2.inOut"
      });
  }

  private createShakeAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: ShakeAnimation,
    originalProps?: { x?: number; y?: number }
  ) {
    const startX = originalProps?.x || 0;
    const startY = originalProps?.y || 0;
    const intensity = animation.intensity;

    const shakeProps: any = {};
    
    if (animation.axis === "x" || animation.axis === "both") {
      shakeProps.x = `+=${intensity}`;
    }
    if (animation.axis === "y" || animation.axis === "both") {
      shakeProps.y = `+=${intensity}`;
    }

    timeline
      .to(target, {
        ...shakeProps,
        duration: animation.duration / 8,
        ease: animation.ease || "power2.inOut"
      })
      .to(target, {
        x: startX,
        y: startY,
        duration: animation.duration / 8,
        ease: animation.ease || "power2.inOut"
      })
      .repeat(7); // Total 8 shakes
  }

  private resetToOriginal(target: any, originalProps: { rotation?: number; x?: number; y?: number; opacity?: number }) {
    gsap.set(target, originalProps);
  }

  addTimeline(id: string, timeline: gsap.core.Timeline) {
    // Kill existing timeline if it exists
    const existing = this.timelines.get(id);
    if (existing) {
      existing.kill();
    }
    this.timelines.set(id, timeline);
  }

  getTimeline(id: string): gsap.core.Timeline | undefined {
    return this.timelines.get(id);
  }

  removeTimeline(id: string) {
    const timeline = this.timelines.get(id);
    if (timeline) {
      timeline.kill();
      this.timelines.delete(id);
    }
  }

  playAnimation(id: string) {
    const timeline = this.timelines.get(id);
    if (timeline) {
      timeline.play();
    }
  }

  pauseAnimation(id: string) {
    const timeline = this.timelines.get(id);
    if (timeline) {
      timeline.pause();
    }
  }

  stopAnimation(id: string, resetToOriginal = true) {
    const timeline = this.timelines.get(id);
    if (timeline) {
      if (resetToOriginal) {
        timeline.progress(0).pause();
      } else {
        timeline.pause();
      }
    }
  }

  killAllAnimations() {
    this.timelines.forEach(timeline => timeline.kill());
    this.timelines.clear();
  }

  generateAnimationId(): string {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 