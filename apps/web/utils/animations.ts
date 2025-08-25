import gsap from "gsap";
import {
  ShapeAnimation,
  AnimationTemplate,
  SpinAnimation,
  PulseAnimation,
  BounceAnimation,
  FadeAnimation,
  ShakeAnimation,
  BounceUpAnimation,
} from "@/types/canvasElements";

export const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  {
    type: "bounceUp",
    name: "Bounce Up",
    defaultValues: {
      id: "",
      type: "Bounce Up",
      duration: 1,
      startTime: 0,
      enabled: true,
      playOnSelect: true,
      repeat: 0,
      startLocation: 100,
      endLocation: 0,
      ease: "elastic.out",
    },
  },
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
      repeat: 0,
      direction: "clockwise",
      degrees: 360,
      ease: "none",
    },
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
      repeat: 0,
      scaleFrom: 1,
      scaleTo: 1.2,
      ease: "power2.inOut",
    },
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
      repeat: 0,
      height: 50,
      bounces: 3,
      ease: "bounce.out",
    },
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
      repeat: 0,
      opacityFrom: 1,
      opacityTo: 0.3,
      ease: "power2.inOut",
    },
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
      ease: "power2.inOut",
    },
  },
];

export class AnimationManager {
  private timelines: Map<string, gsap.core.Timeline> = new Map();

  seekAnimationToTime(
    id: string,
    time: number,
    totalDuration: number,
    animation: ShapeAnimation,
  ) {
    const timeline = this.timelines.get(id);
    if (!timeline) return;

    const animationDuration = timeline.duration();

    if (animationDuration === 0) return;

    const animationStartTime = animation.startTime;
    const animationEndTime = animation.startTime + animation.duration;

    if (time < animationStartTime) {
      timeline.pause().progress(0);
      // Get the target from the timeline's tweens
      const animationData = (timeline as any)._animationData;
      if (animationData && timeline.getChildren) {
        timeline.getChildren().forEach((tween: any) => {
          if (tween.target && animationData.originalProps) {
            // Reset to original rotation without triggering animation
            gsap.set(tween.target, {
              rotation: animationData.originalProps.rotation || 0,
              x: animationData.originalProps.x || tween.target.x(),
              y: animationData.originalProps.y || tween.target.y(),
              opacity: animationData.originalProps.opacity || 1,
            });

            // Force redraw
            if (tween.target.getLayer) {
              tween.target.getLayer()?.batchDraw();
            }
          }
        });
      }
      return;
    }

    if (animation.repeat === 0 && time >= animationEndTime) {
      timeline.pause().progress(1);
      return;
    }

    const relativeTime = time - animationStartTime;
    let progress = 0;

    if (animation.repeat === -1) {
      // For infinite animations, loop the progress
      progress = (relativeTime % animationDuration) / animationDuration;
    } else if (animation.repeat === 0) {
      // For single-play animations, clamp progress between 0 and 1
      progress = Math.min(1, Math.max(0, relativeTime / animationDuration));
    } else {
      // Handle finite repeating animations
      const repeatCount = (animation.repeat ?? 0) + 1;
      const totalAnimationTime = animationDuration * repeatCount;

      if (relativeTime <= totalAnimationTime) {
        // Animation is active, calculate looped progress
        progress = (relativeTime % animationDuration) / animationDuration;
      } else {
        // Animation has completed, show final state
        progress = 1;
      }
    }

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

  refreshAnimationState(
    id: string,
    currentTime: number,
    totalDuration: number,
    animation: ShapeAnimation,
  ) {
    const timeline = this.timelines.get(id);
    if (!timeline) return;

    // Force the timeline to update its visual state
    this.seekAnimationToTime(id, currentTime, totalDuration, animation);

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
    originalProps?: {
      rotation?: number;
      x?: number;
      y?: number;
      opacity?: number;
    },
  ): gsap.core.Timeline {
    const timeline = gsap.timeline({
      repeat: animation.repeat ?? 0,
      paused: true,
      onComplete: () => {
        if (animation.repeat !== -1) {
          // Persist final animation values as new shapeProps
          const finalX = target.x();
          const finalY = target.y();
          const finalRotation = target.rotation();
          const finalOpacity = target.opacity?.();

          // call the shape's onChange (you’ll need to pass it in)
          if (target._onChange) {
            target._onChange({
              ...target,
              x: finalX,
              y: finalY,
              rotation: finalRotation,
              opacity: finalOpacity,
            });
          }
        }
      },
    });

    const safeOriginalProps = {
      rotation: originalProps?.rotation || 0,
      x: originalProps?.x || target.x?.() || 0,
      y: originalProps?.y || target.y?.() || 0,
      opacity: originalProps?.opacity || 1,
      ...originalProps,
    };

    // Store animation reference with timeline for later use
    (timeline as any)._animationData = {
      ...animation,
      originalProps: safeOriginalProps,
    };

    // ... rest of the method remains the same
    switch (animation.type) {
      case "Bounce Up":
        this.createBounceUpAnimation(
          timeline,
          target,
          animation as BounceUpAnimation,
          safeOriginalProps,
        );
        break;
      case "spin":
        this.createSpinAnimation(
          timeline,
          target,
          animation as SpinAnimation,
          safeOriginalProps,
        );
        break;
      case "pulse":
        this.createPulseAnimation(
          timeline,
          target,
          animation as PulseAnimation,
        );
        break;
      case "bounce":
        this.createBounceAnimation(
          timeline,
          target,
          animation as BounceAnimation,
          safeOriginalProps,
        );
        break;
      case "fade":
        this.createFadeAnimation(
          timeline,
          target,
          animation as FadeAnimation,
          safeOriginalProps,
        );
        break;
      case "shake":
        this.createShakeAnimation(
          timeline,
          target,
          animation as ShakeAnimation,
          safeOriginalProps,
        );
        break;
      default:
        console.warn(`Unknown animation type: ${(animation as any).type}`);
    }

    return timeline;
  }

  private createBounceUpAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: BounceUpAnimation,
    originalProps?: { y?: number },
  ) {
    const startY = (originalProps?.y || 0) + animation.startLocation;
    const endY = originalProps?.y || 0;
    timeline.fromTo(
      target,
      { y: startY }, // use startLocation instead of originalProps?.y
      {
        y: endY,
        duration: animation.duration,
        ease: animation.ease || "power2.inOut",
      },
    );
  }

