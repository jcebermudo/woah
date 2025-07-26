# Dynamic Animation System Usage

This system allows you to add, remove, and manage multiple animations on shapes dynamically using GSAP.

## Key Features

### 1. **Multiple Animation Types**

- **Spin**: Rotate shapes clockwise/counterclockwise
- **Pulse**: Scale animations for breathing effects
- **Bounce**: Vertical bouncing motion
- **Fade**: Opacity transitions
- **Shake**: Jittery movement effects

### 2. **Dynamic Management**

- Add/remove animations through the UI
- Enable/disable animations individually
- Adjust duration and properties per animation
- Animations stored in shape data

### 3. **Smart Playback Control**

- `playOnSelect`: Animation plays only when shape is selected
- Auto-pause during user interactions (drag, transform, rotate)
- Auto-resume after interactions complete

## Usage Examples

### Adding Animations Programmatically

```typescript
import { AnimationManager } from "@/utils/animations";

// Create a new animation
const animationManager = new AnimationManager();
const spinAnimation: SpinAnimation = {
  id: animationManager.generateAnimationId(),
  type: "spin",
  duration: 3,
  enabled: true,
  playOnSelect: true,
  repeat: -1,
  direction: "clockwise",
  degrees: 360,
  ease: "none",
};

// Add to shape
const updatedShape = {
  ...shape,
  animations: [...(shape.animations || []), spinAnimation],
};
```

### Animation Templates

Pre-defined templates are available in `ANIMATION_TEMPLATES`:

```typescript
import { ANIMATION_TEMPLATES } from "@/utils/animations";

// Get all available animation types
ANIMATION_TEMPLATES.forEach((template) => {
  console.log(template.name, template.type, template.defaultValues);
});
```

### Custom Animation Properties

Each animation type has specific properties:

```typescript
// Spin Animation
interface SpinAnimation {
  direction: "clockwise" | "counterclockwise";
  degrees?: number; // Default 360
}

// Pulse Animation
interface PulseAnimation {
  scaleFrom: number;
  scaleTo: number;
}

// Bounce Animation
interface BounceAnimation {
  height: number;
  bounces?: number;
}

// Fade Animation
interface FadeAnimation {
  opacityFrom: number;
  opacityTo: number;
}

// Shake Animation
interface ShakeAnimation {
  intensity: number;
  axis: "x" | "y" | "both";
}
```

## UI Integration

### Properties Panel

1. Switch to "Animate" tab
2. Click "Add animation"
3. Choose from available animation types
4. Manage existing animations:
   - Toggle enabled/disabled
   - Adjust duration
   - Remove animations

### Shape Component

Animations automatically:

- Apply when shape data changes
- Pause during user interactions
- Resume after interactions
- Reset to original values when disabled

## Best Practices

1. **Performance**: Limit concurrent animations on complex scenes
2. **UX**: Use `playOnSelect: true` for non-distracting animations
3. **Timing**: Keep durations reasonable (0.5-5 seconds typically)
4. **Cleanup**: Animations auto-cleanup when components unmount

## Advanced Usage

### Creating Custom Animation Types

1. Add to animation types in `canvasElements.ts`
2. Implement in `AnimationManager.createAnimationTimeline()`
3. Add template to `ANIMATION_TEMPLATES`
4. Animation automatically available in UI

### Manual Control

```typescript
// Access animation manager in shape component
const manager = animationManagerRef.current;

// Control individual animations
manager.playAnimation(animationId);
manager.pauseAnimation(animationId);
manager.stopAnimation(animationId);
```

This system provides a complete, scalable solution for dynamic animations that integrates seamlessly with your existing shape management system.