  private createSpinAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: SpinAnimation,
    originalProps?: { rotation?: number },
  ) {
    const startRotation = originalProps?.rotation || 0;
    const degrees = animation.degrees || 360;
    const endRotation =
      animation.direction === "clockwise"
        ? startRotation + degrees
        : startRotation - degrees;

    // Set initial state
    gsap.set(target, { rotation: startRotation });

    // Create the animation
    timeline.to(target, {
      rotation: endRotation,
      duration: animation.duration,
      ease: animation.ease || "none",
      transformOrigin: "center center",
    });
  }

  private createPulseAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: PulseAnimation,
  ) {
    // Set initial state
    gsap.set(target, {
      scaleX: animation.scaleFrom,
      scaleY: animation.scaleFrom,
    });

    // Create the animation
    timeline
      .to(target, {
        scaleX: animation.scaleTo,
        scaleY: animation.scaleTo,
        duration: animation.duration / 2,
        ease: animation.ease || "power2.inOut",
        transformOrigin: "center center",
      })
      .to(target, {
        scaleX: animation.scaleFrom,
        scaleY: animation.scaleFrom,
        duration: animation.duration / 2,
        ease: animation.ease || "power2.inOut",
        transformOrigin: "center center",
      });
  }

  private createBounceAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: BounceAnimation,
    originalProps?: { y?: number },
  ) {
    const startY = originalProps?.y || 0;

    // Set initial state
    gsap.set(target, { y: startY });

    timeline
      .to(target, {
        y: startY - animation.height,
        duration: animation.duration / 2,
        ease: "power2.out",
      })
      .to(target, {
        y: startY,
        duration: animation.duration / 2,
        ease: animation.ease || "bounce.out",
      });
  }

  private createFadeAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: FadeAnimation,
    originalProps?: { opacity?: number },
  ) {
    // Set initial state
    gsap.set(target, { opacity: animation.opacityFrom });

    timeline
      .to(target, {
        opacity: animation.opacityTo,
        duration: animation.duration / 2,
        ease: animation.ease || "power2.inOut",
      })
      .to(target, {
        opacity: animation.opacityFrom,
        duration: animation.duration / 2,
        ease: animation.ease || "power2.inOut",
      });
  }

  private createShakeAnimation(
    timeline: gsap.core.Timeline,
    target: any,
    animation: ShakeAnimation,
    originalProps?: { x?: number; y?: number },
  ) {
    const startX = originalProps?.x || 0;
    const startY = originalProps?.y || 0;
    const intensity = animation.intensity;

    // Set initial state
    gsap.set(target, { x: startX, y: startY });

    const shakeProps: any = {};

    if (animation.axis === "x" || animation.axis === "both") {
      shakeProps.x = startX + intensity;
    }
    if (animation.axis === "y" || animation.axis === "both") {
      shakeProps.y = startY + intensity;
    }

    // Create a more controlled shake pattern
    for (let i = 0; i < 8; i++) {
      const direction = i % 2 === 0 ? 1 : -1;
      const currentIntensity = intensity * direction * (1 - i / 8); // Diminishing intensity

      const shakeStep: any = {};
      if (animation.axis === "x" || animation.axis === "both") {
        shakeStep.x = startX + currentIntensity;
      }
      if (animation.axis === "y" || animation.axis === "both") {
        shakeStep.y = startY + currentIntensity;
      }

      timeline.to(target, {
        ...shakeStep,
        duration: animation.duration / 8,
        ease: animation.ease || "power2.inOut",
      });
    }

    // Return to original position
    timeline.to(target, {
      x: startX,
      y: startY,
      duration: animation.duration / 8,
      ease: animation.ease || "power2.inOut",
    });
  }

  private resetToOriginal(
    target: any,
    originalProps: {
      rotation?: number;
      x?: number;
      y?: number;
      opacity?: number;
    },
  ) {
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
    this.timelines.forEach((timeline) => timeline.kill());
    this.timelines.clear();
  }

  generateAnimationId(): string {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
